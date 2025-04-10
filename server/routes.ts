import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, insertMusicTrackSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import { getAudioDurationInSeconds } from "get-audio-duration";
import cryptoNewsRoutes from "./routes/cryptoNewsRoutes";
import { initCryptoNewsScheduler } from "./services/cryptoNewsService";
import { translateAllUntranslatedTweets, initTweetTranslationScheduler } from "./services/translationService";
import { syncCryptoTweets } from "./services/xService";
import * as cron from "node-cron";

// Extend the Express.Session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    cartId?: string;
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      const orders = await storage.getOrders();
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
      
      const order = await storage.getOrderById(orderId);
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
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      // 更新物流单号并将状态设为已发货
      const updatedOrder = await storage.updateOrder(orderId, {
        trackingNumber,
        status: 'shipped'
      });
      
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
      console.error('获取联系信息错误:', error);
      res.status(500).json({ message: "获取联系信息失败" });
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
      
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
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
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
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

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
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
      const product = await storage.getProductById(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if item already exists in cart
      const existingItem = await storage.getCartItemByProductAndSession(
        validatedData.productId,
        sessionId
      );
      
      if (existingItem) {
        // Update existing item quantity
        const updatedItem = await storage.updateCartItem(
          existingItem.id,
          existingItem.quantity + (validatedData.quantity || 1),
          validatedData.size && typeof validatedData.size === 'string' 
            ? validatedData.size 
            : undefined
        );
        return res.status(200).json(updatedItem);
      }
      
      // Create new cart item
      const cartItem = await storage.createCartItem(validatedData);
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
      
      // Get cart item and verify ownership
      const cartItem = await storage.getCartItem(id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      if (cartItem.sessionId !== sessionId) {
        return res.status(403).json({ message: "Not authorized to update this cart item" });
      }
      
      // Update cart item
      const updatedItem = await storage.updateCartItem(id, quantity, size);
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
      
      // Get cart item and verify ownership
      const cartItem = await storage.getCartItem(id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      if (cartItem.sessionId !== sessionId) {
        return res.status(403).json({ message: "Not authorized to delete this cart item" });
      }
      
      // Delete cart item
      await storage.deleteCartItem(id);
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
    price: 0.031123, // 初始默认价格，接近GMGN平台的价格
    // 将时间设置为过期，强制立即更新价格
    lastUpdated: new Date(Date.now() - 20000)
  };
  
  // 检查缓存是否过期（15秒）
  function isCacheExpired(): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - cachedStonksPrice.lastUpdated.getTime();
    return cacheAge > 15000; // 15秒缓存时间
  }
  
  // 从GMGN平台获取实时价格（模拟）
  async function fetchGmgnPrice(): Promise<number> {
    try {
      // 在这里我们应该实际调用GMGN的API
      // 例如: const response = await fetch('https://api.gmgn.io/price/stonks');
      // const data = await response.json();
      // return data.price;
      
      // 根据GMGN平台的实际价格生成更准确的价格
      // GMGN平台上STONKS当前价格约为0.031左右
      // 生成一个非常小的波动范围，确保价格保持在0.0310-0.0315之间
      const basePrice = 0.031;
      // 生成一个最多0.0005范围内的随机波动
      const randomMicroVariation = Math.random() * 0.0005;
      // 确保返回的价格格式为0.031xxx，保持在GMGN平台实际价格范围内
      return Number((basePrice + randomMicroVariation).toFixed(6));
    } catch (error) {
      console.error("Error fetching GMGN price:", error);
      // 如果API调用失败，返回缓存的最后一个有效价格
      return cachedStonksPrice.price;
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
        const realTimePrice = await fetchGmgnPrice();
        cachedStonksPrice = {
          price: realTimePrice,
          lastUpdated: new Date()
        };
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
      res.status(500).json({ message: `Error fetching STONKS price: ${error.message}` });
    }
  });

  // Create payment intent for Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate total in USD
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      // Convert to cents for Stripe
      const amountInCents = Math.round(total * 100);
      
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
      
      // Retrieve the payment intent to get the metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment has not been completed" });
      }
      
      const sessionId = paymentIntent.metadata.sessionId || getSessionId(req);
      
      // Get cart items
      const cartItems = await storage.getCartItems(sessionId);
      
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
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      const { paymentMethod, transactionHash, shippingAddress } = req.body;
      
      // Validate payment method
      if (paymentMethod !== "crypto" || !transactionHash) {
        return res.status(400).json({ message: "Invalid payment information" });
      }
      
      // Calculate totals
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
          paymentMethod: "crypto",
          shippingAddress: shippingAddress || null,
          trackingNumber: null,
          notes: `Crypto transaction: ${transactionHash}`,
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
  const musicUploadsDir = path.join(process.cwd(), 'public/music');
  if (!fs.existsSync(musicUploadsDir)) {
    fs.mkdirSync(musicUploadsDir, { recursive: true });
  }

  const musicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, musicUploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
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

      const track = await storage.getMusicTrackById(id);
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
  app.post('/api/music/upload', uploadMusic.array('music', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "没有上传文件或文件类型不被支持" });
      }

      const title = req.body.title || '未命名曲目';
      const artist = req.body.artist || '未知艺术家';
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
          filename: file.filename,
          url: `/music/${file.filename}`,
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
      const track = await storage.getMusicTrackById(id);
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
  app.use('/api', cryptoNewsRoutes);
  
  // 加密推文API端点
  app.get('/api/crypto-tweets', async (req, res) => {
    try {
      // 获取最新的X推文，按照热度排序
      const tweets = await storage.getCryptoTweets();
      
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
        isTranslated: !!tweet.translatedText
      }));
      
      res.json({ data: formattedTweets });
    } catch (error) {
      console.error('获取X推文失败:', error);
      res.status(500).json({ error: '获取推文失败' });
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
  initCryptoNewsScheduler('0 */2 * * *'); // 每2小时获取一次最新新闻
  
  // 初始化推文翻译服务 (每4小时翻译一次未翻译的推文)
  initTweetTranslationScheduler('0 */4 * * *');
  
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

  const httpServer = createServer(app);
  return httpServer;
}
