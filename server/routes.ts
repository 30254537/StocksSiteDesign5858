import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { 
  insertCartItemSchema, 
  insertOrderSchema, 
  insertOrderItemSchema, 
  telegramMessages
  // Removed imports for non-existent tables: insertMusicTrackSchema, InsertCryptoTweet, tweets, CartItemWithProduct
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { setupCryptoNewsRoutes } from "./routes/cryptoNewsRoutes";
// Temporarily disabled routes that use removed schema tables
// import { setupAboutRoutes } from "./routes/aboutRoutes";
// import { setupCommunityRoutes } from "./routes/communityRoutes";
// import { setupGoldDogRoutes } from "./routes/goldDogRoutes";
// import { setupTeamMembersRoutes } from "./routes/teamMembersRoutes";
// import { setupCommunityFeaturesRoutes } from "./routes/communityFeaturesRoutes";
// import { setupCmsRoutes } from "./routes/cmsRoutes";
// import { setupMusicRoutes } from "./routes/musicRoutes";
// import { setupProductCmsRoutes } from "./routes/productCmsRoutes";
import { syncCryptoNews } from "./services/cryptoNewsService";
// 注意：financeNewsRoutes 不存在，将在下面注释相关代码
import { translateAllUntranslatedTweets, initTweetTranslationScheduler, translateTweetText } from "./services/translationService";
import { syncCryptoTweets } from "./services/xService";
import * as cron from "node-cron";
import { telegramService } from "./services/telegramService";
// import * as twitterService from "./services/twitterService";
import * as financeNewsService from "./services/financeNewsService";
import * as blockBeatsService from "./services/blockBeatsService";
import * as cryptoTwitterService from "./services/cryptoTwitterService";
import { db } from "./db";
import { desc, eq, and, or, like, ilike, isNull, isNotNull, SQL, sql, lt, gt, gte, lte, asc } from "drizzle-orm";

// Extend the Express.Session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    cartId?: string;
  }
}

// Initialize Stripe only if secret key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("STRIPE_SECRET_KEY not provided - payment features will be disabled");
}

// 管理员会话变量 (使用全局变量以便其他模块可以访问)
global.adminLoggedIn = false;

