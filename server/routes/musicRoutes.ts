import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertMusicTrackSchema } from '@shared/schema';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const musicRouter = Router();

// 音乐文件上传配置
const musicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('音乐路由: 成功创建音乐上传目录:', uploadDir);
        // 确保目录权限正确
        fs.chmodSync(uploadDir, 0o777);
        console.log('音乐路由: 设置音乐上传目录权限为777');
      }
      cb(null, uploadDir);
    } catch (err) {
      console.error('音乐路由: 创建音乐上传目录失败:', err);
      // 尝试使用备用目录
      const fallbackDir = path.join(process.cwd(), 'public');
      console.log('音乐路由: 使用备用目录:', fallbackDir);
      cb(null, fallbackDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 设置更严格的文件限制和过滤器
const musicUpload = multer({
  storage: musicStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1  // 最多1个文件
  },
  fileFilter: (req, file, cb) => {
    // 允许的音频文件类型
    if (file.mimetype.startsWith('audio/')) {
      console.log('接受文件上传，MIME类型:', file.mimetype);
      cb(null, true);
    } else {
      console.log('拒绝文件上传，不支持的MIME类型:', file.mimetype);
      cb(new Error(`不支持的文件类型：${file.mimetype}，只接受音频文件`));
    }
  }
});

// 获取所有音乐
musicRouter.get('/', async (req: Request, res: Response) => {
  try {
    const musicTracks = await storage.getMusicTracks();
    res.status(200).json(musicTracks);
  } catch (error) {
    console.error('获取音乐列表错误:', error);
    res.status(500).json({ message: '获取音乐列表时出错', error: String(error) });
  }
});

// 获取单个音乐
musicRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID必须是一个数字' });
    }
    
    const musicTrack = await storage.getMusicTrack(id);
    if (!musicTrack) {
      return res.status(404).json({ message: '未找到音乐' });
    }
    
    res.status(200).json(musicTrack);
  } catch (error) {
    console.error('获取音乐错误:', error);
    res.status(500).json({ message: '获取音乐时出错', error: String(error) });
  }
});

// 添加新音乐 - JSON请求
musicRouter.post('/', async (req: Request, res: Response) => {
  try {
    // 验证请求体
    const validationResult = insertMusicTrackSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: '请求数据格式不正确',
        errors: validationResult.error.format()
      });
    }
    
    const musicData = validationResult.data;
    
    // 如果提供了URL，可以尝试获取音频时长
    try {
      if (musicData.url) {
        // 如果URL是绝对路径，需要确保它是相对于服务器根目录的本地文件
        let filePath = musicData.url;
        if (filePath.startsWith('/')) {
          filePath = path.join(process.cwd(), filePath.substring(1));
        }
        
        if (fs.existsSync(filePath)) {
          const duration = await getAudioDurationInSeconds(filePath);
          musicData.duration = duration;
        }
      }
    } catch (error) {
      console.warn('无法获取音频时长:', error);
      // 使用默认时长或者0
      musicData.duration = 0;
    }
    
    // 保存到数据库
    const newMusicTrack = await storage.createMusicTrack(musicData);
    
    res.status(201).json(newMusicTrack);
  } catch (error) {
    console.error('创建音乐错误:', error);
    
    // 检查是否是目录创建错误
    if (String(error).includes('ENOENT') || String(error).includes('permission')) {
      // 尝试创建目录
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
          fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
          console.log('创建了上传目录:', path.join(process.cwd(), 'public', 'uploads'));
        }
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.chmodSync(uploadDir, 0o777);
          console.log('创建了音乐上传目录，并设置了权限:', uploadDir);
          
          // 目录创建成功后，返回自定义错误提示用户重试
          return res.status(500).json({ 
            message: '上传目录刚刚创建完成，请重试上传', 
            directoryCreated: true 
          });
        }
      } catch (dirError) {
        console.error('尝试创建目录失败:', dirError);
      }
    }
    
    res.status(500).json({ 
      message: '创建音乐时出错', 
      error: String(error),
      errorType: typeof error,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
});

