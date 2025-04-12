import { 
  products, type Product, type InsertProduct,
  cartItems, type CartItem, type InsertCartItem,
  type CartItemWithProduct,
  users, type User, type InsertUser,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  subscribers, type Subscriber, type InsertSubscriber,
  musicTracks, type MusicTrack, type InsertMusicTrack,
  contactInfo, type ContactInfo, type InsertContactInfo,
  contractAddresses, type ContractAddress, type InsertContractAddress,
  cryptoNews, type CryptoNews, type InsertCryptoNews,
  cryptoTweets, type CryptoTweet, type InsertCryptoTweet,
  telegramMessages, type TelegramMessage, type InsertTelegramMessage,
  websiteContents, type WebsiteContent, type InsertWebsiteContent,
  type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "passwordHash"> & {password: string}): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: {customerId: string, subscriptionId: string}): Promise<User>;

  // Website Content operations
  getWebsiteContents(): Promise<WebsiteContent[]>;
  getWebsiteContentsBySection(section: string): Promise<WebsiteContent[]>;
  getWebsiteContent(id: number): Promise<WebsiteContent | undefined>;
  getWebsiteContentByKey(key: string): Promise<WebsiteContent | undefined>;
  createWebsiteContent(content: InsertWebsiteContent): Promise<WebsiteContent>;
  updateWebsiteContent(id: number, content: Partial<WebsiteContent>): Promise<WebsiteContent | undefined>;
  deleteWebsiteContent(id: number): Promise<boolean>;
  
  // Contact Info operations
  getContactInfo(key: string): Promise<string | null>;
  getAllContactInfo(): Promise<Record<string, string>>;
  updateContactInfo(key: string, value: string): Promise<boolean>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getFeaturedProducts(): Promise<Product[]>;

  // Cart operations
  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  getCartItemByProductAndSession(productId: number, sessionId: string): Promise<CartItem | undefined>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, size?: string): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrdersBySessionId(sessionId: string): Promise<Order[]>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  
  // Newsletter operations
  getSubscribers(): Promise<Subscriber[]>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  unsubscribe(email: string): Promise<boolean>;
  
  // Music operations
  getMusicTracks(): Promise<MusicTrack[]>;
  getMusicTrackById(id: number): Promise<MusicTrack | undefined>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  updateMusicTrack(id: number, track: Partial<MusicTrack>): Promise<MusicTrack | undefined>;
  deleteMusicTrack(id: number): Promise<boolean>;
  
  // Contract Address operations
  getContractAddresses(): Promise<ContractAddress[]>;
  getContractAddressByNetwork(network: string, coinType: string): Promise<ContractAddress | undefined>;
  createContractAddress(contractAddress: InsertContractAddress): Promise<ContractAddress>;
  updateContractAddress(id: number, contractAddress: Partial<ContractAddress>): Promise<ContractAddress | undefined>;
  deleteContractAddress(id: number): Promise<boolean>;
  
  // Crypto News operations
  getCryptoNews(limit?: number, offset?: number): Promise<CryptoNews[]>;
  getCryptoNewsById(id: number): Promise<CryptoNews | undefined>;
  getCryptoNewsByCategory(category: string, limit?: number): Promise<CryptoNews[]>;
  getHighlightedCryptoNews(limit?: number): Promise<CryptoNews[]>;
  createCryptoNews(news: InsertCryptoNews): Promise<CryptoNews>;
  updateCryptoNews(id: number, news: Partial<CryptoNews>): Promise<CryptoNews | undefined>;
  deleteCryptoNews(id: number): Promise<boolean>;
  getCryptoNewsCount(): Promise<number>;
  
  // Crypto Tweets operations
  getCryptoTweets(limit?: number, category?: string): Promise<CryptoTweet[]>;
  getCryptoTweetById(id: number): Promise<CryptoTweet | undefined>;
  getCryptoTweetByTweetId(tweetId: string): Promise<CryptoTweet | undefined>;
  createCryptoTweet(tweet: InsertCryptoTweet): Promise<CryptoTweet>;
  updateCryptoTweet(id: number, tweet: Partial<CryptoTweet>): Promise<CryptoTweet | undefined>;
  updateTweetTranslation(id: number, translatedText: string): Promise<CryptoTweet | undefined>;
  deleteCryptoTweet(id: number): Promise<boolean>;

  // Telegram Messages operations
  getTelegramMessages(limit?: number): Promise<TelegramMessage[]>;
  getTelegramMessageById(id: number): Promise<TelegramMessage | undefined>;
  getTelegramMessageByMessageId(messageId: number): Promise<TelegramMessage | undefined>;
  createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage>;
  updateTelegramMessage(id: number, message: Partial<TelegramMessage>): Promise<TelegramMessage | undefined>;
  deleteTelegramMessage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Website Content methods
  async getWebsiteContents(): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContents)
      .where(eq(websiteContents.isActive, true))
      .orderBy(websiteContents.section, websiteContents.key);
  }

  async getWebsiteContentsBySection(section: string): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContents)
      .where(
        and(
          eq(websiteContents.section, section),
          eq(websiteContents.isActive, true)
        )
      )
      .orderBy(websiteContents.key);
  }

  async getWebsiteContent(id: number): Promise<WebsiteContent | undefined> {
    const [content] = await db.select().from(websiteContents)
      .where(eq(websiteContents.id, id));
    return content;
  }

  async getWebsiteContentByKey(key: string): Promise<WebsiteContent | undefined> {
    const [content] = await db.select().from(websiteContents)
      .where(eq(websiteContents.key, key));
    return content;
  }

  async createWebsiteContent(content: InsertWebsiteContent): Promise<WebsiteContent> {
    const [newContent] = await db.insert(websiteContents).values(content).returning();
    return newContent;
  }

  async updateWebsiteContent(id: number, data: Partial<WebsiteContent>): Promise<WebsiteContent | undefined> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [content] = await db.update(websiteContents)
      .set(updateData)
      .where(eq(websiteContents.id, id))
      .returning();
    
    return content;
  }

  async deleteWebsiteContent(id: number): Promise<boolean> {
    try {
      await db.delete(websiteContents).where(eq(websiteContents.id, id));
      return true;
    } catch (error) {
      console.error('删除网站内容时出错:', error);
      return false;
    }
  }

  // Contact Info methods
  async getContactInfo(key: string): Promise<string | null> {
    const [info] = await db.select().from(contactInfo).where(eq(contactInfo.key, key));
    return info ? info.value : null;
  }

  async getAllContactInfo(): Promise<Record<string, string>> {
    const infoList = await db.select().from(contactInfo);
    const result: Record<string, string> = {};
    
    for (const info of infoList) {
      result[info.key] = info.value;
    }
    
    return result;
  }

  async updateContactInfo(key: string, value: string): Promise<boolean> {
    // 检查是否已存在
    const existing = await this.getContactInfo(key);
    
    if (existing !== null) {
      // 更新现有记录
      await db.update(contactInfo)
        .set({ value, updatedAt: new Date() })
        .where(eq(contactInfo.key, key));
      return true;
    } else {
      // 创建新记录
      await db.insert(contactInfo).values({ key, value });
      return true;
    }
  }
  
  // Music methods
  async getMusicTracks(): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks).orderBy(desc(musicTracks.createdAt));
  }

  async getMusicTrackById(id: number): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track;
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [newTrack] = await db.insert(musicTracks).values(track).returning();
    return newTrack;
  }

  async updateMusicTrack(id: number, data: Partial<MusicTrack>): Promise<MusicTrack | undefined> {
    const [track] = await db.update(musicTracks)
      .set(data)
      .where(eq(musicTracks.id, id))
      .returning();
    
    return track;
  }

  async deleteMusicTrack(id: number): Promise<boolean> {
    try {
      await db.delete(musicTracks).where(eq(musicTracks.id, id));
      return true;
    } catch (error) {
      console.error('删除音乐曲目时出错:', error);
      return false;
    }
  }
  // User methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<InsertUser, "passwordHash"> & {password: string}): Promise<User> {
    const { password, ...userDataWithoutPassword } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(users)
      .values({ ...userDataWithoutPassword, passwordHash })
      .returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('删除用户时出错:', error);
      return false;
    }
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: {customerId: string, subscriptionId: string}): Promise<User> {
    const [user] = await db.update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.featured), products.name);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.category, category))
      .orderBy(desc(products.featured), products.name);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    return product;
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
    return await db.select().from(products)
      .where(sql`${products.featured} > 0`)
      .orderBy(desc(products.featured))
      .limit(4);
  }

  // Cart methods
  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const items = await db.select().from(cartItems)
      .where(eq(cartItems.sessionId, sessionId));
    
    // Join with products
    const result: CartItemWithProduct[] = [];
    
    for (const item of items) {
      const [product] = await db.select().from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        result.push({ ...item, product });
      }
    }
    
    return result;
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item;
  }

  async getCartItemByProductAndSession(productId: number, sessionId: string): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems)
      .where(and(
        eq(cartItems.productId, productId),
        eq(cartItems.sessionId, sessionId)
      ));
    
    return item;
  }

  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const [newItem] = await db.insert(cartItems).values(cartItem).returning();
    return newItem;
  }

  async updateCartItem(id: number, quantity: number, size?: string): Promise<CartItem | undefined> {
    const updateData: any = { quantity };
    if (size !== undefined) {
      updateData.size = size;
    }
    
    const [item] = await db.update(cartItems)
      .set(updateData)
      .where(eq(cartItems.id, id))
      .returning();
    
    return item;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return true;
    } catch (error) {
      console.error('删除购物车项目时出错:', error);
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

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersBySessionId(sessionId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.sessionId, sessionId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order> {
    // Create the order first
    const [newOrder] = await db.insert(orders).values(order).returning();

    // Then create all the order items
    for (const item of items) {
      await db.insert(orderItems).values({
        ...item,
        orderId: newOrder.id
      });
    }

    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }
  
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) {
      return undefined;
    }
    
    const orderItemsList = await db.select().from(orderItems)
      .where(eq(orderItems.orderId, id));
    
    const itemsWithProducts = [];
    
    for (const item of orderItemsList) {
      const [product] = await db.select().from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        itemsWithProducts.push({ ...item, product });
      }
    }
    
    return {
      ...order,
      items: itemsWithProducts
    };
  }

  // Newsletter operations
  async getSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers)
      .where(eq(subscribers.active, 1))
      .orderBy(subscribers.email);
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers)
      .where(eq(subscribers.email, email));
    
    return subscriber;
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [newSubscriber] = await db.insert(subscribers).values(subscriber).returning();
    return newSubscriber;
  }

  async unsubscribe(email: string): Promise<boolean> {
    try {
      await db.update(subscribers)
        .set({ active: 0 })
        .where(eq(subscribers.email, email));
      return true;
    } catch (error) {
      console.error('取消订阅时出错:', error);
      return false;
    }
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
  
  // Crypto News methods
  async getCryptoNews(limit: number = 20, offset: number = 0): Promise<CryptoNews[]> {
    return await db.select().from(cryptoNews)
      .orderBy(desc(cryptoNews.publishedAt))
      .limit(limit)
      .offset(offset);
  }
  
  async getCryptoNewsById(id: number): Promise<CryptoNews | undefined> {
    const [news] = await db.select().from(cryptoNews).where(eq(cryptoNews.id, id));
    return news;
  }
  
  async getCryptoNewsByCategory(category: string, limit: number = 10): Promise<CryptoNews[]> {
    return await db.select().from(cryptoNews)
      .where(eq(cryptoNews.category, category))
      .orderBy(desc(cryptoNews.publishedAt))
      .limit(limit);
  }
  
  async getHighlightedCryptoNews(limit: number = 5): Promise<CryptoNews[]> {
    return await db.select().from(cryptoNews)
      .where(eq(cryptoNews.isHighlighted, 1))
      .orderBy(desc(cryptoNews.publishedAt))
      .limit(limit);
  }
  
  async createCryptoNews(news: InsertCryptoNews): Promise<CryptoNews> {
    const [newNews] = await db.insert(cryptoNews).values(news).returning();
    return newNews;
  }
  
  async updateCryptoNews(id: number, data: Partial<CryptoNews>): Promise<CryptoNews | undefined> {
    const [news] = await db.update(cryptoNews)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(cryptoNews.id, id))
      .returning();
    
    return news;
  }
  
  async deleteCryptoNews(id: number): Promise<boolean> {
    try {
      await db.delete(cryptoNews).where(eq(cryptoNews.id, id));
      return true;
    } catch (error) {
      console.error('删除加密新闻时出错:', error);
      return false;
    }
  }
  
  async getCryptoNewsCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(cryptoNews);
    return Number(result[0].count);
  }
  
  // Crypto Tweets methods
  async getCryptoTweets(limit: number = 20, category?: string): Promise<CryptoTweet[]> {
    // 如果指定了类别，则按类别筛选
    if (category) {
      return await db.select().from(cryptoTweets)
        .where(eq(cryptoTweets.category, category))
        .orderBy(
          desc(cryptoTweets.retweetCount),
          desc(cryptoTweets.likeCount),
          desc(cryptoTweets.createdAt)
        )
        .limit(limit);
    }
    
    // 否则返回所有推文
    return await db.select().from(cryptoTweets)
      .orderBy(
        desc(cryptoTweets.likeCount),
        desc(cryptoTweets.retweetCount),
        desc(cryptoTweets.createdAt)
      )
      .limit(limit);
  }
  
  async getCryptoTweetById(id: number): Promise<CryptoTweet | undefined> {
    const [tweet] = await db.select().from(cryptoTweets).where(eq(cryptoTweets.id, id));
    return tweet;
  }
  
  async getCryptoTweetByTweetId(tweetId: string): Promise<CryptoTweet | undefined> {
    const [tweet] = await db.select().from(cryptoTweets).where(eq(cryptoTweets.tweetId, tweetId));
    return tweet;
  }
  
  async createCryptoTweet(tweet: InsertCryptoTweet): Promise<CryptoTweet> {
    const [newTweet] = await db.insert(cryptoTweets).values(tweet).returning();
    return newTweet;
  }
  
  async updateCryptoTweet(id: number, data: Partial<CryptoTweet>): Promise<CryptoTweet | undefined> {
    const [tweet] = await db.update(cryptoTweets)
      .set(data)
      .where(eq(cryptoTweets.id, id))
      .returning();
    
    return tweet;
  }
  
  async updateTweetTranslation(id: number, translatedText: string): Promise<CryptoTweet | undefined> {
    const [tweet] = await db.update(cryptoTweets)
      .set({ translatedText })
      .where(eq(cryptoTweets.id, id))
      .returning();
    
    return tweet;
  }
  
  async deleteCryptoTweet(id: number): Promise<boolean> {
    try {
      await db.delete(cryptoTweets).where(eq(cryptoTweets.id, id));
      return true;
    } catch (error) {
      console.error('删除推文时出错:', error);
      return false;
    }
  }
  
  // Telegram Messages methods
  async getTelegramMessages(limit: number = 20): Promise<TelegramMessage[]> {
    return await db.select().from(telegramMessages)
      .orderBy(desc(telegramMessages.date))
      .limit(limit);
  }
  
  async getTelegramMessageById(id: number): Promise<TelegramMessage | undefined> {
    const [message] = await db.select().from(telegramMessages).where(eq(telegramMessages.id, id));
    return message;
  }
  
  async getTelegramMessageByMessageId(messageId: number): Promise<TelegramMessage | undefined> {
    const [message] = await db.select().from(telegramMessages)
      .where(eq(telegramMessages.messageId, messageId));
    return message;
  }
  
  async createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage> {
    const [newMessage] = await db.insert(telegramMessages).values(message).returning();
    return newMessage;
  }
  
  async updateTelegramMessage(id: number, data: Partial<TelegramMessage>): Promise<TelegramMessage | undefined> {
    const [message] = await db.update(telegramMessages)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(telegramMessages.id, id))
      .returning();
    
    return message;
  }
  
  async deleteTelegramMessage(id: number): Promise<boolean> {
    try {
      await db.delete(telegramMessages).where(eq(telegramMessages.id, id));
      return true;
    } catch (error) {
      console.error('删除Telegram消息时出错:', error);
      return false;
    }
  }
}

