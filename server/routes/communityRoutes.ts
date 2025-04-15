import type { Express } from "express";
import { storage } from "../storage";
import { insertCommunityActivitySchema } from "@shared/schema";
import { z } from "zod";

// 设置社区活动路由
export function setupCommunityRoutes(app: Express) {
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

  // 添加社区活动（需要管理员权限）
  app.post('/api/community', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const activityData = insertCommunityActivitySchema.parse(req.body);
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
  
  // 保留旧的路由以确保兼容性
  app.post('/api/admin/community', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const activityData = insertCommunityActivitySchema.parse(req.body);
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

  // 更新社区活动（需要管理员权限）
  app.put('/api/community/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const activityData = req.body;
      
      const updatedActivity = await storage.updateCommunityActivity(parseInt(id), activityData);
      
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
  
  // 保留旧的路由以确保兼容性
  app.put('/api/admin/community/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const activityData = req.body;
      
      const updatedActivity = await storage.updateCommunityActivity(parseInt(id), activityData);
      
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
      const success = await storage.deleteCommunityActivity(parseInt(id));
      
      if (!success) {
        res.status(404).json({ message: '未找到指定的社区活动或删除失败' });
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
      const success = await storage.deleteCommunityActivity(parseInt(id));
      
      if (!success) {
        res.status(404).json({ message: '未找到指定的社区活动或删除失败' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除社区活动时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
}