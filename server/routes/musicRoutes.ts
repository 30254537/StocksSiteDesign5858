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

const musicUpload = multer({ storage: musicStorage });

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
    res.status(500).json({ message: '创建音乐时出错', error: String(error) });
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
    res.status(500).json({ message: '更新音乐时出错', error: String(error) });
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
    res.status(500).json({ message: '删除音乐时出错', error: String(error) });
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
    if (!req.file) {
      return res.status(400).json({ message: '没有提供音乐文件' });
    }

    // 文件上传成功，生成URL
    const fileUrl = `/uploads/music/${req.file.filename}`;
    
    // 获取音频时长
    let duration = 0;
    try {
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      duration = await getAudioDurationInSeconds(filePath);
    } catch (error) {
      console.warn('无法获取音频时长:', error);
    }
    
    res.status(200).json({
      url: fileUrl,
      duration,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('音乐文件上传错误:', error);
    res.status(500).json({ message: '上传音乐文件时出错', error: String(error) });
  }
});

export const setupMusicRoutes = (app: Router) => {
  app.use('/music', musicRouter);
};