import type { Express } from "express";
import { storage } from "../storage";
import { insertAboutContentSchema, insertTeamMemberSchema, insertCommunityFeatureSchema } from "@shared/schema";
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
  
  // ===== 团队成员管理 =====
  
  // 获取所有团队成员
  app.get('/api/cms/team', async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error('获取团队成员时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 获取单个团队成员
  app.get('/api/cms/team/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const teamMember = await storage.getTeamMember(parseInt(id));
      
      if (!teamMember) {
        return res.status(404).json({ message: '未找到指定的团队成员' });
      }
      
      res.json(teamMember);
    } catch (error) {
      console.error('获取团队成员时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 创建或更新团队成员（需要管理员权限）
  app.post('/api/cms/team', upload.single('image'), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      // 处理上传的图片文件
      let imageUrl = req.body.imageUrl || '';
      if (req.file) {
        imageUrl = `/uploads/cms/${req.file.filename}`;
      }
      
      // 合并表单数据和图片URL
      const formData = {
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === 'true'
      };
      
      const teamMemberData = insertTeamMemberSchema.parse(formData);
      
      // 如果提供了ID，尝试更新；否则创建新条目
      if (req.body.id) {
        const id = parseInt(req.body.id);
        const existingMember = await storage.getTeamMember(id);
        
        // 如果上传了新图片且原来有图片，可以删除旧图片
        if (existingMember && req.file && existingMember.imageUrl && existingMember.imageUrl.startsWith('/uploads/')) {
          const oldImagePath = path.resolve(`public${existingMember.imageUrl}`);
          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log(`已删除旧图片: ${oldImagePath}`);
            } catch (err) {
              console.error(`删除旧图片时出错:`, err);
            }
          }
        }
        
        const updated = await storage.updateTeamMember(id, teamMemberData);
        if (!updated) {
          return res.status(404).json({ message: '未找到指定的团队成员' });
        }
        return res.json(updated);
      } else {
        const newMember = await storage.createTeamMember(teamMemberData);
        return res.status(201).json(newMember);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: '数据验证失败', errors: error.errors });
      } else {
        console.error('保存团队成员时出错:', error);
        res.status(500).json({ message: '服务器错误' });
      }
    }
  });
  
  // 删除团队成员（需要管理员权限）
  app.delete('/api/cms/team/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const { id } = req.params;
      const teamMember = await storage.getTeamMember(parseInt(id));
      
      if (!teamMember) {
        return res.status(404).json({ message: '未找到指定的团队成员' });
      }
      
      // 删除相关图片文件
      if (teamMember.imageUrl && teamMember.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.resolve(`public${teamMember.imageUrl}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`已删除团队成员图片: ${imagePath}`);
          } catch (err) {
            console.error(`删除团队成员图片时出错:`, err);
          }
        }
      }
      
      const success = await storage.deleteTeamMember(parseInt(id));
      
      if (!success) {
        return res.status(500).json({ message: '删除团队成员失败' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除团队成员时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // ===== 社区活动管理 =====
  
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
  
  // ===== 社区特点管理 =====
  
  // 获取所有社区特点
  app.get('/api/cms/community-features', async (req, res) => {
    try {
      const features = await storage.getCommunityFeatures();
      res.json(features);
    } catch (error) {
      console.error('获取社区特点时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 获取单个社区特点
  app.get('/api/cms/community-features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const feature = await storage.getCommunityFeature(parseInt(id));
      
      if (!feature) {
        return res.status(404).json({ message: '未找到指定的社区特点' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('获取社区特点时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 创建或更新社区特点（需要管理员权限）
  app.post('/api/cms/community-features', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const formData = {
        ...req.body,
        isActive: req.body.isActive === 'true'
      };
      
      const featureData = insertCommunityFeatureSchema.parse(formData);
      
      // 如果提供了ID，尝试更新；否则创建新条目
      if (req.body.id) {
        const id = parseInt(req.body.id);
        const updated = await storage.updateCommunityFeature(id, featureData);
        if (!updated) {
          return res.status(404).json({ message: '未找到指定的社区特点' });
        }
        return res.json(updated);
      } else {
        const newFeature = await storage.createCommunityFeature(featureData);
        return res.status(201).json(newFeature);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: '数据验证失败', errors: error.errors });
      } else {
        console.error('保存社区特点时出错:', error);
        res.status(500).json({ message: '服务器错误' });
      }
    }
  });
  
  // 删除社区特点（需要管理员权限）
  app.delete('/api/cms/community-features/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const { id } = req.params;
      const success = await storage.deleteCommunityFeature(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: '未找到指定的社区特点' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除社区特点时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
}