// 更新音乐
musicRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID必须是一个数字' });
    }
    
    // 检查音乐是否存在
    const existingMusic = await storage.getMusicTrack(id);
    if (!existingMusic) {
      return res.status(404).json({ message: '未找到要更新的音乐' });
    }
    
    // 验证请求体
    const validationSchema = insertMusicTrackSchema.partial(); // 部分更新
    const validationResult = validationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: '请求数据格式不正确',
        errors: validationResult.error.format()
      });
    }
    
    const musicData = validationResult.data;
    
    // 如果提供了新的URL，尝试获取音频时长
    if (musicData.url && musicData.url !== existingMusic.url) {
      try {
        // 如果URL是绝对路径，需要确保它是相对于服务器根目录的本地文件
        let filePath = musicData.url;
        if (filePath.startsWith('/')) {
          filePath = path.join(process.cwd(), filePath.substring(1));
        }
        
        if (fs.existsSync(filePath)) {
          const duration = await getAudioDurationInSeconds(filePath);
          musicData.duration = duration;
        }
      } catch (error) {
        console.warn('无法获取音频时长:', error);
        // 保持原来的时长或设置为0
        if (!musicData.duration) {
          musicData.duration = existingMusic.duration || 0;
        }
      }
    }
    
    // 更新数据库
    const updatedMusic = await storage.updateMusicTrack(id, musicData);
    if (!updatedMusic) {
      return res.status(500).json({ message: '更新音乐失败' });
    }
    
    res.status(200).json(updatedMusic);
  } catch (error) {
    console.error('更新音乐错误:', error);
    
    // 检查是否是目录创建错误
    if (String(error).includes('ENOENT') || String(error).includes('permission')) {
      // 尝试创建目录
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
          fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
          console.log('创建了上传目录:', path.join(process.cwd(), 'public', 'uploads'));
        }
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.chmodSync(uploadDir, 0o777);
          console.log('创建了音乐上传目录，并设置了权限:', uploadDir);
          
          // 目录创建成功后，返回自定义错误提示用户重试
          return res.status(500).json({ 
            message: '上传目录刚刚创建完成，请重试上传', 
            directoryCreated: true 
          });
        }
      } catch (dirError) {
        console.error('尝试创建目录失败:', dirError);
      }
    }
    
    res.status(500).json({ 
      message: '更新音乐时出错', 
      error: String(error),
      errorType: typeof error,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
});

// 删除音乐
musicRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID必须是一个数字' });
    }
    
    // 检查音乐是否存在
    const existingMusic = await storage.getMusicTrack(id);
    if (!existingMusic) {
      return res.status(404).json({ message: '未找到要删除的音乐' });
    }
    
    // 删除文件（如果音乐文件是上传的本地文件）
    if (existingMusic.url && existingMusic.url.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', existingMusic.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('音乐文件已删除:', filePath);
        }
      } catch (error) {
        console.warn('删除音乐文件失败:', error);
        // 继续删除数据库记录，即使文件删除失败
      }
    }
    
    // 从数据库中删除
    const result = await storage.deleteMusicTrack(id);
    if (!result) {
      return res.status(500).json({ message: '删除音乐失败' });
    }
    
    res.status(200).json({ message: '音乐已成功删除', id });
  } catch (error) {
    console.error('删除音乐错误:', error);
    
    // 检查是否是目录创建错误
    if (String(error).includes('ENOENT') || String(error).includes('permission')) {
      // 尝试创建目录
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
          fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
          console.log('创建了上传目录:', path.join(process.cwd(), 'public', 'uploads'));
        }
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.chmodSync(uploadDir, 0o777);
          console.log('创建了音乐上传目录，并设置了权限:', uploadDir);
          
          // 目录创建成功后，返回自定义错误提示用户重试
          return res.status(500).json({ 
            message: '上传目录刚刚创建完成，请重试删除', 
            directoryCreated: true 
          });
        }
      } catch (dirError) {
        console.error('尝试创建目录失败:', dirError);
      }
    }
    
    res.status(500).json({ 
      message: '删除音乐时出错', 
      error: String(error),
      errorType: typeof error,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
});

// 根据风格获取音乐
/* 由于目前数据库中没有style列，我们暂时注释掉这个端点
musicRouter.get('/style/:style', async (req: Request, res: Response) => {
  try {
    const style = req.params.style;
    const musicTracks = await storage.getMusicTracksByStyle(style);
    res.status(200).json(musicTracks);
  } catch (error) {
    console.error('根据风格获取音乐错误:', error);
    res.status(500).json({ message: '获取音乐列表时出错', error: String(error) });
  }
});
*/

