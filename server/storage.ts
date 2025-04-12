import { db } from "./db";
import {
  User, InsertUser,
  Product, InsertProduct,
  CartItem, InsertCartItem,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  MusicTrack, InsertMusicTrack,
  CryptoTweet, InsertCryptoTweet,
  TelegramMessage, InsertTelegramMessage,
  CryptoNews, InsertCryptoNews,
  ContractAddress, InsertContractAddress
} from "@shared/schema";
import {
  users, products, cartItems, 
  orders, orderItems, musicTracks, 
  cryptoTweets, telegramMessages, 
  cryptoNews, contractAddresses, tweets,
  contactInfo
} from "@shared/schema";
import { eq, and, or, like, desc, count, isNull, asc } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import session from "express-session";

// 会话存储
const MemStore = MemoryStore(session);
const sessionStore = new MemStore({
  checkPeriod: 86400000 // 每24小时清理一次过期的会话
});

// 定义包含订单项的订单类型
export interface OrderWithItems extends Order {
  items: (OrderItem & { productName: string; productImage: string; })[];
}

// 存储接口
export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // 产品相关方法
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // 购物车相关方法
  getCart(sessionId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCart(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
  
  // 订单相关方法
  createOrder(orderData: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersBySessionId(sessionId: string): Promise<Order[]>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // 订单项相关方法
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  getOrderWithItems(orderId: number): Promise<OrderWithItems | null>;
  getOrdersWithItemsBySessionId(sessionId: string): Promise<OrderWithItems[]>;
  getOrdersWithItemsByUserId(userId: number): Promise<OrderWithItems[]>;
  
  // 音乐曲目相关方法
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  getMusicTracks(): Promise<MusicTrack[]>;
  getMusicTrack(id: number): Promise<MusicTrack | undefined>;
  
  // 加密货币推文相关方法
  createCryptoTweet(tweet: InsertCryptoTweet): Promise<CryptoTweet>;
  getCryptoTweets(limit: number): Promise<CryptoTweet[]>;
  getTweetById(id: number): Promise<CryptoTweet | undefined>;
  clearAllCryptoTweets(): Promise<boolean>;
  updateTweetTranslation(id: number, translatedText: string): Promise<CryptoTweet | undefined>;
  getUntranslatedTweets(): Promise<CryptoTweet[]>;
  
  // 加密货币Twitter账户相关方法
  createCryptoTwitterAccount(account: any): Promise<any>;
  getCryptoTwitterAccounts(): Promise<any[]>;
  
  // Telegram消息相关方法
  createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage>;
  getTelegramMessages(limit: number): Promise<TelegramMessage[]>;
  clearAllTelegramMessages(): Promise<boolean>;
  
  // 加密货币新闻相关方法
  createCryptoNews(news: InsertCryptoNews): Promise<CryptoNews>;
  getCryptoNews(limit: number): Promise<CryptoNews[]>;
  clearAllCryptoNews(): Promise<boolean>;
  getNewsById(id: number): Promise<CryptoNews | undefined>;
  
  // 合约地址相关方法
  getContractAddresses(): Promise<ContractAddress[]>;
  getContractAddressByNetwork(network: string, coinType: string): Promise<ContractAddress | undefined>;
  createContractAddress(contractAddress: InsertContractAddress): Promise<ContractAddress>;
  updateContractAddress(id: number, data: Partial<ContractAddress>): Promise<ContractAddress | undefined>;
  deleteContractAddress(id: number): Promise<boolean>;

  // 根据订单ID和邮箱查询订单（用于匿名用户查询订单）
  getOrderWithItemsByIdAndEmail(orderId: number, email: string): Promise<OrderWithItems | null>;
  
  // 获取所有订单（用于管理后台）
  getAllOrders(): Promise<OrderWithItems[]>;
  
  // 联系信息相关方法
  getAllContactInfo(): Promise<{email: string, address: string}>;
  updateContactInfo(key: string, value: string): Promise<boolean>;
  
  // 会话存储
  sessionStore: session.Store;
}

// 内存存储实现
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = sessionStore;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [createdUser] = await db.insert(users)
      .values({
        ...user,
        password: hashedPassword
      })
      .returning();
    
    return createdUser;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(eq(users.username, username));
    
    return user;
  }
  
  // 产品相关方法
  async createProduct(product: InsertProduct): Promise<Product> {
    const [createdProduct] = await db.insert(products)
      .values(product)
      .returning();
    
    return createdProduct;
  }
  
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.id));
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(eq(products.id, id));
    
    return product;
  }
  
  async updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error('删除产品时出错:', error);
      return false;
    }
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    return db.select().from(products)
      .where(eq(products.featured, 1))
      .orderBy(desc(products.id));
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products)
      .where(eq(products.category, category))
      .orderBy(desc(products.id));
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    return db.select().from(products)
      .where(
        or(
          like(products.name, `%${query}%`),
          like(products.description, `%${query}%`),
          like(products.category, `%${query}%`)
        )
      )
      .orderBy(desc(products.id));
  }
  
  // 购物车相关方法
  async getCart(sessionId: string): Promise<CartItem[]> {
    // 使用连接查询获取购物车项以及相关产品信息
    const items = await db.select({
      id: cartItems.id,
      productId: cartItems.productId,
      sessionId: cartItems.sessionId,
      quantity: cartItems.quantity,
      size: cartItems.size,
      createdAt: cartItems.createdAt,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
        ethPrice: products.ethPrice,
        imageUrl: products.imageUrl,
        hasSizes: products.hasSizes
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.sessionId, sessionId))
    .orderBy(desc(cartItems.id));
    
    return items;
  }
  
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // 检查购物车中是否已有相同产品
    const [existingItem] = await db.select().from(cartItems)
      .where(
        and(
          eq(cartItems.productId, item.productId),
          eq(cartItems.sessionId, item.sessionId),
          eq(cartItems.size, item.size)
        )
      );
    
    if (existingItem) {
      // 如果已存在相同产品，则增加数量
      return this.updateCart(existingItem.id, existingItem.quantity + item.quantity);
    } else {
      // 否则创建新购物车项
      const [newItem] = await db.insert(cartItems)
        .values(item)
        .returning();
      
      return newItem;
    }
  }
  
  async updateCart(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return true;
    } catch (error) {
      console.error('从购物车移除商品时出错:', error);
      return false;
    }
  }
  
  async clearCart(sessionId: string): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
      return true;
    } catch (error) {
      console.error('清空购物车时出错:', error);
      return false;
    }
  }
  
  // 订单相关方法
  async createOrder(orderData: InsertOrder, orderItems?: any[]): Promise<Order> {
    const [order] = await db.insert(orders)
      .values(orderData)
      .returning();
    
    // 如果提供了订单项数据，则为每个订单项创建记录
    if (orderItems && orderItems.length > 0) {
      for (const itemData of orderItems) {
        await this.createOrderItem({
          orderId: order.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          price: itemData.price,
          ethPrice: itemData.ethPrice,
          size: itemData.size
        });
      }
    }
    
    return order;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, id));
    
    return order;
  }
  
  async getOrdersBySessionId(sessionId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(eq(orders.sessionId, sessionId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  // 订单项相关方法
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems)
      .values(orderItem)
      .returning();
    
    return item;
  }
  
  // 根据订单ID获取单个订单的订单项
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(desc(orderItems.id));
  }
  
  // 获取带订单项的单个订单
  async getOrderWithItems(orderId: number): Promise<OrderWithItems | null> {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, orderId));
    
    if (!order) {
      return null;
    }
    
    const orderItemsList = await this.getOrderItemsByOrderId(order.id);
    
    if (!orderItemsList || orderItemsList.length === 0) {
      return {
        ...order,
        items: []
      };
    }
    
    const itemsWithProducts: any[] = [];
    
    for (const item of orderItemsList) {
      const [product] = await db.select().from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        itemsWithProducts.push({
          ...item,
          productName: product.name,
          productImage: product.imageUrl || '',
        });
      }
    }
    
    return {
      ...order,
      items: itemsWithProducts
    };
  }
  
  // 获取所有带订单项的订单（按会话ID）
  async getOrdersWithItemsBySessionId(sessionId: string): Promise<OrderWithItems[]> {
    const ordersList = await db.select().from(orders)
      .where(eq(orders.sessionId, sessionId))
      .orderBy(desc(orders.createdAt));
    
    if (!ordersList || ordersList.length === 0) {
      return [];
    }
    
    const result: OrderWithItems[] = [];
    
    for (const order of ordersList) {
      const orderWithItems = await this.getOrderWithItems(order.id);
      if (orderWithItems) {
        result.push(orderWithItems);
      }
    }
    
    return result;
  }
  
  // 获取所有带订单项的订单（按用户ID）
  async getOrdersWithItemsByUserId(userId: number): Promise<OrderWithItems[]> {
    const ordersList = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    if (!ordersList || ordersList.length === 0) {
      return [];
    }
    
    const result: OrderWithItems[] = [];
    
    for (const order of ordersList) {
      const orderWithItems = await this.getOrderWithItems(order.id);
      if (orderWithItems) {
        result.push(orderWithItems);
      }
    }
    
    return result;
  }
  
  // 音乐曲目相关方法
  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [createdTrack] = await db.insert(musicTracks)
      .values(track)
      .returning();
    
    return createdTrack;
  }
  
  async getMusicTracks(): Promise<MusicTrack[]> {
    return db.select().from(musicTracks).orderBy(asc(musicTracks.order));
  }
  
  async getMusicTrack(id: number): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks)
      .where(eq(musicTracks.id, id));
    
    return track;
  }
  
  // 加密货币推文相关方法
  async createCryptoTweet(tweet: InsertCryptoTweet): Promise<CryptoTweet> {
    const [createdTweet] = await db.insert(cryptoTweets)
      .values(tweet)
      .returning();
    
    return createdTweet;
  }
  
  async getCryptoTweets(limit: number): Promise<CryptoTweet[]> {
    return db.select().from(cryptoTweets)
      .orderBy(desc(cryptoTweets.createdAt))
      .limit(limit);
  }
  
  async getTweetById(id: number): Promise<CryptoTweet | undefined> {
    const [tweet] = await db.select().from(cryptoTweets)
      .where(eq(cryptoTweets.id, id));
    
    return tweet;
  }
  
  async clearAllCryptoTweets(): Promise<boolean> {
    try {
      await db.delete(cryptoTweets);
      return true;
    } catch (error) {
      console.error('清空加密货币推文时出错:', error);
      return false;
    }
  }
  
  async updateTweetTranslation(id: number, translatedText: string): Promise<CryptoTweet | undefined> {
    const [updatedTweet] = await db.update(cryptoTweets)
      .set({ translatedText })
      .where(eq(cryptoTweets.id, id))
      .returning();
    
    return updatedTweet;
  }
  
  async getUntranslatedTweets(): Promise<CryptoTweet[]> {
    return db.select().from(cryptoTweets)
      .where(isNull(cryptoTweets.translatedText))
      .orderBy(desc(cryptoTweets.createdAt));
  }
  
  // 加密货币Twitter账户相关方法
  async createCryptoTwitterAccount(account: any): Promise<any> {
    // 使用tweets表来替代
    const [createdAccount] = await db.insert(tweets)
      .values({
        tweetId: account.twitterId || `twitter-${Date.now()}`,
        text: account.description || '',
        authorId: account.userId || 'unknown',
        authorName: account.name || 'Unknown',
        authorUsername: account.username || 'unknown',
        profileImageUrl: account.profileImageUrl || null,
        mediaUrl: account.mediaUrl || null,
        isDisplayed: true
      })
      .returning();
    
    return createdAccount;
  }
  
  async getCryptoTwitterAccounts(): Promise<any[]> {
    return db.select().from(tweets).where(eq(tweets.authorUsername, 'MoontokListing'));
  }
  
  // Telegram消息相关方法
  async createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage> {
    const [createdMessage] = await db.insert(telegramMessages)
      .values(message)
      .returning();
    
    return createdMessage;
  }
  
  async getTelegramMessages(limit: number): Promise<TelegramMessage[]> {
    return db.select().from(telegramMessages)
      .orderBy(desc(telegramMessages.createdAt))
      .limit(limit);
  }
  
  async clearAllTelegramMessages(): Promise<boolean> {
    try {
      await db.delete(telegramMessages);
      return true;
    } catch (error) {
      console.error('清空Telegram消息时出错:', error);
      return false;
    }
  }
  
  // 加密货币新闻相关方法
  async createCryptoNews(news: InsertCryptoNews): Promise<CryptoNews> {
    const [createdNews] = await db.insert(cryptoNews)
      .values(news)
      .returning();
    
    return createdNews;
  }
  
  async getCryptoNews(limit: number): Promise<CryptoNews[]> {
    return db.select().from(cryptoNews)
      .orderBy(desc(cryptoNews.createdAt))
      .limit(limit);
  }
  
  async clearAllCryptoNews(): Promise<boolean> {
    try {
      await db.delete(cryptoNews);
      return true;
    } catch (error) {
      console.error('清空加密货币新闻时出错:', error);
      return false;
    }
  }
  
  async getNewsById(id: number): Promise<CryptoNews | undefined> {
    const [news] = await db.select().from(cryptoNews)
      .where(eq(cryptoNews.id, id));
    
    return news;
  }
  
  // Contract Address methods
  async getContractAddresses(): Promise<ContractAddress[]> {
    return await db.select().from(contractAddresses)
      .where(eq(contractAddresses.isActive, 1))
      .orderBy(contractAddresses.network);
  }

  async getContractAddressByNetwork(network: string, coinType: string): Promise<ContractAddress | undefined> {
    const [contractAddress] = await db.select().from(contractAddresses)
      .where(and(
        eq(contractAddresses.network, network),
        eq(contractAddresses.coinType, coinType),
        eq(contractAddresses.isActive, 1)
      ));
    
    return contractAddress;
  }

  async createContractAddress(contractAddress: InsertContractAddress): Promise<ContractAddress> {
    const [newContractAddress] = await db.insert(contractAddresses)
      .values(contractAddress)
      .returning();
    
    return newContractAddress;
  }

  async updateContractAddress(id: number, data: Partial<ContractAddress>): Promise<ContractAddress | undefined> {
    const [contractAddress] = await db.update(contractAddresses)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(contractAddresses.id, id))
      .returning();
    
    return contractAddress;
  }

  async deleteContractAddress(id: number): Promise<boolean> {
    try {
      await db.update(contractAddresses)
        .set({ isActive: 0 })
        .where(eq(contractAddresses.id, id));
      return true;
    } catch (error) {
      console.error('删除合约地址时出错:', error);
      return false;
    }
  }
  
  // 获取所有订单（用于管理后台）
  async getAllOrders(): Promise<OrderWithItems[]> {
    const ordersList = await db.select().from(orders)
      .orderBy(desc(orders.createdAt));
    
    if (!ordersList || ordersList.length === 0) {
      return [];
    }
    
    const result: OrderWithItems[] = [];
    
    for (const order of ordersList) {
      const orderWithItems = await this.getOrderWithItems(order.id);
      if (orderWithItems) {
        result.push(orderWithItems);
      }
    }
    
    return result;
  }

  // 联系信息相关方法
  async getAllContactInfo(): Promise<{email: string, address: string}> {
    try {
      // 查找email联系方式
      const [emailInfo] = await db.select().from(contactInfo)
        .where(eq(contactInfo.key, "email"));
      
      // 查找address联系方式
      const [addressInfo] = await db.select().from(contactInfo)
        .where(eq(contactInfo.key, "address"));
      
      return {
        email: emailInfo?.value || '',
        address: addressInfo?.value || ''
      };
    } catch (error) {
      console.error("获取联系信息失败:", error);
      // 返回默认空值
      return {
        email: '',
        address: ''
      };
    }
  }
  
  async updateContactInfo(key: string, value: string): Promise<boolean> {
    try {
      // 先检查是否已存在该键的记录
      const [existingInfo] = await db.select().from(contactInfo)
        .where(eq(contactInfo.key, key));
      
      if (existingInfo) {
        // 如果已存在，则更新
        await db.update(contactInfo)
          .set({ 
            value,
            updatedAt: new Date()
          })
          .where(eq(contactInfo.key, key));
      } else {
        // 否则创建新记录
        await db.insert(contactInfo)
          .values({
            key,
            value,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error(`更新联系信息 ${key} 失败:`, error);
      return false;
    }
  }
  
  // 根据订单ID和邮箱查询订单（用于匿名用户查询订单）
  async getOrderWithItemsByIdAndEmail(orderId: number, email: string): Promise<OrderWithItems | null> {
    const [order] = await db.select().from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          or(
            eq(orders.customerEmail, email),
            eq(orders.shippingAddress, email) // 向后兼容，也检查shippingAddress字段
          )
        )
      );
      
    if (!order) {
      return null;
    }
    
    const orderItemsList = await this.getOrderItemsByOrderId(order.id);
    
    if (!orderItemsList || orderItemsList.length === 0) {
      return {
        ...order,
        items: []
      };
    }
    
    const itemsWithProducts: any[] = [];
    
    for (const item of orderItemsList) {
      const [product] = await db.select().from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        itemsWithProducts.push({
          ...item,
          productName: product.name,
          productImage: product.imageUrl || '',
        });
      }
    }
    
    return {
      ...order,
      items: itemsWithProducts
    };
  }
}

// 创建并导出存储实例
export const storage = new DatabaseStorage();