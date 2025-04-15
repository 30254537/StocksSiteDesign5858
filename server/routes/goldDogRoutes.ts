import { Express } from "express";
import { storage } from "../storage";
import { insertGoldDogMonitorSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

// 配置multer用于处理文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve("public/uploads/gold-dog");
      
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 生成一个唯一的文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'gold-dog-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

// 定义创建金狗监测的请求数据验证模式
const createGoldDogMonitorSchema = insertGoldDogMonitorSchema.extend({
  imageUrl: z.string().optional(),
});

// 公共验证处理函数
function validateRequest(schema: z.ZodSchema<any>, data: any) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

// 验证是否管理员
function isAdmin(req: any) {
  return req.session && req.session.isAdmin === true;
}

export function setupGoldDogRoutes(app: Express) {
  // 获取所有金狗监测列表（公开端点）
  app.get("/api/gold-dog-monitors", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const publishedOnly = req.query.publishedOnly !== "false"; // 默认只返回已发布的
      
      const monitors = await storage.getGoldDogMonitors(limit, publishedOnly);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      console.log("获取金狗监测列表:", JSON.stringify(monitors).slice(0, 100)); // 记录日志以便调试
      res.json(monitors);
    } catch (error) {
      console.error("获取金狗监测列表失败:", error);
      res.status(500).json({ message: "获取金狗监测列表失败", error: (error as Error).message });
    }
  });

  // 获取热门金狗监测（按浏览量排序）
  app.get("/api/gold-dog-monitors/top", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topMonitors = await storage.getTopGoldDogMonitors(limit);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      console.log("获取热门金狗监测:", JSON.stringify(topMonitors).slice(0, 100)); // 记录日志以便调试
      res.json(topMonitors);
    } catch (error) {
      console.error("获取热门金狗监测失败:", error);
      res.status(500).json({ message: "获取热门金狗监测失败", error: (error as Error).message });
    }
  });

  // 获取单个金狗监测详情
  app.get("/api/gold-dog-monitors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的ID" });
      }
      
      const monitor = await storage.getGoldDogMonitor(id);
      if (!monitor) {
        return res.status(404).json({ message: "找不到指定的金狗监测" });
      }
      
      // 如果不是管理员且该监测未发布，则拒绝访问
      if (!isAdmin(req) && !monitor.isPublished) {
        return res.status(403).json({ message: "无权访问该内容" });
      }
      
      // 增加浏览量
      await storage.incrementGoldDogMonitorViews(id);
      
      // 添加UTF-8编码响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      console.log(`获取金狗监测详情ID=${id}:`, JSON.stringify(monitor).slice(0, 100)); // 记录日志以便调试
      res.json(monitor);
    } catch (error) {
      console.error("获取金狗监测详情失败:", error);
      res.status(500).json({ message: "获取金狗监测详情失败", error: (error as Error).message });
    }
  });

  // 创建新的金狗监测（管理员权限）
  app.post("/api/gold-dog-monitors", upload.single("image"), async (req, res) => {
    try {
      // 验证管理员权限
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "无权执行此操作" });
      }
      
      const imageUrl = req.file ? `/uploads/gold-dog/${req.file.filename}` : undefined;
      
      // 合并表单数据和图片URL
      const monitorData = {
        ...req.body,
        isPublished: req.body.isPublished === "true",
        imageUrl
      };
      
      // 验证请求数据
      const validation = validateRequest(createGoldDogMonitorSchema, monitorData);
      if (!validation.success) {
        return res.status(400).json({ message: "提交数据验证失败", errors: validation.error });
      }
      
      const createdMonitor = await storage.createGoldDogMonitor(validation.data);
      res.status(201).json(createdMonitor);
    } catch (error) {
      console.error("创建金狗监测失败:", error);
      res.status(500).json({ message: "创建金狗监测失败", error: (error as Error).message });
    }
  });

  // 更新金狗监测（管理员权限）
  app.put("/api/gold-dog-monitors/:id", upload.single("image"), async (req, res) => {
    try {
      // 验证管理员权限
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "无权执行此操作" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的ID" });
      }
      
      // 查找现有记录
      const existingMonitor = await storage.getGoldDogMonitor(id);
      if (!existingMonitor) {
        return res.status(404).json({ message: "找不到指定的金狗监测" });
      }
      
      // 处理图片上传
      let imageUrl = existingMonitor.imageUrl;
      if (req.file) {
        imageUrl = `/uploads/gold-dog/${req.file.filename}`;
        
        // 如果上传了新图片，删除旧图片
        if (existingMonitor.imageUrl) {
          const oldImagePath = path.resolve(`public${existingMonitor.imageUrl}`);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      
      // 合并数据
      const monitorData = {
        ...req.body,
        isPublished: req.body.isPublished === "true",
        imageUrl
      };
      
      // 更新记录
      const updatedMonitor = await storage.updateGoldDogMonitor(id, monitorData);
      res.json(updatedMonitor);
    } catch (error) {
      console.error("更新金狗监测失败:", error);
      res.status(500).json({ message: "更新金狗监测失败", error: (error as Error).message });
    }
  });

  // 删除金狗监测（管理员权限）
  app.delete("/api/gold-dog-monitors/:id", async (req, res) => {
    try {
      // 验证管理员权限
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "无权执行此操作" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的ID" });
      }
      
      // 查找现有记录
      const existingMonitor = await storage.getGoldDogMonitor(id);
      if (!existingMonitor) {
        return res.status(404).json({ message: "找不到指定的金狗监测" });
      }
      
      // 删除关联的图片文件
      if (existingMonitor.imageUrl) {
        const imagePath = path.resolve(`public${existingMonitor.imageUrl}`);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // 删除记录
      const success = await storage.deleteGoldDogMonitor(id);
      if (success) {
        res.status(200).json({ message: "金狗监测已成功删除" });
      } else {
        res.status(500).json({ message: "删除金狗监测失败" });
      }
    } catch (error) {
      console.error("删除金狗监测失败:", error);
      res.status(500).json({ message: "删除金狗监测失败", error: (error as Error).message });
    }
  });
}