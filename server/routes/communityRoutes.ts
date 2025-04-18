import type { Express } from "express";
import { storage } from "../storage";
import { insertCommunityActivitySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// 配置multer用于处理社区活动图片上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve("public/uploads/community");
      
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'community-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

// 设置社区活动路由
export function setupCommunityRoutes(app: Express) {
  // 删除社区活动中的单个图片（需要管理员权限）
  app.delete('/api/community/:id/image', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const { imageUrl } = req.body;
      const activityId = parseInt(id);
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: '缺少必要的图片URL参数' });
      }
      
      // 获取活动信息
      const activity = await storage.getCommunityActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: '未找到指定的社区活动' });
      }
      
      // 检查图片是否存在于imageUrls数组中
      if (!activity.imageUrls || !Array.isArray(activity.imageUrls) || !activity.imageUrls.includes(imageUrl)) {
        return res.status(404).json({ message: '指定的图片不存在于该活动中' });
      }
      
      // 物理删除文件
      if (imageUrl && imageUrl.startsWith('/uploads/community/')) {
        const imagePath = path.resolve(`public${imageUrl}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`已删除社区活动图片: ${imagePath}`);
          } catch (err) {
            console.error(`删除社区活动图片时出错:`, err);
            // 继续执行数据库更新，即使物理文件删除失败
          }
        }
      }
      
      // 更新数据库中的图片数组
      const updatedImageUrls = activity.imageUrls.filter(img => img !== imageUrl);
      
      // 如果删除的是主图片，需要更新主图片字段
      let updatedImageUrl = activity.imageUrl;
      if (activity.imageUrl === imageUrl) {
        updatedImageUrl = updatedImageUrls.length > 0 ? updatedImageUrls[0] : '';
      }
      
      // 更新活动记录
      const updatedActivity = await storage.updateCommunityActivity(activityId, {
        ...activity,
        imageUrl: updatedImageUrl,
        imageUrls: updatedImageUrls
      });
      
      if (!updatedActivity) {
        return res.status(500).json({ message: '更新社区活动失败' });
      }
      
      res.json(updatedActivity);
    } catch (error) {
      console.error('删除社区活动图片时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  // 获取所有社区活动（有限制参数）
  app.get('/api/community', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getCommunityActivities(limit);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(activities);
    } catch (error) {
      console.error('获取社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 获取活跃（当前和未来）社区活动
  app.get('/api/community/active', async (req, res) => {
    try {
      const activities = await storage.getActiveActivities();
      res.json(activities);
    } catch (error) {
      console.error('获取活跃社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 获取特定ID的社区活动
  app.get('/api/community/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await storage.getCommunityActivity(parseInt(id));
      
      if (!activity) {
        res.status(404).json({ message: '未找到指定的社区活动' });
        return;
      }
      
      res.json(activity);
    } catch (error) {
      console.error('获取社区活动详情时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 添加社区活动（需要管理员权限）- 支持多图片上传
  app.post('/api/community', upload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      console.log("收到社区活动添加请求，表单数据:", req.body);
      console.log("上传的文件:", req.files);

      // 处理上传的图片文件
      let imageUrl = req.body.imageUrl || '';
      let imageUrls: string[] = [];

      // 如果存在已上传的图片
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // 处理所有上传的图片
        imageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/community/${file.filename}`
        );
        
        // 使用第一张图片作为主图片（保留兼容性）
        imageUrl = imageUrls[0];
        
        console.log(`上传了 ${req.files.length} 张图片:`, imageUrls);
      } else if (req.body.imageUrl) {
        // 如果没有上传新图片但有提供imageUrl，确保imageUrls包含它
        imageUrl = req.body.imageUrl;
        imageUrls = [imageUrl];
        console.log("使用已提供的图片URL:", imageUrl);
      }

      // 合并表单数据和图片URL，并确保字段格式正确
      let formData = {
        ...req.body,
        imageUrl,
        imageUrls,
        // 统一处理布尔值字段
        isActive: req.body.isActive === 'true' || req.body.isActive === '1' || req.body.isActive === true, 
        isOnline: req.body.isOnline === 'true' || req.body.isOnline === '1' || req.body.isOnline === true || req.body.isOnline === undefined
      };
      
      console.log('原始字段值:', {
        isActive: req.body.isActive,
        isOnline: req.body.isOnline,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      
      // 处理日期字段
      if (formData.startDate && typeof formData.startDate === 'string' && formData.startDate.trim() !== '') {
        try {
          formData.startDate = new Date(formData.startDate);
          console.log('处理后的开始日期:', formData.startDate);
        } catch (e) {
          console.error('无法解析开始日期:', formData.startDate, e);
          delete formData.startDate;
        }
      } else if (formData.startDate === '') {
        delete formData.startDate;
      }
      
      if (formData.endDate && typeof formData.endDate === 'string' && formData.endDate.trim() !== '') {
        try {
          formData.endDate = new Date(formData.endDate);
          console.log('处理后的结束日期:', formData.endDate);
        } catch (e) {
          console.error('无法解析结束日期:', formData.endDate, e);
          delete formData.endDate;
        }
      } else if (formData.endDate === '') {
        delete formData.endDate;
      }

      console.log('即将验证社区活动表单数据:', JSON.stringify(formData, null, 2));
      
      try {
        // 确保这些字段是必填的
        if (!formData.title) {
          return res.status(400).json({ message: '标题不能为空' });
        }
        
        if (!formData.content) {
          return res.status(400).json({ message: '内容不能为空' });
        }
        
        // 使用insertCommunityActivitySchema验证和转换数据
        const activityData = insertCommunityActivitySchema.parse({
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          imageUrls: formData.imageUrls || [],
          location: formData.location || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          isActive: formData.isActive,
          isOnline: formData.isOnline
        });
        
        console.log('社区活动表单数据验证成功:', JSON.stringify(activityData, null, 2));
        
        // 创建活动
        const newActivity = await storage.createCommunityActivity(activityData);
        console.log('社区活动创建成功:', JSON.stringify(newActivity, null, 2));
        
        res.status(200).json(newActivity);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('社区活动表单数据验证失败:', JSON.stringify(validationError.errors, null, 2));
          res.status(400).json({ message: '数据验证失败', errors: validationError.errors });
        } else {
          console.error('社区活动创建其他错误:', validationError);
          res.status(500).json({ message: '服务器内部错误', error: String(validationError) });
        }
      }
    } catch (error) {
      console.error('创建社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误', error: String(error) });
    }
  });
  
  // 保留旧的路由以确保兼容性
  app.post('/api/admin/community', upload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      // 处理上传的图片文件
      let imageUrl = req.body.imageUrl || '';
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // 使用第一张图片作为主图片
        imageUrl = `/uploads/community/${req.files[0].filename}`;
      }

      // 合并表单数据和图片URL，并处理日期格式
      let formData = {
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === 'true'
      };
      
      // 处理日期字段
      if (formData.startDate && typeof formData.startDate === 'string' && formData.startDate.trim() !== '') {
        try {
          formData.startDate = new Date(formData.startDate);
        } catch (e) {
          console.error('无法解析开始日期:', formData.startDate, e);
          delete formData.startDate;
        }
      } else if (formData.startDate === '') {
        delete formData.startDate;
      }
      
      if (formData.endDate && typeof formData.endDate === 'string' && formData.endDate.trim() !== '') {
        try {
          formData.endDate = new Date(formData.endDate);
        } catch (e) {
          console.error('无法解析结束日期:', formData.endDate, e);
          delete formData.endDate;
        }
      } else if (formData.endDate === '') {
        delete formData.endDate;
      }

      const activityData = insertCommunityActivitySchema.parse(formData);
      const newActivity = await storage.createCommunityActivity(activityData);
      res.status(201).json(newActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: '数据验证失败', errors: error.errors });
      } else {
        console.error('创建社区活动时出错:', error);
        res.status(500).json({ message: '服务器错误' });
      }
    }
  });

  // 更新社区活动（需要管理员权限）- 支持多图片上传
  app.put('/api/community/:id', upload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      console.log("\n=== 社区活动编辑请求 ===");
      console.log("路径参数ID:", req.params.id);
      console.log("表单数据:", req.body);
      
      // 解析ID
      const { id } = req.params;
      const activityId = parseInt(id);
      
      // 获取现有活动信息
      const existingActivity = await storage.getCommunityActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: '未找到指定的社区活动' });
      }
      
      console.log("现有活动数据:", existingActivity);
      
      // 构建基本活动数据
      let updatedActivity: any = {
        id: activityId,
        title: req.body.title,
        content: req.body.content,
        location: req.body.location || existingActivity.location,
        isActive: req.body.isActive === 'true' || req.body.isActive === '1',
        isOnline: req.body.isOnline === 'true' || req.body.isOnline === '1' || existingActivity.isOnline,
      };
      
      // 处理日期
      if (req.body.startDate && req.body.startDate.trim() !== '') {
        try {
          updatedActivity.startDate = new Date(req.body.startDate);
        } catch (e) {
          console.warn('无法解析开始日期:', req.body.startDate);
        }
      } else if (existingActivity.startDate) {
        updatedActivity.startDate = existingActivity.startDate;
      }
      
      if (req.body.endDate && req.body.endDate.trim() !== '') {
        try {
          updatedActivity.endDate = new Date(req.body.endDate);
        } catch (e) {
          console.warn('无法解析结束日期:', req.body.endDate);
        }
      } else if (existingActivity.endDate) {
        updatedActivity.endDate = existingActivity.endDate;
      }
      
      // 处理图片 - 分两步走：1. 处理现有图片 2. 处理新上传图片
      
      // Step 1: 处理现有图片 - 是否保留或删除
      let existingImageUrls: string[] = [];
      
      // 如果表单传递了existingImageUrls，使用它们
      if (req.body.existingImageUrls) {
        if (Array.isArray(req.body.existingImageUrls)) {
          existingImageUrls = req.body.existingImageUrls.map(url => String(url));
          console.log("使用表单提供的多个现有图片:", existingImageUrls);
        } else if (typeof req.body.existingImageUrls === 'string') {
          existingImageUrls = [req.body.existingImageUrls];
          console.log("使用表单提供的单个现有图片:", existingImageUrls);
        }
      } 
      // 如果表单没有传递existingImageUrls但传递了imageUrl，则使用它
      else if (req.body.imageUrl) {
        existingImageUrls = [req.body.imageUrl];
        console.log("使用表单提供的主图片URL:", existingImageUrls);
      } 
      // 如果表单没有传递任何现有图片相关信息，则保留所有现有图片
      else {
        // 保留原有图片
        if (existingActivity.imageUrl && !existingImageUrls.includes(existingActivity.imageUrl)) {
          existingImageUrls.push(existingActivity.imageUrl);
        }
        
        if (existingActivity.imageUrls && Array.isArray(existingActivity.imageUrls)) {
          existingActivity.imageUrls.forEach(url => {
            if (url && !existingImageUrls.includes(url)) {
              existingImageUrls.push(url);
            }
          });
        }
        
        console.log("保留所有现有图片:", existingImageUrls);
      }
      
      // Step 2: 处理新上传的图片
      const newImageUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log("有新上传的图片文件:", req.files.length, "个");
        
        for (const file of req.files as Express.Multer.File[]) {
          const imageUrl = `/uploads/community/${file.filename}`;
          newImageUrls.push(imageUrl);
          console.log("新增图片:", imageUrl);
        }
      }
      
      // 综合处理图片
      let finalImageUrls = [...existingImageUrls, ...newImageUrls];
      
      // 确保至少有一张图片作为主图片
      let mainImageUrl = '';
      if (finalImageUrls.length > 0) {
        mainImageUrl = finalImageUrls[0];
        // 如果有新上传的图片，使用第一张新图片作为主图
        if (newImageUrls.length > 0) {
          mainImageUrl = newImageUrls[0];
        }
      }
      
      // 完整更新数据
      const finalUpdateData = {
        ...updatedActivity,
        imageUrl: mainImageUrl,
        imageUrls: finalImageUrls
      };
      
      console.log("最终更新数据:", finalUpdateData);
      
      // 执行数据库更新
      const result = await storage.updateCommunityActivity(activityId, finalUpdateData);
      
      if (!result) {
        return res.status(404).json({ message: '更新社区活动失败，未找到活动或数据库错误' });
      }
      
      console.log("更新社区活动成功:", result);
      console.log("=== 社区活动编辑完成 ===\n");
      
      res.json(result);
    } catch (error) {
      console.error('更新社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误', error: String(error) });
    }
  });
  
  // 保留旧的路由以确保兼容性
  app.put('/api/admin/community/:id', upload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const activityId = parseInt(id);
      
      // 获取现有活动信息
      const existingActivity = await storage.getCommunityActivity(activityId);
      if (!existingActivity) {
        return res.status(404).json({ message: '未找到指定的社区活动' });
      }
      
      // 处理上传的图片文件
      let imageUrl = req.body.imageUrl || existingActivity.imageUrl || '';
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // 使用第一张图片作为主图片
        imageUrl = `/uploads/community/${req.files[0].filename}`;
        
        // 如果上传了新图片且原来有图片，可以删除旧图片
        if (existingActivity.imageUrl && existingActivity.imageUrl.startsWith('/uploads/community/')) {
          const oldImagePath = path.resolve(`public${existingActivity.imageUrl}`);
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log(`已删除旧图片: ${oldImagePath}`);
            } catch (err) {
              console.error(`删除旧图片时出错:`, err);
            }
          }
        }
      }

      // 合并表单数据和图片URL，并处理日期格式
      let formData = {
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === 'true'
      };
      
      // 处理日期字段
      if (formData.startDate && typeof formData.startDate === 'string' && formData.startDate.trim() !== '') {
        try {
          formData.startDate = new Date(formData.startDate);
        } catch (e) {
          console.error('无法解析开始日期:', formData.startDate, e);
          delete formData.startDate;
        }
      } else if (formData.startDate === '') {
        delete formData.startDate;
      }
      
      if (formData.endDate && typeof formData.endDate === 'string' && formData.endDate.trim() !== '') {
        try {
          formData.endDate = new Date(formData.endDate);
        } catch (e) {
          console.error('无法解析结束日期:', formData.endDate, e);
          delete formData.endDate;
        }
      } else if (formData.endDate === '') {
        delete formData.endDate;
      }
      
      const updatedActivity = await storage.updateCommunityActivity(activityId, formData);
      
      if (!updatedActivity) {
        res.status(404).json({ message: '未找到指定的社区活动' });
        return;
      }
      
      res.json(updatedActivity);
    } catch (error) {
      console.error('更新社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 删除社区活动（需要管理员权限）
  app.delete('/api/community/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const activityId = parseInt(id);
      
      // 获取活动信息，以便删除相关图片
      const activity = await storage.getCommunityActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: '未找到指定的社区活动' });
      }
      
      // 删除主图片文件
      if (activity.imageUrl && activity.imageUrl.startsWith('/uploads/community/')) {
        const imagePath = path.resolve(`public${activity.imageUrl}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`已删除社区活动主图片: ${imagePath}`);
          } catch (err) {
            console.error(`删除社区活动主图片时出错:`, err);
          }
        }
      }
      
      // 删除所有附加图片文件
      if (activity.imageUrls && Array.isArray(activity.imageUrls) && activity.imageUrls.length > 0) {
        activity.imageUrls.forEach(imgUrl => {
          if (imgUrl && imgUrl.startsWith('/uploads/community/')) {
            const imagePath = path.resolve(`public${imgUrl}`);
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
                console.log(`已删除社区活动附加图片: ${imagePath}`);
              } catch (err) {
                console.error(`删除社区活动附加图片时出错:`, err);
              }
            }
          }
        });
      }
      
      // 执行删除操作
      const success = await storage.deleteCommunityActivity(activityId);
      
      if (!success) {
        res.status(500).json({ message: '删除社区活动失败' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 保留旧的路由以确保兼容性
  app.delete('/api/admin/community/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const activityId = parseInt(id);
      
      // 获取活动信息，以便删除相关图片
      const activity = await storage.getCommunityActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: '未找到指定的社区活动' });
      }
      
      // 删除主图片文件
      if (activity.imageUrl && activity.imageUrl.startsWith('/uploads/community/')) {
        const imagePath = path.resolve(`public${activity.imageUrl}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`已删除社区活动主图片: ${imagePath}`);
          } catch (err) {
            console.error(`删除社区活动主图片时出错:`, err);
          }
        }
      }
      
      // 删除所有附加图片文件
      if (activity.imageUrls && Array.isArray(activity.imageUrls) && activity.imageUrls.length > 0) {
        activity.imageUrls.forEach(imgUrl => {
          if (imgUrl && imgUrl.startsWith('/uploads/community/')) {
            const imagePath = path.resolve(`public${imgUrl}`);
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
                console.log(`已删除社区活动附加图片: ${imagePath}`);
              } catch (err) {
                console.error(`删除社区活动附加图片时出错:`, err);
              }
            }
          }
        });
      }
      
      // 执行删除操作
      const success = await storage.deleteCommunityActivity(activityId);
      
      if (!success) {
        res.status(500).json({ message: '删除社区活动失败' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
}