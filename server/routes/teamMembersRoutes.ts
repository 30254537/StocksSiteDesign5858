import type { Express } from "express";
import { storage } from "../storage";
import { TeamMember } from "@shared/schema";

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  // 检查会话中是否有管理员标志
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "未授权操作，需要管理员权限" });
  }
};

export function setupTeamMembersRoutes(app: Express) {
  // 获取所有团队成员
  app.get('/api/team-members', async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      console.error('获取团队成员列表失败:', error);
      res.status(500).json({ 
        message: "获取团队成员列表失败", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // 获取单个团队成员
  app.get('/api/team-members/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的团队成员ID" });
      }

      const member = await storage.getTeamMember(id);
      if (!member) {
        return res.status(404).json({ message: "未找到指定的团队成员" });
      }

      res.json(member);
    } catch (error) {
      console.error('获取团队成员详情失败:', error);
      res.status(500).json({ 
        message: "获取团队成员详情失败", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // 创建团队成员（需要管理员权限）
  app.post('/api/team-members', requireAdmin, async (req, res) => {
    try {
      const { name, title, bio, photoUrl, orderIndex = 0 } = req.body;

      // 验证必要字段
      if (!name || !title) {
        return res.status(400).json({ message: "姓名和职位是必填字段" });
      }

      // 创建新团队成员
      const newMember = await storage.createTeamMember({
        name,
        title,
        bio: bio || '',
        photoUrl: photoUrl || '',
        orderIndex: orderIndex || 0
      });

      res.status(201).json(newMember);
    } catch (error) {
      console.error('创建团队成员失败:', error);
      res.status(500).json({
        message: "创建团队成员失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 更新团队成员（需要管理员权限）
  app.put('/api/team-members/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的团队成员ID" });
      }

      const { name, title, bio, photoUrl, orderIndex } = req.body;

      // 至少需要一个更新字段
      if (!name && !title && !bio && !photoUrl && orderIndex === undefined) {
        return res.status(400).json({ message: "请提供至少一个更新字段" });
      }

      // 检查成员是否存在
      const existingMember = await storage.getTeamMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "未找到指定的团队成员" });
      }

      // 准备更新数据
      const updateData: Partial<TeamMember> = {};
      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (bio !== undefined) updateData.bio = bio;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

      // 更新团队成员
      const updatedMember = await storage.updateTeamMember(id, updateData);

      res.json(updatedMember);
    } catch (error) {
      console.error('更新团队成员失败:', error);
      res.status(500).json({
        message: "更新团队成员失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 删除团队成员（需要管理员权限）
  app.delete('/api/team-members/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的团队成员ID" });
      }

      // 检查成员是否存在
      const existingMember = await storage.getTeamMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "未找到指定的团队成员" });
      }

      // 删除团队成员
      const success = await storage.deleteTeamMember(id);
      if (success) {
        res.status(200).json({ message: "团队成员删除成功" });
      } else {
        res.status(500).json({ message: "团队成员删除失败" });
      }
    } catch (error) {
      console.error('删除团队成员失败:', error);
      res.status(500).json({
        message: "删除团队成员失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}