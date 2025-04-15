import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { CommunityFeature } from "@shared/schema";

// 定义扩展 Session 类型
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// 管理员权限验证中间件
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // 检查全局管理员登录状态
  if (global.adminLoggedIn) {
    next();
  } else {
    res.status(401).json({ message: "未授权操作，需要管理员权限" });
  }
};

export function setupCommunityFeaturesRoutes(app: Express) {
  // 获取所有社区特点（仅显示活跃的）
  app.get('/api/community-features', async (req, res) => {
    try {
      const features = await storage.getCommunityFeatures();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(features);
    } catch (error) {
      console.error('获取社区特点列表失败:', error);
      res.status(500).json({ 
        message: "获取社区特点列表失败", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // 获取单个社区特点
  app.get('/api/community-features/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的社区特点ID" });
      }

      const feature = await storage.getCommunityFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "未找到指定的社区特点" });
      }

      res.json(feature);
    } catch (error) {
      console.error('获取社区特点详情失败:', error);
      res.status(500).json({ 
        message: "获取社区特点详情失败", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // 创建社区特点（需要管理员权限）
  app.post('/api/community-features', requireAdmin, async (req, res) => {
    try {
      const { title, description, icon, orderIndex = 0 } = req.body;

      // 验证必要字段
      if (!title) {
        return res.status(400).json({ message: "标题是必填字段" });
      }

      // 创建新社区特点
      const newFeature = await storage.createCommunityFeature({
        title,
        description: description || null,
        icon: icon || null,
        orderIndex: orderIndex || 0,
        isActive: true
      });

      res.status(201).json(newFeature);
    } catch (error) {
      console.error('创建社区特点失败:', error);
      res.status(500).json({
        message: "创建社区特点失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 更新社区特点（需要管理员权限）
  app.put('/api/community-features/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的社区特点ID" });
      }

      const { title, description, icon, orderIndex, isActive } = req.body;

      // 至少需要一个更新字段
      if (!title && description === undefined && icon === undefined && orderIndex === undefined && isActive === undefined) {
        return res.status(400).json({ message: "请提供至少一个更新字段" });
      }

      // 检查特点是否存在
      const existingFeature = await storage.getCommunityFeature(id);
      if (!existingFeature) {
        return res.status(404).json({ message: "未找到指定的社区特点" });
      }

      // 准备更新数据
      const updateData: Partial<CommunityFeature> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (icon !== undefined) updateData.icon = icon;
      if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
      if (isActive !== undefined) updateData.isActive = isActive;

      // 更新社区特点
      const updatedFeature = await storage.updateCommunityFeature(id, updateData);

      res.json(updatedFeature);
    } catch (error) {
      console.error('更新社区特点失败:', error);
      res.status(500).json({
        message: "更新社区特点失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 删除社区特点（需要管理员权限）
  app.delete('/api/community-features/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的社区特点ID" });
      }

      // 检查特点是否存在
      const existingFeature = await storage.getCommunityFeature(id);
      if (!existingFeature) {
        return res.status(404).json({ message: "未找到指定的社区特点" });
      }

      // 删除社区特点（软删除，只是将isActive设置为false）
      const success = await storage.deleteCommunityFeature(id);
      if (success) {
        res.status(200).json({ message: "社区特点删除成功" });
      } else {
        res.status(500).json({ message: "社区特点删除失败" });
      }
    } catch (error) {
      console.error('删除社区特点失败:', error);
      res.status(500).json({
        message: "删除社区特点失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}