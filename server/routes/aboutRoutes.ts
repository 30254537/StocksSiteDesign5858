import type { Express } from "express";
import { storage } from "../storage";
import { insertAboutContentSchema } from "@shared/schema";
import { z } from "zod";

// 设置关于我们内容路由
export function setupAboutRoutes(app: Express) {
  // 获取所有关于我们内容
  app.get('/api/about', async (req, res) => {
    try {
      const contents = await storage.getAboutContents();
      res.json(contents);
    } catch (error) {
      console.error('获取关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 获取特定部分的关于我们内容
  app.get('/api/about/:section', async (req, res) => {
    try {
      const { section } = req.params;
      const content = await storage.getAboutContentBySection(section);
      
      if (!content) {
        res.status(404).json({ message: '未找到指定的内容部分' });
        return;
      }
      
      res.json(content);
    } catch (error) {
      console.error('获取关于我们特定部分内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 添加关于我们内容（需要管理员权限）
  app.post('/api/admin/about', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const contentData = insertAboutContentSchema.parse(req.body);
      const newContent = await storage.createAboutContent(contentData);
      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: '数据验证失败', errors: error.errors });
      } else {
        console.error('创建关于我们内容时出错:', error);
        res.status(500).json({ message: '服务器错误' });
      }
    }
  });

  // 更新关于我们内容（需要管理员权限）
  app.put('/api/admin/about/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const contentData = req.body;
      
      const updatedContent = await storage.updateAboutContent(parseInt(id), contentData);
      
      if (!updatedContent) {
        res.status(404).json({ message: '未找到指定的内容' });
        return;
      }
      
      res.json(updatedContent);
    } catch (error) {
      console.error('更新关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 删除关于我们内容（需要管理员权限）
  app.delete('/api/admin/about/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }

      const { id } = req.params;
      const success = await storage.deleteAboutContent(parseInt(id));
      
      if (!success) {
        res.status(404).json({ message: '未找到指定的内容或删除失败' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除关于我们内容时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
}