// 保护管理路由的中间件
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (global.adminLoggedIn) {
    next();
  } else {
    res.status(401).json({ message: "需要管理员权限" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // 配置multer用于文件上传
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  
  // 确保上传目录存在
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // 配置multer存储
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  
  // 文件过滤
  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 只接受图片格式
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({ 
    storage: multerStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 限制5MB
    }
  });
  
  // 注意：静态文件服务已经在 index.ts 中配置
  // Get all orders (admin only)
  app.get('/api/orders', requireAdmin, async (req, res) => {
    try {
      // 使用getAllOrders方法获取所有订单（包括订单项）
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("获取订单列表错误:", error);
      res.status(500).json({ error: '获取订单列表失败' });
    }
  });
  
  // Get order by ID (admin only)
  app.get('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: '无效的订单ID' });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      res.json(order);
    } catch (error) {
      console.error("获取订单详情错误:", error);
      res.status(500).json({ error: '获取订单详情失败' });
    }
  });
  
  // Get order items (admin only)
  app.get('/api/orders/:id/items', requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: '无效的订单ID' });
      }
      
      const orderWithItems = await storage.getOrderWithItems(orderId);
      if (!orderWithItems) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      res.json(orderWithItems.items);
    } catch (error) {
      console.error("获取订单商品错误:", error);
      res.status(500).json({ error: '获取订单商品失败' });
    }
  });
  
  // Delete order (admin only)
  app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: '无效的订单ID' });
      }
      
      const result = await storage.deleteOrder(orderId);
      if (!result) {
        return res.status(404).json({ error: '订单不存在或删除失败' });
      }
      
      res.status(200).json({ message: '订单删除成功' });
    } catch (error) {
      console.error("删除订单错误:", error);
      res.status(500).json({ error: '删除订单失败' });
    }
  });
  
  // Bulk delete orders (admin only)
  app.post('/api/orders/bulk-delete', requireAdmin, async (req, res) => {
    try {
      const { orderIds } = req.body;
      
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: '请提供有效的订单ID列表' });
      }
      
      // 确保所有ID都是数字
      const validOrderIds = orderIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
      
      if (validOrderIds.length === 0) {
        return res.status(400).json({ error: '未提供有效的订单ID' });
      }
      
      const deletedCount = await storage.deleteOrders(validOrderIds);
      
      res.status(200).json({
        message: `成功删除 ${deletedCount} 个订单`,
        deletedCount,
        totalCount: validOrderIds.length
      });
    } catch (error) {
      console.error("批量删除订单错误:", error);
      res.status(500).json({ error: '批量删除订单失败' });
    }
  });
  
  // Update order status (admin only)
  app.put('/api/orders/:id/status', requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: '无效的订单ID' });
      }
      
      if (!status || !['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: '无效的订单状态' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("更新订单状态错误:", error);
      res.status(500).json({ error: '更新订单状态失败' });
    }
  });
  
  // Update order tracking number (admin only)
  app.put('/api/orders/:id/tracking', requireAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { trackingNumber } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: '无效的订单ID' });
      }
      
      if (!trackingNumber || typeof trackingNumber !== 'string') {
        return res.status(400).json({ error: '无效的物流单号' });
      }
      
      // 获取当前订单
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      // 更新物流单号并将状态设为已发货
      const updatedOrder = await storage.updateOrderStatus(orderId, 'shipped');
      
      // 记录物流单号 - 由于没有专门的updateOrder方法，这里使用现有API
      
      if (!updatedOrder) {
        return res.status(500).json({ error: '更新物流信息失败' });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("更新物流信息错误:", error);
      res.status(500).json({ error: '更新物流信息失败' });
    }
  });
  
  // Get user orders (if authenticated)
  app.get('/api/user/orders', async (req: Request & { user?: any }, res) => {
    try {
      // 如果用户已登录，则获取用户的订单
      if (req.user) {
        const orders = await storage.getOrdersByUserId(req.user.id);
        return res.json(orders);
      }
      
      // 如果用户未登录，但有会话ID，则获取该会话的订单
      const sessionId = getSessionId(req);
      const orders = await storage.getOrdersBySessionId(sessionId);
      res.json(orders);
    } catch (error) {
      console.error("获取用户订单错误:", error);
      res.status(500).json({ error: '获取订单列表失败' });
    }
  });
  
  // 新端点：获取我的订单（支持会话ID）- 提供给前端MyOrders页面使用
  app.get('/api/my-orders', async (req: Request & { user?: any }, res) => {
    try {
      // 获取会话ID
      const sessionId = getSessionId(req);
      
      // 从数据库中获取订单，带有订单项
      const orders = await storage.getOrdersWithItemsBySessionId(sessionId);
      
      if (!orders || orders.length === 0) {
        // 返回空数组，而不是错误
        return res.json([]);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("获取我的订单错误:", error);
      res.status(500).json({ error: '获取订单列表失败' });
    }
  });
  
  // Create a new order
  app.post('/api/orders', async (req, res) => {
    try {
      const { 
        items, 
        total, 
        ethTotal, 
        paymentMethod, 
        shippingAddress,
        notes 
      } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: '订单必须包含商品' });
      }
      
      if (!total || isNaN(total) || !ethTotal || isNaN(ethTotal)) {
        return res.status(400).json({ error: '无效的订单金额' });
      }
      
      if (!paymentMethod || !['stonks', 'usdt', 'fiat'].includes(paymentMethod)) {
        return res.status(400).json({ error: '无效的支付方式' });
      }
      
      if (!shippingAddress || typeof shippingAddress !== 'string') {
        return res.status(400).json({ error: '请提供收货地址' });
      }
      
      // 获取用户ID（如果已登录）或会话ID
      const userId = req.user ? req.user.id : null;
      const sessionId = getSessionId(req);
      
      // 创建订单
      const orderData = {
        userId,
        sessionId: userId ? null : sessionId,
        total,
        ethTotal,
        paymentMethod,
        status: 'pending',
        shippingAddress,
        notes: notes || null
      };
      
      // 准备订单商品
      const orderItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        ethPrice: item.ethPrice,
        size: item.size || null
      }));
      
      // 创建订单和订单商品
      const order = await storage.createOrder(orderData, orderItems);
      
      // 清空购物车
      await storage.clearCart(sessionId);
      
      res.status(201).json({ 
        message: '订单创建成功', 
        order
      });
    } catch (error) {
      console.error("创建订单错误:", error);
      res.status(500).json({ error: '创建订单失败' });
    }
  });
  
  // 管理员登录端点
  app.post('/api/admin-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "用户名和密码是必填的" });
      }
      
      // 获取用户
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "无效的凭据" });
      }
      
      // 验证密码 (在真实应用中，我们会使用 bcrypt 比较哈希密码)
      if (password === "123456") {
        // 设置管理员会话
        global.adminLoggedIn = true;
        
        // 响应
        res.status(200).json({ message: "登录成功" });
      } else {
        res.status(401).json({ message: "无效的凭据" });
      }
    } catch (error) {
      console.error("管理员登录错误:", error);
      res.status(500).json({ message: "服务器错误" });
    }
  });
  
  // 检查管理员认证状态
  app.get('/api/check-admin-auth', (req, res) => {
    if (global.adminLoggedIn) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  
  // 管理员登出端点
  app.post('/api/admin-logout', (req, res) => {
    global.adminLoggedIn = false;
    res.status(200).json({ message: "已登出" });
  });
  

  
  // 获取联系信息
  app.get('/api/contact-info', async (req, res) => {
    try {
      const contactInfo = await storage.getAllContactInfo();
      res.status(200).json(contactInfo);
    } catch (error) {
      console.error("获取联系信息出错:", error);
      res.status(500).json({ 
        message: "获取联系信息失败",
        error: error.message
      });
    }
  });
  
  // 设置LOGO上传的存储配置
  const logoUploadDir = path.join(process.cwd(), 'public/uploads/logo');
  
  // 确保logo上传目录存在
  if (!fs.existsSync(logoUploadDir)) {
    fs.mkdirSync(logoUploadDir, { recursive: true });
  }
  
  const logoUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, logoUploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 限制5MB
    },
    fileFilter: function (req, file, cb) {
      // 检查文件类型
      const filetypes = /jpeg|jpg|png|gif|svg/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("仅支持以下文件类型: " + filetypes));
    }
  });

  // LOGO上传端点
  app.post('/api/contact-info/logo', requireAdmin, logoUpload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: '没有提供LOGO文件' });
      }
      
      console.log('LOGO上传成功:', req.file);
      
      // 文件上传成功，更新数据库中的LOGO URL
      const logoUrl = `/uploads/logo/${req.file.filename}`;
      await storage.updateContactInfo('logo', logoUrl);
      
      res.status(200).json({
        success: true,
        message: 'LOGO上传成功',
        logo: logoUrl
      });
    } catch (error) {
      console.error('LOGO上传错误:', error);
      res.status(500).json({ 
        success: false,
        message: '上传LOGO时出错',
        error: String(error)
      });
    }
  });
  
  // 更新联系信息（需要管理员权限）
  app.put('/api/contact-info/:key', requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "值不能为空" });
      }
      
      await storage.updateContactInfo(key, value);
      res.status(200).json({ message: "联系信息已更新", key, value });
    } catch (error) {
      console.error('更新联系信息错误:', error);
      res.status(500).json({ message: "更新联系信息失败" });
    }
  });
  
  // 图片上传端点
  app.post('/api/upload', requireAdmin, upload.array('images', 10), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          message: "没有上传文件或文件类型不被支持" 
        });
      }
      
      // 返回上传的文件路径数组
      const imageUrls = files.map(file => `/uploads/${file.filename}`);
      
      res.status(200).json({ 
        imageUrls,
        imageUrl: imageUrls[0] // 兼容旧代码，返回第一张图片作为主图
      });
    } catch (error) {
      console.error('文件上传错误:', error);
      res.status(500).json({ 
        message: "文件上传失败", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 使用中间件保护产品管理接口
  app.post("/api/products", requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
      console.log('创建产品 API 被调用');
      
      // 获取表单数据
      console.log('请求头:', req.headers);
      console.log('请求体:', req.body);
      console.log('文件:', req.files);
      console.log('文件数量:', req.files ? (req.files as Express.Multer.File[]).length : 0);
      
      const productData = JSON.parse(req.body.productData || '{}');
      console.log('解析的产品数据:', productData);
      
      // 如果有上传图片，添加图片URL
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        console.log(`处理 ${files.length} 个上传文件`);
        const imageUrls = files.map(file => `/uploads/${file.filename}`);
        console.log('生成的图片URL:', imageUrls);
        productData.imageUrls = imageUrls;
        productData.imageUrl = imageUrls[0]; // 第一张图片作为主图
      }
      
      // 获取当前STONKS价格并计算ethPrice
      if (isCacheExpired()) {
        const realTimePrice = await fetchGmgnPrice();
        cachedStonksPrice = {
          price: realTimePrice,
          lastUpdated: new Date()
        };
      }
      
      // 使用当前STONKS价格计算ethPrice
      const stonksPrice = cachedStonksPrice.price;
      productData.ethPrice = productData.price / stonksPrice;
      console.log(`USD价格: ${productData.price}, STONKS价格: ${stonksPrice}, ethPrice: ${productData.ethPrice}`);
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('创建产品时出错:', error);
      res.status(500).json({ 
        message: "创建产品时出错", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 更新产品
  app.put("/api/products/:id", requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
      console.log('更新产品 API 被调用');
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的产品ID" });
      }
      
      // 获取表单数据
      let productData = req.body;
      
      console.log('请求体:', req.body);
      console.log('文件:', req.files);
      console.log('文件数量:', req.files ? (req.files as Express.Multer.File[]).length : 0);
      
      if (req.body.productData) {
        productData = JSON.parse(req.body.productData);
        console.log('解析的产品数据:', productData);
      }
      
      // 如果有上传图片，添加图片URL
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        console.log(`处理 ${files.length} 个上传文件`);
        const imageUrls = files.map(file => `/uploads/${file.filename}`);
        console.log('生成的图片URL:', imageUrls);
        productData.imageUrls = imageUrls;
        productData.imageUrl = imageUrls[0]; // 第一张图片作为主图
      }
      
      // 保留现有图片列表，如果有传递
      if (productData.existingImages && Array.isArray(productData.existingImages)) {
        // 合并现有图片和新上传的图片
        if (productData.imageUrls) {
          productData.imageUrls = [...productData.existingImages, ...productData.imageUrls];
        } else {
          productData.imageUrls = productData.existingImages;
        }
        
        // 使用第一张图片作为主图
        if (productData.imageUrls.length > 0) {
          productData.imageUrl = productData.imageUrls[0];
        }
        
        // 删除临时属性
        delete productData.existingImages;
      }
      
      // 如果价格有更新，需要重新计算ethPrice
      if (productData.price !== undefined) {
        // 获取当前STONKS价格
        if (isCacheExpired()) {
          const realTimePrice = await fetchGmgnPrice();
          cachedStonksPrice = {
            price: realTimePrice,
            lastUpdated: new Date()
          };
        }
        
        // 使用当前STONKS价格计算ethPrice
        const stonksPrice = cachedStonksPrice.price;
        productData.ethPrice = productData.price / stonksPrice;
        console.log(`USD价格: ${productData.price}, STONKS价格: ${stonksPrice}, ethPrice: ${productData.ethPrice}`);
      }
      
      const updatedProduct = await storage.updateProduct(id, productData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "未找到产品" });
      }
      
      // 设置特殊的响应头，指示前端需要刷新翻译缓存
      res.setHeader('X-Clear-Translation-Cache', `product.name.${id}`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('更新产品时出错:', error);
      res.status(500).json({ 
        message: "更新产品时出错", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 删除产品
  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的产品ID" });
      }
      
      const result = await storage.deleteProduct(id);
      if (!result) {
        return res.status(404).json({ message: "未找到产品" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "删除产品时出错" });
    }
  });
  // Helper function to get or create session ID
  const getSessionId = (req: Request): string => {
    if (!req.session) {
      console.error('Session middleware not properly configured');
      return randomUUID(); // Fallback but should never happen with express-session properly set up
    }
    
    // Use a custom property for our session ID to avoid conflicts
    if (!req.session.cartId) {
      req.session.cartId = randomUUID();
      console.log('Created new cart session ID:', req.session.cartId);
    }
    
    return req.session.cartId;
  };

  // No need for custom session middleware since we're using express-session in index.ts

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      // 添加缓存控制头，禁止浏览器缓存
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const productsFromDb = await storage.getProducts();
      
      // 转换数据库的snake_case列名到前端使用的camelCase属性名
      const products = productsFromDb.map(product => {
        const transformedProduct = { ...product };
        
        // 确保image_url映射到imageUrl属性（数据库中为snake_case，前端为camelCase）
        if (product.image_url !== undefined) {
          transformedProduct.imageUrl = product.image_url;
          // 防止序列化时出现重复
          delete transformedProduct.image_url;
        }
        
        // 确保image_urls映射到imageUrls属性（数据库中为snake_case，前端为camelCase）
        if (product.image_urls !== undefined) {
          transformedProduct.imageUrls = product.image_urls;
          // 防止序列化时出现重复
          delete transformedProduct.image_urls;
        }
        
        return transformedProduct;
      });
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      // 添加缓存控制头，禁止浏览器缓存
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const { category } = req.params;
      const productsFromDb = await storage.getProductsByCategory(category);
      
      // 转换数据库的snake_case列名到前端使用的camelCase属性名
      const products = productsFromDb.map(product => {
        const transformedProduct = { ...product };
        
        // 确保image_url映射到imageUrl属性（数据库中为snake_case，前端为camelCase）
        if (product.image_url !== undefined) {
          transformedProduct.imageUrl = product.image_url;
          // 防止序列化时出现重复
          delete transformedProduct.image_url;
        }
        
        // 确保image_urls映射到imageUrls属性（数据库中为snake_case，前端为camelCase）
        if (product.image_urls !== undefined) {
          transformedProduct.imageUrls = product.image_urls;
          // 防止序列化时出现重复
          delete transformedProduct.image_urls;
        }
        
        return transformedProduct;
      });
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Error fetching products by category" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      // 添加缓存控制头，禁止浏览器缓存
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const productFromDb = await storage.getProduct(id);
      if (!productFromDb) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // 转换数据库的snake_case列名到前端使用的camelCase属性名
      const product = { ...productFromDb };
      
      // 确保image_url映射到imageUrl属性（数据库中为snake_case，前端为camelCase）
      if (productFromDb.image_url !== undefined) {
        product.imageUrl = productFromDb.image_url;
        // 防止序列化时出现重复
        delete product.image_url;
      }
      
      // 确保image_urls映射到imageUrls属性（数据库中为snake_case，前端为camelCase）
      if (productFromDb.image_urls !== undefined) {
        product.imageUrls = productFromDb.image_urls;
        // 防止序列化时出现重复
        delete product.image_urls;
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCart(sessionId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      
      // Validate request body
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        sessionId
      });
      
      // Check if product exists
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if item already exists in cart - we need to implement this method
      // For now, we'll query cart items and find the matching product
      const cartItems = await storage.getCart(sessionId);
      const existingItem = cartItems.find(item => 
        item.productId === validatedData.productId && 
        item.size === validatedData.size
      );
      
      if (existingItem) {
        // Update existing item quantity
        const updatedItem = await storage.updateCart(
          existingItem.id,
          existingItem.quantity + (validatedData.quantity || 1)
        );
        return res.status(200).json(updatedItem);
      }
      
      // Create new cart item
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Error adding item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const sessionId = getSessionId(req);
      const { quantity, size } = req.body;
      
      // Validate quantity
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      // Get cart item and verify ownership - for now use a workaround
      const cartItems = await storage.getCart(sessionId);
      const cartItem = cartItems.find(item => item.id === id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Cart items already filtered by session, no need to check ownership
      
      // Update cart item
      const updatedItem = await storage.updateCart(id, quantity);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const sessionId = getSessionId(req);
      
      // Get cart item and verify ownership - for now use a workaround
      const cartItems = await storage.getCart(sessionId);
      const cartItem = cartItems.find(item => item.id === id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Cart items already filtered by session, no need to check ownership
      
      // Delete cart item
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      await storage.clearCart(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error clearing cart" });
    }
  });

  // 全局变量缓存GMGN平台最新价格
  let cachedStonksPrice: { price: number; lastUpdated: Date } = {
    price: 0.03542, // 更新的GMGN平台价格基准值
    // 将时间设置为过期，强制立即更新价格
    lastUpdated: new Date(Date.now() - 20000)
  };
  
  // 检查缓存是否过期（30秒）
  function isCacheExpired(): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - cachedStonksPrice.lastUpdated.getTime();
    return cacheAge > 30000; // 按用户要求设置为30秒刷新一次
  }
  
  // 获取STONKS代币实时价格，优先使用CoinGecko Pro API
  async function fetchGmgnPrice(): Promise<number> {
    // 首先尝试使用CoinGecko Pro API获取STONKS价格
    if (process.env.COINGECKO_API_KEY) {
      try {
        // 使用查询参数方式添加API密钥
        const coinGeckoProApiUrl = `https://pro-api.coingecko.com/api/v3/coins/stonks?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
        
        console.log('优先使用CoinGecko Pro API直接获取STONKS价格...');
        
        const cgProResponse = await axios.get(coinGeckoProApiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });
        
        if (cgProResponse.status === 200 && cgProResponse.data && cgProResponse.data.market_data && cgProResponse.data.market_data.current_price && cgProResponse.data.market_data.current_price.usd) {
          const price = cgProResponse.data.market_data.current_price.usd;
          
          if (price && !isNaN(price) && price > 0) {
            console.log(`从CoinGecko Pro API直接获取到STONKS价格: $${price}`);
            return price;
          }
        }
      } catch (cgProError) {
        console.error("从CoinGecko Pro API直接获取STONKS价格失败:", cgProError);
      }
    }
    
    // 备用方法1：使用gmgnService服务获取价格
    try {
      // 首先尝试使用GMGN API直接获取STONKS价格
      console.log('使用GMGN服务获取STONKS价格...');
      
      // 导入GMGN API服务
      const { getStonksPriceFromGmgn } = await import('./services/gmgnService');
      
      // 从GMGN API获取STONKS价格
      const price = await getStonksPriceFromGmgn();
      
      if (price && price > 0) {
        console.log(`从GMGN服务获取STONKS价格成功: ${price} USD`);
        return price;
      }
      
      throw new Error('GMGN API返回的价格无效');
    } catch (gmgnError) {
      console.error("从GMGN服务获取价格失败，尝试备用方法:", gmgnError);
      
      // 备用方法2：使用CoinGecko免费API
      try {
        // 尝试使用CoinGecko直接获取STONKS价格
        const coinGeckoApiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=stonks&per_page=1';
        
        console.log('尝试从CoinGecko免费API获取STONKS价格...');
        
        const cgResponse = await axios.get(coinGeckoApiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });
        
        if (cgResponse.status === 200 && cgResponse.data && cgResponse.data.length > 0) {
          const price = cgResponse.data[0].current_price;
          
          if (price && !isNaN(price) && price > 0) {
            console.log(`从CoinGecko免费API获取STONKS价格成功: ${price} USD`);
            return price;
          }
        }
      } catch (backupError) {
        console.error("从CoinGecko免费API获取STONKS价格失败:", backupError);
      }
      
      // 备用方法3：使用OKX API（如果配置了API密钥）
      if (process.env.OKX_API_KEY && process.env.OKX_SECRET_KEY && process.env.OKX_PASSPHRASE) {
        try {
          console.log('尝试使用OKX API获取实时STONKS价格...');
          
          // 导入OKX服务
          const { getStonksPrice } = await import('./services/okxService');
          
          // 从OKX获取STONKS价格
          const price = await getStonksPrice();
          
          if (price && price > 0) {
            console.log(`从OKX获取STONKS价格成功: ${price} USD`);
            return price;
          }
        } catch (okxError) {
          console.error("从OKX获取STONKS价格失败:", okxError);
        }
      }
      
      // 所有API调用失败，返回GMGN平台上的基准价格
      console.log(`所有API调用失败，使用GMGN平台基准价格: 0.03542 USD`);
      // 强制更新价格
      cachedStonksPrice.price = 0.03542;
      cachedStonksPrice.lastUpdated = new Date();
      return 0.03542; // 使用GMGN平台上显示的最新价格作为最后的备用方案
    }
  }
  
  // 获取STONKS的实时价格
  app.get("/api/stonks-price", async (req, res) => {
    try {
      // 从数据库获取STONKS合约地址，如果不存在则使用默认地址
      let contractAddress = "6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump"; // 默认地址
      
      // 尝试从数据库获取STONKS合约地址
      try {
        const stonksContract = await storage.getContractAddressByNetwork("SOL", "STONKS");
        if (stonksContract) {
          contractAddress = stonksContract.address;
        }
      } catch (dbError) {
        console.warn("无法从数据库获取STONKS合约地址，使用默认地址:", dbError);
      }
      
      // 如果缓存已过期，则获取新价格
      if (isCacheExpired()) {
        try {
          console.log("缓存已过期，开始获取STONKS实时价格...");
          // 强制获取实时价格
          const realTimePrice = await fetchGmgnPrice();
          console.log(`获取到的实时价格为: ${realTimePrice} USD`);
          cachedStonksPrice = {
            price: realTimePrice,
            lastUpdated: new Date()
          };
        } catch (priceError) {
          console.error("获取价格失败，强制使用最新基准价格:", priceError);
          // 确保价格已更新为最新值
          cachedStonksPrice.price = 0.032834; // 使用OKX上显示的STONKS价格
          cachedStonksPrice.lastUpdated = new Date();
        }
      }
      
      // 确保价格不会是0
      if (cachedStonksPrice.price <= 0) {
        cachedStonksPrice.price = 0.03542;
      }
      
      const currentPrice = cachedStonksPrice.price;
      
      res.json({ 
        price: currentPrice,
        currency: "USD",
        contractAddress: contractAddress,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching STONKS price:", error);
      // 即使在出错的情况下也返回最新价格
      res.json({ 
        price: 0.03542,
        currency: "USD",
        contractAddress: "6NcdiK8B5KK2DzKvzvCfqi8EHaEqu48fyEzC8Mm9pump",
        lastUpdated: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Create payment intent for Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCart(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate total in USD
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      // Convert to cents for Stripe
      const amountInCents = Math.round(total * 100);
      
      // Check if Stripe is available
      if (!stripe) {
        return res.status(503).json({ message: "Payment service is not available" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          sessionId,
          items: JSON.stringify(cartItems.map(item => ({
            id: item.productId,
            quantity: item.quantity,
            size: item.size || null
          })))
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: total
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Process successful payments and create order
  app.post("/api/complete-order", async (req: Request & { user?: any }, res) => {
    try {
      const { paymentIntentId, shippingAddress } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Check if Stripe is available
      if (!stripe) {
        return res.status(503).json({ message: "Payment service is not available" });
      }

      // Retrieve the payment intent to get the metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment has not been completed" });
      }
      
      const sessionId = paymentIntent.metadata.sessionId || getSessionId(req);
      
      // Get cart items
      const cartItems = await storage.getCart(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate totals
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const ethTotal = cartItems.reduce((sum, item) => sum + (item.product.ethPrice * item.quantity), 0);
      
      // Create order in database
      const order = await storage.createOrder(
        {
          sessionId,
          status: "paid",
          total,
          ethTotal,
          paymentMethod: "credit",
          shippingAddress: shippingAddress || null,
          trackingNumber: null,
          notes: `Payment Intent: ${paymentIntentId}`,
          // If user is logged in, associate with their account
          userId: req.user?.id || null
        },
        // Create order items
        cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          ethPrice: item.product.ethPrice,
          size: item.size
        }))
      );
      
      // Clear the cart after successful order
      await storage.clearCart(sessionId);
      
      res.status(201).json({
        success: true,
        order: {
          id: order.id,
          total,
          status: order.status,
          createdAt: order.createdAt
        }
      });
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ 
        message: "Error processing order", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Process crypto payments
  app.post("/api/crypto-checkout", async (req: Request & { user?: any }, res) => {
    try {
      const sessionId = getSessionId(req);
      // Cast the cart items to the CartItemWithProduct type
      const cartItems = await storage.getCart(sessionId) as CartItemWithProduct[];
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      const { 
        paymentMethod, 
        transactionHash, 
        shippingAddress, 
        customerName, 
        customerEmail, 
        customerPhone,
        network 
      } = req.body;
      
      // Validate payment method - accept both "crypto" and "usdt"
      if ((paymentMethod !== "crypto" && paymentMethod !== "usdt") || !transactionHash) {
        return res.status(400).json({ message: "Invalid payment information" });
      }
      
      // 验证必要的客户信息字段
      if (!customerEmail) {
        return res.status(400).json({ message: "Customer email is required" });
      }
      
      // 添加网络信息到日志，如果提供了
      const networkInfo = network ? ` on ${network} network` : "";
      
      // 确保购物车项中有product属性
      if (!cartItems.every(item => item.product)) {
        console.error("Error: Some cart items don't have product information");
        return res.status(400).json({ message: "购物车数据无效，请刷新页面后重试" });
      }
      
      // 计算总价
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const ethTotal = cartItems.reduce((sum, item) => sum + (item.product.ethPrice * item.quantity), 0);
      
      // Here in a real application, we would verify the blockchain transaction
      // For now we'll assume the transaction is valid
      
      // Create order in database
      const order = await storage.createOrder(
        {
          sessionId,
          status: "paid",
          total,
          ethTotal,
          paymentMethod: paymentMethod, // 使用提交的支付方式，无需转换
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          shippingAddress: shippingAddress || null,
          trackingNumber: null,
          notes: `${paymentMethod.toUpperCase()} transaction${networkInfo}: ${transactionHash}`,
          // If user is logged in, associate with their account
          userId: req.user?.id || null
        },
        // Create order items
        cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          ethPrice: item.product.ethPrice,
          size: item.size
        }))
      );
      
      // Clear the cart after successful order
      await storage.clearCart(sessionId);
      
      res.status(201).json({
        success: true,
        order: {
          id: order.id,
          total: ethTotal,
          status: order.status,
          createdAt: order.createdAt
        }
      });
    } catch (error) {
      console.error("Error processing crypto payment:", error);
      res.status(500).json({ 
        message: "Error processing payment", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 配置音频文件上传
  const musicUploadsDir = path.join(process.cwd(), 'public/uploads/music');
  try {
    if (!fs.existsSync(musicUploadsDir)) {
      fs.mkdirSync(musicUploadsDir, { recursive: true });
      console.log('成功创建音乐上传目录:', musicUploadsDir);
      // 确保目录权限正确
      fs.chmodSync(musicUploadsDir, 0o777);
      console.log('设置音乐上传目录权限为777');
    }
  } catch (err) {
    console.error('创建音乐上传目录失败:', err);
  }

  const musicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, musicUploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'music-' + uniqueSuffix + ext);
    }
  });

  const musicFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 只接受音频文件格式
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const uploadMusic = multer({
    storage: musicStorage,
    fileFilter: musicFileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 限制50MB
    }
  });

  // 获取所有音乐
  app.get('/api/music', async (req, res) => {
    try {
      const tracks = await storage.getMusicTracks();
      res.json(tracks);
    } catch (error) {
      console.error('获取音乐列表失败:', error);
      res.status(500).json({
        message: "获取音乐列表失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 通过ID获取音乐
  app.get('/api/music/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的音乐ID" });
      }

      const track = await storage.getMusicTrack(id);
      if (!track) {
        return res.status(404).json({ message: "未找到音乐" });
      }

      res.json(track);
    } catch (error) {
      console.error('获取音乐失败:', error);
      res.status(500).json({
        message: "获取音乐失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 上传音乐
  // 添加通用上传端点，与前端代码匹配
  app.post('/api/music', uploadMusic.single('music'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "没有上传文件或文件类型不被支持" });
      }

      const title = req.body.title || '未命名曲目';
      const artist = req.body.artist || '未知艺术家';
      const style = req.body.style || 'General';
      const userId = req.body.userId ? parseInt(req.body.userId) : null;

      // 获取音频时长
      const filePath = path.join(musicUploadsDir, file.filename);
      let duration = 0;
      try {
        duration = await getAudioDurationInSeconds(filePath);
      } catch (err) {
        console.error('获取音频时长失败:', err);
        // 如果获取时长失败，不阻止上传，但记录为0
      }

      // 创建音乐记录
      const trackData = {
        title,
        artist,
        style,
        filename: file.filename,
        url: `/uploads/music/${file.filename}`,
        duration,
        isPublic: 1,
        createdBy: userId
      };

      const track = await storage.createMusicTrack(trackData);
      
      res.status(201).json(track);
    } catch (error) {
      console.error('上传音乐失败:', error);
      res.status(500).json({
        message: "上传音乐失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 批量上传音乐API（旧）
  app.post('/api/music/upload', uploadMusic.array('music', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "没有上传文件或文件类型不被支持" });
      }

      const title = req.body.title || '未命名曲目';
      const artist = req.body.artist || '未知艺术家';
      const style = req.body.style || 'General';
      const userId = req.body.userId ? parseInt(req.body.userId) : null;

      const uploadedTracks = [];

      // 处理每个上传的音频文件
      for (const file of files) {
        // 获取音频时长
        const filePath = path.join(musicUploadsDir, file.filename);
        let duration = 0;
        try {
          duration = await getAudioDurationInSeconds(filePath);
        } catch (err) {
          console.error('获取音频时长失败:', err);
          // 如果获取时长失败，不阻止上传，但记录为0
        }

        // 创建音乐记录
        const trackData = {
          title: files.length === 1 ? title : `${title} ${uploadedTracks.length + 1}`,
          artist,
          style,
          filename: file.filename,
          url: `/uploads/music/${file.filename}`,
          duration,
          isPublic: 1,
          createdBy: userId
        };

        const track = await storage.createMusicTrack(trackData);
        uploadedTracks.push(track);
      }

      res.status(201).json({
        message: `成功上传 ${uploadedTracks.length} 个音乐文件`,
        tracks: uploadedTracks
      });
    } catch (error) {
      console.error('上传音乐失败:', error);
      res.status(500).json({
        message: "上传音乐失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 删除音乐
  app.delete('/api/music/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的音乐ID" });
      }

      // 获取音乐信息（用于获取文件路径）
      const track = await storage.getMusicTrack(id);
      if (!track) {
        return res.status(404).json({ message: "未找到音乐" });
      }

      // 删除物理文件
      const filePath = path.join(musicUploadsDir, track.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 从数据库删除记录
      const result = await storage.deleteMusicTrack(id);
      if (!result) {
        return res.status(500).json({ message: "删除音乐失败" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('删除音乐失败:', error);
      res.status(500).json({
        message: "删除音乐失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 合约地址管理API端点
  // 获取所有合约地址
  app.get('/api/contract-addresses', async (req, res) => {
    try {
      const addresses = await storage.getContractAddresses();
      res.json(addresses);
    } catch (error) {
      console.error('获取合约地址列表失败:', error);
      res.status(500).json({
        message: "获取合约地址列表失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 通过网络和币种获取特定合约地址
  app.get('/api/contract-addresses/:network/:coinType', async (req, res) => {
    try {
      const { network, coinType } = req.params;
      const contractAddress = await storage.getContractAddressByNetwork(network, coinType);
      
      if (!contractAddress) {
        return res.status(404).json({ message: "未找到指定的合约地址" });
      }
      
      res.json(contractAddress);
    } catch (error) {
      console.error('获取合约地址失败:', error);
      res.status(500).json({
        message: "获取合约地址失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 添加新合约地址（需要管理员权限）
  app.post('/api/contract-addresses', requireAdmin, async (req, res) => {
    try {
      const { network, coinType, address } = req.body;
      
      // 验证必要字段
      if (!network || !coinType || !address) {
        return res.status(400).json({ message: "网络、币种和地址都是必填字段" });
      }
      
      // 检查是否已存在同样的网络和币种组合
      const existing = await storage.getContractAddressByNetwork(network, coinType);
      if (existing) {
        return res.status(409).json({ 
          message: "此网络和币种的合约地址已存在，请使用更新API更新现有地址",
          existingId: existing.id
        });
      }
      
      // 创建新合约地址
      const newAddress = await storage.createContractAddress({
        network,
        coinType,
        address
      });
      
      res.status(201).json(newAddress);
    } catch (error) {
      console.error('添加合约地址失败:', error);
      res.status(500).json({
        message: "添加合约地址失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 更新合约地址（需要管理员权限）
  app.put('/api/contract-addresses/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的合约地址ID" });
      }
      
      const { network, coinType, address } = req.body;
      
      // 至少需要一个更新字段
      if (!network && !coinType && !address) {
        return res.status(400).json({ message: "请提供至少一个要更新的字段" });
      }
      
      // 构建更新数据对象
      const updateData: any = {};
      if (network) updateData.network = network;
      if (coinType) updateData.coinType = coinType;
      if (address) updateData.address = address;
      
      // 更新合约地址
      const updatedAddress = await storage.updateContractAddress(id, updateData);
      
      if (!updatedAddress) {
        return res.status(404).json({ message: "未找到指定的合约地址" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      console.error('更新合约地址失败:', error);
      res.status(500).json({
        message: "更新合约地址失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 删除合约地址（需要管理员权限）
  app.delete('/api/contract-addresses/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的合约地址ID" });
      }
      
      const result = await storage.deleteContractAddress(id);
      
      if (!result) {
        return res.status(404).json({ message: "未找到指定的合约地址" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('删除合约地址失败:', error);
      res.status(500).json({
        message: "删除合约地址失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 加密货币新闻路由
  // 加密新闻路由已在文件结尾直接设置
  
  // 财经快讯路由
  // financeNewsRoutes不存在，直接在此注册路由
  app.get('/api/finance-news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const newsItems = await financeNewsService.getLatestFinanceNews(limit);
      res.json({ data: newsItems });
    } catch (error) {
      console.error('获取财经快讯失败:', error);
      res.status(500).json({ error: '获取财经快讯失败' });
    }
  });
  
  // 加密推文API端点
  app.get('/api/crypto-tweets', async (req, res) => {
    try {
      // 获取最新的X推文，按照热度排序
      const { category } = req.query;
      const tweets = await storage.getCryptoTweets(undefined, category as string);
      
      // 根据语言返回不同的字段
      const { lang } = req.query;
      const useZh = lang === 'zh';
      
      // 返回推文数据，始终包含原文和翻译文本
      const formattedTweets = tweets.map(tweet => ({
        id: tweet.id,
        tweetId: tweet.tweetId,
        text: tweet.text,
        translatedText: tweet.translatedText || '',
        authorName: tweet.authorName,
        authorUsername: tweet.authorUsername,
        authorProfileImage: tweet.authorProfileImage,
        metrics: {
          likes: tweet.likeCount,
          retweets: tweet.retweetCount,
          replies: tweet.replyCount,
          quotes: tweet.quoteCount
        },
        url: tweet.url,
        createdAt: tweet.createdAt,
        isTranslated: !!tweet.translatedText,
        category: tweet.category || 'crypto'
      }));
      
      res.json({ data: formattedTweets });
    } catch (error) {
      console.error('获取X推文失败:', error);
      res.status(500).json({ error: '获取推文失败' });
    }
  });
  
  // 获取合约地址推文API端点
  app.get('/api/contract-tweets', async (req, res) => {
    try {
      // 专门获取category为contract的推文
      const tweets = await storage.getCryptoTweets(10, 'contract');
      
      // 根据语言返回不同的字段
      const { lang } = req.query;
      const useZh = lang === 'zh';
      
      // 返回推文数据，始终包含原文和翻译文本
      const formattedTweets = tweets.map(tweet => ({
        id: tweet.id,
        tweetId: tweet.tweetId,
        text: tweet.text,
        translatedText: tweet.translatedText || '',
        authorName: tweet.authorName,
        authorUsername: tweet.authorUsername,
        authorProfileImage: tweet.authorProfileImage,
        metrics: {
          likes: tweet.likeCount,
          retweets: tweet.retweetCount,
          replies: tweet.replyCount,
          quotes: tweet.quoteCount
        },
        url: tweet.url,
        createdAt: tweet.createdAt,
        isTranslated: !!tweet.translatedText,
        category: 'contract',
        contractAddress: tweet.contractAddress
      }));
      
      res.json({ data: formattedTweets });
    } catch (error) {
      console.error('获取合约地址推文失败:', error);
      res.status(500).json({ error: '获取合约地址推文失败' });
    }
  });
  
  // 手动触发X推文同步（仅管理员）
  app.post('/api/crypto-tweets/sync', requireAdmin, async (req, res) => {
    try {
      // 执行同步操作
      const newTweetsCount = await syncCryptoTweets();
      
      res.status(200).json({
        success: true,
        message: `成功同步了 ${newTweetsCount} 条新推文`
      });
    } catch (error) {
      console.error('同步X推文失败:', error);
      res.status(500).json({ error: '同步推文失败' });
    }
  });
  
  // 手动翻译推文（仅管理员）
  app.post('/api/crypto-tweets/:id/translate', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的推文ID' });
      }
      
      // 获取推文
      const tweet = await storage.getCryptoTweetById(id);
      if (!tweet) {
        return res.status(404).json({ error: '未找到推文' });
      }
      
      // 使用翻译服务翻译推文
      const translatedText = translateTweetText(tweet.text);
      
      // 更新翻译文本
      const updatedTweet = await storage.updateTweetTranslation(id, translatedText);
      
      res.status(200).json({
        success: true,
        tweet: updatedTweet,
        message: '推文翻译成功'
      });
    } catch (error) {
      console.error('翻译推文失败:', error);
      res.status(500).json({ error: '翻译推文失败' });
    }
  });
  
  // 初始化加密货币新闻定时获取任务
  // 加密新闻定时任务已移至cryptoNewsRoutes.ts中，每10分钟运行一次
  
  // 初始化财经快讯定时获取任务
  cron.schedule('0 */5 * * *', async () => {
    try {
      console.log('开始定时同步财经快讯...');
      const newsItems = await financeNewsService.fetchAndStoreFinanceNews();
      console.log(`定时任务成功同步了 ${newsItems.length} 条财经快讯`);
    } catch (error) {
      console.error('定时同步财经快讯失败:', error);
    }
  }); // 每5小时获取一次最新财经快讯
  
  // 添加测试合约地址推文（测试用，无需验证）- 同时支持POST和GET方法
  app.post('/api/test/add-contract-tweet', async (req, res) => {
    addTestContractTweet(req, res);
  });
  
  // GET方法路由，方便通过浏览器地址栏直接调用
  app.get('/api/test/add-contract-tweet', async (req, res) => {
    addTestContractTweet(req, res);
  });
  
  // 共用的测试推文添加函数
  async function addTestContractTweet(req: any, res: any) {
    try {
      // 创建一个包含合约地址的测试推文
      const contractAddress = "0x7d8146cf21e8d7cbe46054e01588207b51198729";
      const testTweet: InsertCryptoTweet = {
        tweetId: `test-${Date.now()}`,
        text: `This is a new project launching soon! Contract address: ${contractAddress} - check it out!`,
        authorName: "Crypto Analyst",
        authorUsername: "crypto_analyst",
        authorProfileImage: null,
        likeCount: 250,
        retweetCount: 120,
        replyCount: 45,
        quoteCount: 12,
        url: "https://twitter.com/example/status/123456789",
        source: 'x',
        category: 'contract',
        language: 'en',
        translatedText: `这是一个即将推出的新项目！合约地址：${contractAddress} - 快来看看！`,
        contractAddress: contractAddress
      };
      
      // 保存到数据库
      const newTweet = await storage.createCryptoTweet(testTweet);
      
      res.status(201).json({
        success: true,
        message: '测试合约地址推文已添加',
        tweet: newTweet
      });
    } catch (error) {
      console.error('添加测试推文失败:', error);
      res.status(500).json({ error: '添加测试推文失败' });
    }
  }
  
  // 初始化推文翻译服务 (每4小时翻译一次未翻译的推文)
  // 暂时注释掉，因为动态导入有问题
  // initTweetTranslationScheduler('0 */4 * * *');
  
  // 定时同步X推文 (每4小时一次)
  cron.schedule('0 */4 * * *', async () => {
    try {
      console.log('开始定时同步X推文...');
      const newTweetsCount = await syncCryptoTweets();
      console.log(`定时任务成功同步了 ${newTweetsCount} 条新推文`);
    } catch (error) {
      console.error('定时同步X推文失败:', error);
    }
  });

  // Telegram 消息相关 API
  
  // 获取最新的 Telegram 消息
  // 手动同步Telegram消息的API
  app.post('/api/sync-telegram-messages', async (req, res) => {
    try {
      console.log('开始手动同步Telegram消息...');
      const messages = await telegramService.fetchAndStoreMessages();
      console.log(`成功同步 ${messages.length} 条消息`);
      res.status(200).json({ 
        success: true, 
        message: `成功同步 ${messages.length} 条消息`,
        data: messages
      });
    } catch (error) {
      console.error('手动同步Telegram消息失败:', error);
      res.status(500).json({
        success: false,
        message: '同步Telegram消息失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/telegram-messages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // 从数据库获取现有消息
      const messages = await db.select()
        .from(telegramMessages)
        .where(eq(telegramMessages.isDisplayed, true))
        .orderBy(desc(telegramMessages.date))
        .limit(limit);
      
      // 如果没有消息，尝试立即同步获取 
      if (messages.length === 0) {
        console.log('没有找到消息，尝试立即同步获取实时数据...');
        await telegramService.fetchAndStoreMessages();
        
        // 再次尝试获取消息
        const freshMessages = await db.select()
          .from(telegramMessages)
          .where(eq(telegramMessages.isDisplayed, true))
          .orderBy(desc(telegramMessages.date))
          .limit(limit);
        
        res.json({ data: freshMessages });
      } else {
        res.json({ data: messages });
      }
    } catch (error) {
      console.error('获取 Telegram 消息失败:', error);
      res.status(500).json({ error: '获取 Telegram 消息失败' });
    }
  });
  
  // 手动触发加密快讯同步（开发测试用）
  app.get('/api/sync-crypto-news', async (req, res) => {
    try {
      console.log('手动触发加密快讯同步...');
      const messages = await telegramService.fetchAndStoreMessages();
      res.json({ 
        success: true, 
        message: `成功同步 ${messages.length} 条加密快讯`,
        count: messages.length 
      });
    } catch (error) {
      console.error('手动同步加密快讯失败:', error);
      res.status(500).json({ error: 'Failed to sync crypto news' });
    }
  });
  
  // 普通用户可访问的消息同步端点
  app.post('/api/sync-telegram-messages', async (req, res) => {
    try {
      console.log('用户触发Telegram消息同步...');
      
      // 检查请求中是否指定了日期（4月11日）
      const { date } = req.body;
      let messages;
      
      if (date === '2025-04-11') {
        console.log('请求获取2025年4月11日的加密快讯...');
        
        // 获取4月11日的所有消息
        messages = await telegramService.fetchAndStoreMessages({ specificDate: '2025-04-11' });
        console.log(`已返回 ${messages.length} 条2025年4月11日的加密快讯`);
      } else {
        // 正常获取最新消息
        messages = await telegramService.fetchAndStoreMessages();
        console.log(`已成功同步 ${messages.length} 条最新加密快讯`);
      }
      
      res.json({ 
        success: true, 
        message: `成功同步 ${messages.length} 条消息`,
        count: messages.length
      });
    } catch (error) {
      console.error('用户同步Telegram消息失败:', error);
      res.status(500).json({ 
        success: false, 
        error: '同步Telegram消息失败',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 获取财经快讯API端点
  app.get('/api/finance-news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // 从数据库获取财经快讯
      const newsItems = await financeNewsService.getLatestFinanceNews(limit);
      
      res.json({ data: newsItems });
    } catch (error) {
      console.error('获取财经快讯失败:', error);
      res.status(500).json({ error: '获取财经快讯失败' });
    }
  });
  
  // 手动同步财经快讯（管理员用）
  app.post('/api/finance-news/sync', requireAdmin, async (req, res) => {
    try {
      const newsItems = await financeNewsService.fetchAndStoreFinanceNews();
      res.json({ message: `成功同步 ${newsItems.length} 条财经快讯` });
    } catch (error) {
      console.error('同步财经快讯失败:', error);
      res.status(500).json({ error: '同步财经快讯失败' });
    }
  });

  // 手动触发获取新消息的 API 端点（管理员权限）
  app.post('/api/telegram-messages/sync', requireAdmin, async (req, res) => {
    try {
      // 检查请求中是否指定了日期（4月11日）
      const { date } = req.body;
      let messages;
      
      if (date === '2025-04-11') {
        // 获取4月11日的所有消息
        const startDate = new Date('2025-04-11T00:00:00Z');
        const endDate = new Date('2025-04-11T23:59:59Z');
        
        // 先检查数据库中是否已经有4月11日的消息
        const existingMessages = await db.select()
          .from(telegramMessages)
          .where(
            and(
              gte(telegramMessages.date, startDate),
              lte(telegramMessages.date, endDate)
            )
          )
          .orderBy(desc(telegramMessages.date));
        
        if (existingMessages.length > 0) {
          console.log(`数据库中已有 ${existingMessages.length} 条4月11日的消息`);
          
          // 更新这些消息为可见状态
          for (const msg of existingMessages) {
            await db.update(telegramMessages)
              .set({ isDisplayed: true })
              .where(eq(telegramMessages.id, msg.id));
          }
          
          messages = existingMessages;
        } else {
          // 如果没有，则尝试从服务中获取
          messages = await telegramService.fetchAndStoreMessages({ specificDate: '2025-04-11' });
        }
      } else {
        // 正常获取最新消息
        messages = await telegramService.fetchAndStoreMessages();
      }
      
      res.json({ 
        success: true,
        message: `成功同步 ${messages.length} 条 Telegram 消息`,
        data: messages
      });
    } catch (error) {
      console.error('同步 Telegram 消息失败:', error);
      res.status(500).json({ 
        success: false,
        error: '同步 Telegram 消息失败'
      });
    }
  });
  
  // 普通用户也可以使用的消息同步端点 - 不需要管理员权限
  app.post('/api/sync-telegram-messages', async (req, res) => {
    try {
      console.log('用户触发Telegram消息同步...');
      
      // 检查请求中是否指定了特定日期
      const { date } = req.body;
      let messages;
      
      if (date === '2025-04-11') {
        console.log('用户请求同步2025年4月11日的消息...');
        
        // 获取2025年4月11日的消息
        const startDate = new Date('2025-04-11T00:00:00Z');
        const endDate = new Date('2025-04-11T23:59:59Z');
        
        // 查询数据库中是否已有相关消息
        const existingMessages = await db.select()
          .from(telegramMessages)
          .where(
            and(
              gte(telegramMessages.date, startDate),
              lte(telegramMessages.date, endDate)
            )
          )
          .orderBy(desc(telegramMessages.date));
        
        if (existingMessages.length > 0) {
          // 确保所有消息都被设置为显示状态
          for (const msg of existingMessages) {
            await db.update(telegramMessages)
              .set({ isDisplayed: true })
              .where(eq(telegramMessages.id, msg.id));
          }
          messages = existingMessages;
          console.log(`数据库已有 ${messages.length} 条4月11日的消息，已全部设为可见`);
        } else {
          // 尝试从服务中获取4月11日的消息
          messages = await telegramService.fetchAndStoreMessages({ specificDate: '2025-04-11' });
          console.log(`新获取 ${messages.length} 条4月11日的消息`);
        }
      } else {
        // 正常获取最新消息
        messages = await telegramService.fetchAndStoreMessages();
        console.log(`成功同步 ${messages.length} 条最新Telegram消息`);
      }
      
      res.json({ 
        success: true, 
        message: `成功同步 ${messages.length} 条消息`,
        count: messages.length
      });
    } catch (error) {
      console.error('用户同步Telegram消息失败:', error);
      res.status(500).json({ 
        success: false, 
        error: '同步Telegram消息失败',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Twitter 相关 API 端点
  
  // 获取 MoontokListing 的最新推文 - Temporarily disabled
  /*
  app.get('/api/tweets', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const latestTweets = await twitterService.getLatestTweets(limit);
      res.json({ data: latestTweets });
    } catch (error) {
      console.error('获取推文失败:', error);
      res.status(500).json({ error: '获取推文失败' });
    }
  });
  */
  
  // 手动同步推文端点 - 获取 MoontokListing 的推文 - Temporarily disabled
  /*
  app.post('/api/sync-tweets', async (req, res) => {
    try {
      console.log('用户触发 Twitter 推文同步...');
      const tweets = await twitterService.fetchAndStoreTweets();
      console.log(`成功同步 ${tweets.length} 条推文`);
      res.json({ 
        success: true, 
        message: `成功同步 ${tweets.length} 条推文`,
        count: tweets.length,
        data: tweets
      });
    } catch (error) {
      console.error('同步推文失败:', error);
      res.status(500).json({ 
        success: false, 
        error: '同步推文失败',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  */
  
  // 切换推文显示状态 (仅管理员)
  app.patch('/api/tweets/:id/toggle-display', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的推文 ID' });
      }

      // 获取当前推文
      const [tweet] = await db.select()
        .from(tweets)
        .where(eq(tweets.id, id));
      
      if (!tweet) {
        return res.status(404).json({ error: '未找到推文' });
      }

      // 切换显示状态
      const isDisplayed = !tweet.isDisplayed;
      
      // 更新显示状态
      await db.update(tweets)
        .set({ isDisplayed })
        .where(eq(tweets.id, id));
      
      res.json({ 
        success: true,
        message: `推文显示状态已更新为 ${isDisplayed ? '显示' : '隐藏'}`,
        id,
        isDisplayed
      });
    } catch (error) {
      console.error('更新推文显示状态失败:', error);
      res.status(500).json({ error: '更新推文显示状态失败' });
    }
  });
  
  // 添加测试推文
  app.post('/api/tweets-test', async (req, res) => {
    try {
      let { 
        text = "", 
        authorName = "MoontokListing", 
        authorUsername = "MoontokListing" 
      } = req.body;
      
      // 如果没有提供文本，则使用预设的MoontokListing风格推文模板
      if (!text) {
        // 生成随机币种信息
        const coinSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BOME', 'NEIRO', 'TOSHI', 'MAGA', 'TRUMP', 'MEME', 'BONK', 'WIF', 'MOG', 'BOOK'];
        const randomSymbol = coinSymbols[Math.floor(Math.random() * coinSymbols.length)];
        
        const priceChange = (Math.random() * 100).toFixed(1);
        const isPositive = Math.random() > 0.3; // 70%概率为正面涨幅
        const changePrefix = isPositive ? '+' : '-';
        
        const marketCap = ['$200K', '$1.5M', '$5M', '$12M', '$31M', '$120M', '$1.2B'];
        const randomMarketCap = marketCap[Math.floor(Math.random() * marketCap.length)];
        
        const holders = ['120', '550', '1.2K', '3.5K', '9.5K', '24K', '120K'];
        const randomHolders = holders[Math.floor(Math.random() * holders.length)];
        
        const ratings = ['🟢 强烈推荐', '🟢 看好', '🟡 观望', '🟠 谨慎', '🔴 高风险'];
        const randomRating = ratings[Math.floor(Math.random() * ratings.length)];
        
        const contractAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
        
        // 模拟MoontokListing风格的推文
        text = `🔔 新币上线提醒 $${randomSymbol}\n\n` +
          `📊 价格: $${(Math.random() * 0.1).toFixed(6)} USD\n` +
          `📈 24h涨幅: ${changePrefix}${priceChange}%\n` +
          `💰 市值: ${randomMarketCap}\n` +
          `👥 持有者: ${randomHolders}\n\n` +
          `💫 评级: ${randomRating}\n` +
          `⚠️ 风险等级: ${Math.random() > 0.5 ? '中等' : '高'}\n\n` +
          `${Math.random() > 0.6 ? '✅ 已KYC审核\n' : ''}` +
          `${Math.random() > 0.5 ? '✅ 合约已审计\n\n' : '\n'}` +
          `🔗 合约: ${contractAddress}`;
      }
      
      // 随机选择是否包含图片
      const includeMedaImage = Math.random() > 0.5;
      
      // 获取当前时间
      const now = new Date();
      
      // 创建一个虚拟的推文ID
      const tweetId = `${Date.now()}`;
      
      // 创建模拟推文
      const newTweet = {
        tweetId,
        text,
        authorId: "1702274513189580801", // MoontokListing 的 ID
        authorName,
        authorUsername,
        profileImageUrl: "https://pbs.twimg.com/profile_images/1702275000631328769/BiyRIcg5_400x400.jpg", // MoontokListing 头像
        mediaUrl: includeMedaImage ? "https://pbs.twimg.com/media/GAPAiWobcAAVbPl?format=jpg&name=medium" : null, // 模拟媒体图片
        createdAt: now,
        isDisplayed: true
      };
      
      // 插入新推文到数据库
      const [insertedTweet] = await db.insert(tweets)
        .values(newTweet)
        .returning();
      
      console.log('已添加测试推文:', insertedTweet);
      
      res.status(200).json({
        success: true,
        message: '已添加测试推文',
        data: insertedTweet
      });
    } catch (error) {
      console.error('添加测试推文失败:', error);
      res.status(500).json({ error: '添加测试推文失败' });
    }
  });

  // 管理 Telegram 消息的显示状态（管理员权限）
  app.patch('/api/telegram-messages/:id/toggle-display', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的消息 ID' });
      }

      // 获取当前消息
      const [message] = await db.select()
        .from(telegramMessages)
        .where(eq(telegramMessages.id, id));
      
      if (!message) {
        return res.status(404).json({ error: '未找到消息' });
      }

      // 切换显示状态
      const isDisplayed = !message.isDisplayed;
      
      // 更新显示状态
      await db.update(telegramMessages)
        .set({ isDisplayed })
        .where(eq(telegramMessages.id, id));
      
      res.json({ 
        success: true,
        message: `消息显示状态已更新为 ${isDisplayed ? '显示' : '隐藏'}`,
        id,
        isDisplayed
      });
    } catch (error) {
      console.error('更新 Telegram 消息显示状态失败:', error);
      res.status(500).json({ error: '更新 Telegram 消息显示状态失败' });
    }
  });
  
  // 添加金狗监测格式的测试消息
  app.post('/api/telegram-messages-test', async (req, res) => {
    try {
      const { text = "" } = req.body;
      
      // 获取当前时间
      const now = new Date();
      
      // 创建一个新的金狗监测消息
      const newMessage = {
        messageId: Math.floor(1000 + Math.random() * 9000), // 生成随机消息ID
        text: text || `🔔 金狗监测提醒\n\n💰 代币名称:$pablo\n\n📝 合约地址: DGWbzSHxZ13xHm8jX2L5NbQeqcYUkrTabCeGNS7Tpump\n\n👺市值:$17K\n⏳前十持仓:28.9%\n👥持有者数量: 119\n📊24h交易量: $36K\n📈6小时价格变化: 381%\n🕒创建时间: 2025/4/11 15:59:54\n🔍捆绑分析: 🟠 31.90%\n📬有关推文作者数量: 7\n🛜蓝V用户: 0\n\n🗣️推特信息:删帖次数(0) 发盘次数(0)`,
        sender: "金狗监测",
        channelTitle: "金狗监测频道",
        date: now,
        createdAt: now,
        updatedAt: now,
        isDisplayed: true
      };
      
      // 插入新消息到数据库
      const [insertedMessage] = await db.insert(telegramMessages)
        .values(newMessage)
        .returning();
      
      console.log('已添加金狗监测测试消息:', insertedMessage);
      
      res.status(200).json({
        success: true,
        message: '已添加金狗监测测试消息',
        data: insertedMessage
      });
    } catch (error) {
      console.error('添加金狗监测测试消息失败:', error);
      res.status(500).json({ error: '添加金狗监测测试消息失败' });
    }
  });
  
  // 这个端点已在上面定义，此处移除

  // 设置高频定时任务，每1分钟获取一次加密快讯消息，确保第一时间同步
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] 开始同步加密快讯实时资讯...');
    try {
      // 使用telegramService整合后的方法获取所有来源的加密资讯
      const messages = await telegramService.fetchAndStoreMessages();
      console.log(`[Cron] 成功同步 ${messages.length} 条加密快讯实时资讯`);
    } catch (error) {
      console.error('[Cron] 同步加密快讯实时资讯失败:', error);
    }
  });
  
  // 设置定时任务，每5分钟获取律动BlockBeats资讯
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] 开始获取律动BlockBeats资讯...');
    try {
      const blockBeatsNews = await blockBeatsService.fetchBlockBeatsNews();
      console.log(`[Cron] 成功获取 ${blockBeatsNews.length} 条律动BlockBeats资讯`);
    } catch (error) {
      console.error('[Cron] 获取律动BlockBeats资讯失败:', error);
    }
  });
  
  // 设置定时任务，每5分钟获取加密KOL的X推文
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] 开始获取加密KOL的X推文...');
    try {
      const cryptoTweets = await cryptoTwitterService.storeCryptoKolTweets(5);
      console.log(`[Cron] 成功获取 ${cryptoTweets.length} 条加密KOL的X推文`);
    } catch (error) {
      console.error('[Cron] 获取加密KOL的X推文失败:', error);
    }
  });
  
  // 设置定时任务，每5分钟同步一次 MoontokListing 的推文 - Temporarily disabled
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('[Cron] 开始同步 MoontokListing 推文...');
  //   try {
  //     const tweets = await twitterService.fetchAndStoreTweets();
  //     console.log(`[Cron] 成功同步 ${tweets.length} 条 MoontokListing 推文`);
  //   } catch (error) {
  //     console.error('[Cron] 同步 MoontokListing 推文失败:', error);
  //   }
  // });

  // 在应用启动时立即同步一次所有来源的加密资讯
  (async () => {
    try {
      console.log('初始化: 开始获取综合加密快讯...');
      const messages = await telegramService.fetchAndStoreMessages();
      console.log(`初始化: 成功同步 ${messages.length} 条综合加密快讯`);
      
      console.log('初始化: 开始获取律动BlockBeats资讯...');
      const blockBeatsNews = await blockBeatsService.fetchBlockBeatsNews();
      console.log(`初始化: 成功同步 ${blockBeatsNews.length} 条律动BlockBeats资讯`);
      
      console.log('初始化: 开始获取加密KOL的X推文...');
      const cryptoTweets = await cryptoTwitterService.storeCryptoKolTweets(5);
      console.log(`初始化: 成功同步 ${cryptoTweets.length} 条加密KOL的X推文`);
      
      // console.log('初始化: 开始获取 MoontokListing 推文...');
      // const tweets = await twitterService.fetchAndStoreTweets();
      // console.log(`初始化: 成功同步 ${tweets.length} 条 MoontokListing 推文`);
      
      console.log('初始化: 开始获取财经快讯...');
      const newsItems = await financeNewsService.fetchAndStoreFinanceNews(10);
      console.log(`初始化: 成功同步 ${newsItems.length} 条财经快讯`);
    } catch (error) {
      console.error('初始化: 同步数据失败:', error);
    }
  })();

  // 匿名用户订单查询API
  app.post('/api/lookup-order', async (req, res) => {
    try {
      const { orderId, email } = req.body;
      
      if (!orderId || !email) {
        return res.status(400).json({ error: '订单号和邮箱都必须提供' });
      }
      
      // 检查订单ID是否是有效的数字
      const orderIdNum = parseInt(orderId, 10);
      if (isNaN(orderIdNum)) {
        return res.status(400).json({ error: '订单号必须是数字' });
      }
      
      // 通过订单ID和邮箱查询订单
      const order = await storage.getOrderWithItemsByIdAndEmail(orderIdNum, email);
      
      if (!order) {
        return res.status(404).json({ error: '未找到匹配的订单，请检查订单号和邮箱是否正确' });
      }
      
      res.json({ order });
    } catch (error) {
      console.error('查询订单失败:', error);
      res.status(500).json({ error: '查询订单失败，请稍后再试' });
    }
  });

  // 添加加密新闻路由
  setupCryptoNewsRoutes(app);
  
  // Temporarily disabled routes that use removed schema tables
  // setupAboutRoutes(app);
  // setupCommunityRoutes(app);
  // setupGoldDogRoutes(app);
  // setupCmsRoutes(app);
  
  // More temporarily disabled routes
  // setupTeamMembersRoutes(app);
  // setupCommunityFeaturesRoutes(app);
  // setupMusicRoutes(app);
  // setupProductCmsRoutes(app);
  
  // 添加直接上传端点，绕过Vite中间件
  const directUploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'music');
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log('直接上传：成功创建音乐上传目录:', uploadDir);
          fs.chmodSync(uploadDir, 0o777);
        }
        cb(null, uploadDir);
      } catch (err) {
        console.error('直接上传：创建目录失败:', err);
        cb(null, path.join(process.cwd(), 'public'));
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'direct-upload-' + uniqueSuffix + ext);
    }
  });

  const directUploader = multer({
    storage: directUploadStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // 接受所有文件类型 - 对于MP3文件，MIME类型有时被识别为application/octet-stream
      console.log('接收到文件，MIME类型:', file.mimetype, '文件名:', file.originalname);
      
      // 检查文件扩展名是否为.mp3
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a' || file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型：${file.mimetype}，文件扩展名: ${ext}，只接受音频文件`));
      }
    }
  });

  // 使用直接响应避开Vite中间件
  app.post('/api/direct-upload', directUploader.single('musicFile'), async (req, res) => {
    try {
      console.log('=====> 直接上传处理:', req.file ? '文件已接收' : '未接收到文件');
      
      // 如果没有文件，返回错误
      if (!req.file) {
        console.log('=====> 直接上传：无文件');
        // 防止Vite干扰，使用原始方法发送响应
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: '未接收到文件' }));
      }
      
      // 准备响应数据
      const fileUrl = `/uploads/music/${req.file.filename}`;
      let duration = 0;
      
      try {
        const filePath = path.join(process.cwd(), 'public', fileUrl);
        if (fs.existsSync(filePath)) {
          console.log('=====> 直接上传：文件保存成功，路径:', filePath);
          
          // 尝试获取音频时长
          try {
            duration = await getAudioDurationInSeconds(filePath);
            console.log('=====> 直接上传：获取到音频时长:', duration);
          } catch (durationError) {
            console.warn('=====> 直接上传：无法获取音频时长:', durationError);
          }
        }
      } catch (err) {
        console.error('=====> 直接上传：检查文件失败:', err);
      }
      
      // 获取表单中的标题和艺术家信息
      const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, "");
      const artist = req.body.artist || "Unknown Artist";
      const style = req.body.style || "General";
      
      // 构建响应数据
      const responseData = {
        success: true,
        message: '文件上传成功',
        file: {
          url: fileUrl,
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          duration
        }
      };
      
      // 关键修复：将音乐信息保存到数据库
      try {
        const musicData = {
          title,
          artist,
          style,
          url: fileUrl,
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          duration
        };
        
        console.log('=====> 直接上传：将音乐信息保存到数据库:', musicData);
        
        // 保存到数据库
        const savedMusic = await storage.createMusicTrack(musicData);
        console.log('=====> 直接上传：音乐已保存到数据库，ID:', savedMusic.id);
        
        // 将数据库ID添加到响应中
        responseData.id = savedMusic.id;
      } catch (dbError) {
        console.error('=====> 直接上传：保存音乐到数据库失败:', dbError);
        // 继续发送响应，前端仍可以使用文件URL
      }
      
      console.log('=====> 直接上传：发送响应数据');
      
      // 使用原始方法发送响应，避免Vite干扰
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(responseData));
      
    } catch (error) {
      console.error('=====> 直接上传错误:', error);
      
      // 设置错误响应
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({
        error: true,
        message: '文件上传失败',
        details: String(error)
      }));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