// 音乐文件上传端点
musicRouter.post('/upload', musicUpload.single('musicFile'), async (req: Request, res: Response) => {
  try {
    // 确保设置正确的内容类型头
    res.setHeader('Content-Type', 'application/json');
    
    if (!req.file) {
      console.error('上传失败：没有接收到文件');
      return res.status(400).json({ message: '没有提供音乐文件' });
    }

    console.log('音乐上传成功，文件信息:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 检查文件是否已成功保存
    const fileUrl = `/uploads/music/${req.file.filename}`;
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    
    try {
      const stats = fs.statSync(filePath);
      console.log(`文件已保存，大小: ${stats.size} 字节，位置: ${filePath}`);
      if (stats.size === 0) {
        console.error('文件大小为0，可能未正确保存');
        return res.status(500).json({ 
          message: '文件上传出错：文件大小为0，请重试' 
        });
      }
    } catch (statError) {
      console.error(`文件未正确保存到 ${filePath}:`, statError);
      return res.status(500).json({ 
        message: '文件未能正确保存，请重试', 
        error: String(statError) 
      });
    }
    
    // 获取音频时长
    let duration = 0;
    try {
      if (fs.existsSync(filePath)) {
        console.log('音频文件路径存在:', filePath);
        duration = await getAudioDurationInSeconds(filePath);
        console.log('获取到音频时长:', duration);
      } else {
        console.warn('音频文件路径不存在:', filePath);
      }
    } catch (error) {
      console.warn('无法获取音频时长:', error);
    }
    
    // 构建音乐元数据
    const musicData = {
      url: fileUrl,
      duration,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      title: req.body.title,
      artist: req.body.artist || 'Unknown Artist',
      style: req.body.style || 'General'
    };

    console.log('返回音乐上传数据:', musicData);
    
    res.status(200).json(musicData);
  } catch (error) {
    console.error('音乐文件上传错误:', error);
    
    // 确保错误响应也是JSON格式
    res.setHeader('Content-Type', 'application/json');
    
    // 检查是否是目录创建错误
    if (String(error).includes('ENOENT') || String(error).includes('permission')) {
      // 尝试创建目录
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
          fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
          console.log('创建了上传目录:', path.join(process.cwd(), 'public', 'uploads'));
        }
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.chmodSync(uploadDir, 0o777);
          console.log('创建了音乐上传目录，并设置了权限:', uploadDir);
          
          // 目录创建成功后，返回自定义错误提示用户重试
          return res.status(500).json({ 
            message: '上传目录刚刚创建完成，请重试上传', 
            directoryCreated: true 
          });
        }
      } catch (dirError) {
        console.error('尝试创建目录失败:', dirError);
      }
    }
    
    res.status(500).json({ 
      message: '上传音乐文件时出错', 
      error: String(error),
      errorType: typeof error,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
});

// 添加测试端点
musicRouter.post('/test', (req: Request, res: Response) => {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
    const canWrite = fs.accessSync(uploadDir, fs.constants.W_OK);
    
    res.status(200).json({
      message: '音乐API测试成功',
      body: req.body,
      dirExists: fs.existsSync(uploadDir),
      uploadDir,
      dirStat: fs.statSync(uploadDir),
      canWrite: canWrite === undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: '音乐API测试失败',
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

// 在单独上传端点添加详细日志
musicRouter.post('/simple-upload', musicUpload.single('musicFile'), (req: Request, res: Response) => {
  try {
    console.log('简单上传接收到请求:', {
      headers: req.headers,
      file: req.file,
      body: req.body
    });
    
    if (!req.file) {
      return res.status(400).json({ message: '无文件上传' });
    }
    
    // 确保设置正确的内容类型
    res.setHeader('Content-Type', 'application/json');
    
    // 转换文件对象为可序列化的格式
    const fileInfo = req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    } : null;
    
    res.status(200).json({
      message: '文件上传成功',
      file: fileInfo,
    });
  } catch (error) {
    console.error('简单上传错误:', error);
    // 确保错误响应也是JSON格式
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      message: '上传错误',
      error: String(error)
    });
  }
});

export const setupMusicRoutes = (app: Router) => {
  app.use('/music', musicRouter);
};