// Initialize with sample data
async function seedInitialData() {
  // Check if products table is empty
  const existingProducts = await db.select().from(products);
  
  if (existingProducts.length === 0) {
    // Add sample products
    const sampleProducts: InsertProduct[] = [
      {
        name: "STONKS T恤",
        description: "独家设计的STONKS DEX T恤，采用100%有机棉制作，舒适透气。正面印有标志性的STONKS图案和品牌logo。",
        price: 25,
        ethPrice: 0.01,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 50
      },
      {
        name: "DEX 棒球帽",
        description: "经典棒球帽设计，前面绣有DEX标志，可调节大小，适合各种场合佩戴。",
        price: 20,
        ethPrice: 0.008,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 30
      },
      {
        name: "限量 NFT",
        description: "STONKS DEX限量版NFT，独特的数字艺术品，存储在以太坊区块链上，拥有永久所有权证明。",
        price: 50,
        ethPrice: 0.02,
        category: "digital",
        imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 10
      },
      {
        name: "STONKS 马克杯",
        description: "高质量陶瓷马克杯，印有STONKS DEX标志，容量350ml，微波炉和洗碗机安全。",
        price: 15,
        ethPrice: 0.006,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1577155436706-6dc10102977f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 40
      },
      {
        name: "STONKS 连帽衫",
        description: "高品质连帽卫衣，保暖舒适，前胸印有STONKS DEX标志，袖口和下摆采用罗纹设计。",
        price: 45,
        ethPrice: 0.018,
        category: "clothing",
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 25
      },
      {
        name: "DEX 贴纸套装",
        description: "一套10张高品质乙烯基贴纸，包含各种STONKS DEX相关设计，防水耐用。",
        price: 10,
        ethPrice: 0.004,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 100
      },
      {
        name: "STONKS 海报",
        description: "高清印刷海报，采用优质纸张，展示STONKS DEX标志性图像和品牌元素。",
        price: 18,
        ethPrice: 0.007,
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1561059544-105d204c2913?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 60
      },
      {
        name: "DEX 数字壁纸",
        description: "高分辨率数字壁纸套装，包含5张不同设计，适用于各种设备的屏幕。",
        price: 5,
        ethPrice: 0.002,
        category: "digital",
        imageUrl: "https://images.unsplash.com/photo-1640390939772-bd12aa7cb160?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        stock: 999
      }
    ];

    for (const product of sampleProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Sample products added to the database");
  }

  // Check if admin user exists
  const adminUser = await db.select().from(users).where(eq(users.role, "admin"));
  
  if (adminUser.length === 0) {
    // Create an admin user
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@stonksdex.com",
      passwordHash: passwordHash,
      role: "admin"
    });
    
    console.log("✅ Admin user created");
  }
  
  // 检查并添加默认联系信息
  const existingContactInfo = await db.select().from(contactInfo);
  
  // 如果没有联系信息记录，添加默认数据
  if (existingContactInfo.length === 0) {
    await db.insert(contactInfo).values({ key: "email", value: "support@stonksdex.io" });
    await db.insert(contactInfo).values({ key: "address", value: "新加坡, 区块链大厦 #42-01" });
    
    console.log("✅ Default contact information added");
  }
}

// Create storage instance and seed data
export const storage = new DatabaseStorage();
seedInitialData().catch(err => {
  console.error("Error seeding initial data:", err);
});
