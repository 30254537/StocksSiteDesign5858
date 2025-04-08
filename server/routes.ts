import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Mock checkout endpoint
  app.post("/api/checkout", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      const { paymentMethod } = req.body;
      
      // Validate payment method
      if (!paymentMethod || !["credit", "crypto"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      
      // Calculate totals
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const ethTotal = cartItems.reduce((sum, item) => sum + (item.product.ethPrice * item.quantity), 0);
      
      // Generate mock order ID
      const orderId = crypto.randomBytes(8).toString("hex");
      
      // In a real app, we would process payment and create an order
      // For now, just clear the cart
      await storage.clearCart(sessionId);
      
      res.status(201).json({ 
        success: true, 
        orderId,
        total,
        ethTotal,
        paymentMethod,
        items: cartItems.length
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing checkout" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
