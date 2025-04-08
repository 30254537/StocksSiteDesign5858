import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as crypto from "crypto";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  
  // 为静态文件提供服务
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  // Get all orders
  app.get('/api/orders', async (req, res) => {
    try {
      // In a real app with SQLite, we would use:
      // db.all('SELECT * FROM orders', [], (err, rows) => {...})
      // For now, we'll return a mock data set
      const orders = [
        {
          id: 1,
          items: JSON.stringify([
            { name: "STONKS T恤", price: 50, quantity: 2 }
          ]),
          total: 100,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          items: JSON.stringify([
            { name: "STONKS 帽子", price: 30, quantity: 1 },
            { name: "STONKS 手机壳", price: 20, quantity: 1 }
          ]),
          total: 50,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching orders' });
    }
  });
  
  // Create a new order
  app.post('/api/orders', (req, res) => {
    try {
      const { items, total } = req.body;
      if (!items || !Array.isArray(items) || !total || isNaN(total)) {
        return res.status(400).json({ error: '无效的订单数据' });
      }
      
      // In a real app, we would save this to a database
      // For now, just return success response
      res.status(201).json({ 
        message: '订单创建成功', 
        orderId: Date.now().toString(),
        createdAt: new Date().toISOString() 
      });
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });
  
  // 管理员会话变量
  let adminLoggedIn = false;
  
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
      if (password === "STONKS_admin_2023!") {
        // 设置管理员会话
        adminLoggedIn = true;
        
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
    if (adminLoggedIn) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  
  // 管理员登出端点
  app.post('/api/admin-logout', (req, res) => {
    adminLoggedIn = false;
    res.status(200).json({ message: "已登出" });
  });
  
  // 保护管理路由的中间件
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (adminLoggedIn) {
      next();
    } else {
      res.status(401).json({ message: "需要管理员权限" });
    }
  };
  
  // 图片上传端点
  app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          message: "没有上传文件或文件类型不被支持" 
        });
      }
      
      // 返回上传的文件路径
      res.status(200).json({ 
        imageUrl: `/uploads/${file.filename}` 
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
  app.post("/api/products", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      // 获取表单数据
      const productData = JSON.parse(req.body.productData || '{}');
      
      // 如果有上传图片，添加图片URL
      if (req.file) {
        productData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
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
  app.put("/api/products/:id", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的产品ID" });
      }
      
      // 获取表单数据
      let productData = req.body;
      
      if (req.body.productData) {
        productData = JSON.parse(req.body.productData);
      }
      
      // 如果有上传图片，添加图片URL
      if (req.file) {
        productData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const updatedProduct = await storage.updateProduct(id, productData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "未找到产品" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "更新产品时出错" });
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
  const getSessionId = (req: Request & { session?: { id?: string } }): string => {
    if (!req.session) {
      req.session = {};
    }
    if (!req.session.id) {
      req.session.id = randomUUID();
    }
    return req.session.id;
  };

  // Set up session middleware
  app.use((req: Request & { session?: any }, res, next) => {
    if (!req.session) {
      req.session = {} as any;
    }
    next();
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products by category" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
