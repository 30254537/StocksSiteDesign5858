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

      console.log("\n========== 开始社区活动更新 ==========");
      console.log("PUT请求路径:", req.path);
      console.log("路径参数ID:", req.params.id);
      console.log("请求方法:", req.method);
      console.log("表单数据键:", Object.keys(req.body));
      console.log("上传文件数量:", req.files && Array.isArray(req.files) ? req.files.length : 0);
      
      // 解析ID
      const { id } = req.params;
      const activityId = parseInt(id);
      
      if (isNaN(activityId) || activityId <= 0) {
        console.error("无效的活动ID:", id);
        return res.status(400).json({ message: '无效的活动ID' });
      }
      
      console.log("转换后的活动ID:", activityId);
      
      // 获取现有活动信息
      const existingActivity = await storage.getCommunityActivity(activityId);
      if (!existingActivity) {
        console.error(`未找到ID为 ${activityId} 的社区活动`);
        return res.status(404).json({ message: `未找到ID为 ${activityId} 的社区活动` });
      }
      
      console.log("获取到现有活动数据:", JSON.stringify(existingActivity, null, 2));
      
      // ============ 构建更新后的活动数据 ============
      
      // 1. 基本文本字段（先保留现有值，然后使用新值覆盖）
      const updatedActivity = {
        ...existingActivity,
        title: req.body.title || existingActivity.title,
        content: req.body.content || existingActivity.content,
        location: req.body.location || existingActivity.location,
      };
      
      // 2. 处理布尔值字段
      if (req.body.isActive !== undefined) {
        updatedActivity.isActive = req.body.isActive === 'true' || 
                                  req.body.isActive === '1' || 
                                  req.body.isActive === true;
      }
      
      if (req.body.isOnline !== undefined) {
        updatedActivity.isOnline = req.body.isOnline === 'true' || 
                                  req.body.isOnline === '1' || 
                                  req.body.isOnline === true;
      }
      
      console.log("处理后的布尔字段:", {
        isActive: updatedActivity.isActive,
        isOnline: updatedActivity.isOnline
      });
      
      // 3. 处理日期字段
      if (req.body.startDate && typeof req.body.startDate === 'string' && req.body.startDate.trim() !== '') {
        try {
          updatedActivity.startDate = new Date(req.body.startDate);
          console.log("更新了开始日期:", updatedActivity.startDate);
        } catch (e) {
          console.warn('无法解析开始日期，保留原值:', req.body.startDate);
        }
      }
      
      if (req.body.endDate && typeof req.body.endDate === 'string' && req.body.endDate.trim() !== '') {
        try {
          updatedActivity.endDate = new Date(req.body.endDate);
          console.log("更新了结束日期:", updatedActivity.endDate);
        } catch (e) {
          console.warn('无法解析结束日期，保留原值:', req.body.endDate);
        }
      }
      
      // 4. 处理图片
      
      // 4.1 处理现有图片
      let existingImageUrls: string[] = [];
      
      // 如果表单提供了existingImageUrls字段，使用它们
      if (req.body.existingImageUrls) {
        if (Array.isArray(req.body.existingImageUrls)) {
          existingImageUrls = req.body.existingImageUrls.filter(url => url).map(url => String(url));
        } else if (typeof req.body.existingImageUrls === 'string' && req.body.existingImageUrls.trim() !== '') {
          existingImageUrls = [req.body.existingImageUrls];
        }
        console.log("表单提供的现有图片URLs:", existingImageUrls);
      } 
      // 如果表单没有提供existingImageUrls但提供了imageUrl，添加它
      else if (req.body.imageUrl && typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim() !== '') {
        existingImageUrls = [req.body.imageUrl];
        console.log("使用表单提供的主图URL:", existingImageUrls);
      } 
      // 如果表单没有提供任何图片URL信息，保留原有图片
      else {
        // 保留所有原有图片
        if (existingActivity.imageUrls && Array.isArray(existingActivity.imageUrls)) {
          existingImageUrls = [...existingActivity.imageUrls];
        } else if (existingActivity.imageUrl) {
          existingImageUrls = [existingActivity.imageUrl];
        }
        console.log("保留所有原有图片:", existingImageUrls);
      }
      
      // 4.2 处理新上传的图片
      const newImageUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          const imageUrl = `/uploads/community/${file.filename}`;
          newImageUrls.push(imageUrl);
          console.log(`新上传图片 ${file.originalname} -> ${imageUrl}`);
        }
      }
      
      // 4.3 合并新旧图片URL
      const finalImageUrls = [...existingImageUrls, ...newImageUrls].filter(url => !!url);
      console.log("最终合并的图片URLs:", finalImageUrls);
      
      // 4.4 选择主图
      let mainImageUrl = '';
      if (finalImageUrls.length > 0) {
        if (newImageUrls.length > 0) {
          // 如果有新图片，使用第一张新图片作为主图
          mainImageUrl = newImageUrls[0];
          console.log("选择第一张新上传图片作为主图:", mainImageUrl);
        } else if (existingImageUrls.length > 0) {
          // 没有新图片，使用第一张现有图片
          mainImageUrl = existingImageUrls[0];
          console.log("使用第一张现有图片作为主图:", mainImageUrl);
        }
      } else if (existingActivity.imageUrl) {
        // 如果没有任何合并后的图片但有原始主图，保留它
        mainImageUrl = existingActivity.imageUrl;
        console.log("没有新图片，保留原主图:", mainImageUrl);
      }
      
      // 5. 构建最终的更新对象，明确移除id属性以避免可能的冲突
      const { id: _, ...activityWithoutId } = updatedActivity;
      const finalUpdateData = {
        ...activityWithoutId,
        imageUrl: mainImageUrl,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
        updatedAt: new Date()
      };
      
      console.log("最终更新数据:", JSON.stringify(finalUpdateData, null, 2));
      
      // 6. 执行数据库更新操作
      console.log(`即将更新ID为 ${activityId} 的社区活动...`);
      const result = await storage.updateCommunityActivity(activityId, finalUpdateData);
      
      if (!result) {
        console.error(`更新ID为 ${activityId} 的社区活动失败，可能是数据库操作错误`);
        return res.status(500).json({ message: '更新社区活动失败，数据库操作错误' });
      }
      
      console.log("社区活动更新成功:", JSON.stringify(result, null, 2));
      console.log("========== 社区活动更新完成 ==========\n");
      
      res.json(result);
    } catch (error) {
      console.error('更新社区活动时发生错误:', error);
      res.status(500).json({ 
        message: '服务器错误，无法更新社区活动', 
        error: String(error),
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      });
    }
  });
  
  // 保留旧的路由以确保兼容性
  app.put('/api/admin/community/:id', upload.array('images', 5), async (req, res) => {
    // 直接转发到新的路由处理程序
    try {
      return res.redirect(307, `/api/community/${req.params.id}`);
    } catch (error) {
      console.error('旧路由重定向时出错:', error);
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