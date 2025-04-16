import type { Express } from "express";
import { storage } from "../storage";
import { insertAboutContentSchema, insertCommunityActivitySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// 配置multer用于处理CMS图片上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve("public/uploads/cms");
      
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
      cb(null, 'cms-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

// 设置CMS内容管理路由
export function setupCmsRoutes(app: Express) {
  // ===== 关于我们内容管理 =====
  
  // 获取所有关于我们的内容
  app.get('/api/cms/about', async (req, res) => {
    try {
      const aboutContentList = await storage.getAboutContents();
      res.json(aboutContentList);
    } catch (error) {
      console.error('获取关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 获取单个关于我们内容
  app.get('/api/cms/about/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const aboutContent = await storage.getAboutContentBySection("main-" + id);
      
      if (!aboutContent) {
        return res.status(404).json({ message: '未找到指定的内容' });
      }
      
      res.json(aboutContent);
    } catch (error) {
      console.error('获取关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 创建或更新关于我们内容（需要管理员权限）
  app.post('/api/cms/about', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const aboutData = insertAboutContentSchema.parse(req.body);
      
      // 如果提供了ID，尝试更新；否则创建新条目
      if (req.body.id) {
        const id = parseInt(req.body.id);
        const updated = await storage.updateAboutContent(id, aboutData);
        if (!updated) {
          return res.status(404).json({ message: '未找到指定的内容' });
        }
        return res.json(updated);
      } else {
        const newContent = await storage.createAboutContent(aboutData);
        return res.status(201).json(newContent);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: '数据验证失败', errors: error.errors });
      } else {
        console.error('保存关于我们内容时出错:', error);
        res.status(500).json({ message: '服务器错误' });
      }
    }
  });
  
  // 删除关于我们内容（需要管理员权限）
  app.delete('/api/cms/about/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const { id } = req.params;
      const success = await storage.deleteAboutContent(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: '未找到指定的内容' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 团队成员管理功能已移除
  
  // ===== 社区活动管理 =====

  // 配置multer用于处理社区活动图片上传
  const communityUpload = multer({
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
  
  // 获取所有社区活动
  app.get('/api/cms/community', async (req, res) => {
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

  // 获取特定ID的社区活动
  app.get('/api/cms/community/:id', async (req, res) => {
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
  app.post('/api/cms/community', communityUpload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      // 处理上传的图片文件
      let imageUrl = req.body.imageUrl || '';
      let imageUrls: string[] = [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // 处理所有上传的图片
        imageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/community/${file.filename}`
        );
        
        // 使用第一张图片作为主图片（保留兼容性）
        imageUrl = imageUrls[0];
        
        console.log(`上传了 ${req.files.length} 张图片:`, imageUrls);
      }

      // 合并表单数据和图片URL
      const formData = {
        ...req.body,
        imageUrl,
        imageUrls,
        isActive: req.body.isActive === 'true'
      };

      const activityData = insertCommunityActivitySchema.parse(formData);
      const newActivity = await storage.createCommunityActivity(activityData);
      res.status(200).json(newActivity); // 使用200而非201，更符合前端期望
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
  app.put('/api/cms/community/:id', communityUpload.array('images', 5), async (req, res) => {
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
      // 保持现有的图片数组，如果没有上传新图片则使用原来的
      let imageUrls = existingActivity.imageUrls || [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // 创建新的图片URL数组
        const newImageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/community/${file.filename}`
        );

        // 使用第一张新上传的图片作为主图片
        imageUrl = newImageUrls[0];
        
        // 如果明确选择了替换所有图片（而不是添加），可以删除旧图片文件
        if (req.body.replaceAllImages === 'true') {
          // 删除旧的图片文件
          if (existingActivity.imageUrls && existingActivity.imageUrls.length > 0) {
            existingActivity.imageUrls.forEach(imgUrl => {
              if (imgUrl && imgUrl.startsWith('/uploads/community/')) {
                const oldImagePath = path.resolve(`public${imgUrl}`);
                if (fs.existsSync(oldImagePath)) {
                  try {
                    fs.unlinkSync(oldImagePath);
                    console.log(`已删除旧图片: ${oldImagePath}`);
                  } catch (err) {
                    console.error(`删除旧图片时出错:`, err);
                  }
                }
              }
            });
          }
          // 替换为新图片数组
          imageUrls = newImageUrls;
        } else {
          // 将新图片添加到现有图片数组中
          imageUrls = [...imageUrls, ...newImageUrls];
        }
        
        console.log(`更新后的图片URL数组:`, imageUrls);
      }

      // 合并表单数据和图片URL
      const formData = {
        ...req.body,
        imageUrl,
        imageUrls,
        isActive: req.body.isActive === 'true'
      };
      
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
  app.delete('/api/cms/community/:id', async (req, res) => {
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
  
  // 删除社区活动中的单个图片（需要管理员权限）
  app.delete('/api/cms/community/:id/image', async (req, res) => {
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
  
  // 社区特点管理功能已移除
}