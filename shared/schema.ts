import { pgTable, text, serial, integer, doublePrecision, timestamp, primaryKey, foreignKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: text("role").default("user").notNull(),
  lastLogin: timestamp("last_login"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
}).extend({
  password: z.string().min(8),
});

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  ethPrice: doublePrecision("eth_price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(), // 保留主图兼容旧数据
  imageUrls: text("image_urls").array(), // 新增多图支持
  stock: integer("stock").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  featured: integer("featured").default(0),
  hasSizes: integer("has_sizes").default(0),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  featured: true,
});

// Cart item model
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  sessionId: text("session_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  status: text("status").notNull().default("pending"),
  total: doublePrecision("total").notNull(),
  ethTotal: doublePrecision("eth_total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Order items model
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  ethPrice: doublePrecision("eth_price").notNull(),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// 类型定义在下方统一定义

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: integer("active").default(1).notNull(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  createdAt: true,
  active: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema> & { passwordHash: string };
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

// Extended types with relations
export type CartItemWithProduct = CartItem & { product: Product };
export type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };
export type OrderItemWithProduct = OrderItem & { product: Product };

// Music Models
export const musicTracks = pgTable("music_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").default("Unknown Artist"),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  duration: doublePrecision("duration").notNull().default(0),
  isPublic: integer("is_public").default(1),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({
  id: true,
  createdAt: true,
});

export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;

// 联系信息相关表
export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),  // 键名，如 "email", "address"
  value: text("value").notNull(), // 键值
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ContactInfo = typeof contactInfo.$inferSelect;
export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;

// 加密货币合约地址表
export const contractAddresses = pgTable("contract_addresses", {
  id: serial("id").primaryKey(),
  network: text("network").notNull(),  // 网络，如 "TRC20", "ERC20", "BEP20", "SOL"
  coinType: text("coin_type").notNull(), // 币种类型，如 "USDT", "STONKS"
  address: text("address").notNull(),  // 合约地址
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertContractAddressSchema = createInsertSchema(contractAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true
});

export type ContractAddress = typeof contractAddresses.$inferSelect;
export type InsertContractAddress = z.infer<typeof insertContractAddressSchema>;

// 加密快讯模型
export const cryptoNews = pgTable("crypto_news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(), // 新闻来源网站
  sourceUrl: text("source_url").notNull(), // 原始链接
  imageUrl: text("image_url"), // 可选的新闻图片
  category: text("category").default("general"), // 分类如：比特币、以太坊、DeFi等
  isHighlighted: integer("is_highlighted").default(0), // 是否为重点新闻
  publishedAt: timestamp("published_at").notNull(), // 原始发布时间
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCryptoNewsSchema = createInsertSchema(cryptoNews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CryptoNews = typeof cryptoNews.$inferSelect;
export type InsertCryptoNews = z.infer<typeof insertCryptoNewsSchema>;

// X推文模型
export const cryptoTweets = pgTable("crypto_tweets", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull().unique(), // X平台原始推文ID
  text: text("text").notNull(), // 推文内容
  authorName: text("author_name").notNull(), // 作者名称
  authorUsername: text("author_username").notNull(), // 作者用户名
  authorProfileImage: text("author_profile_image"), // 作者头像URL
  likeCount: integer("like_count").default(0), // 点赞数
  retweetCount: integer("retweet_count").default(0), // 转发数
  replyCount: integer("reply_count").default(0), // 回复数
  quoteCount: integer("quote_count").default(0), // 引用数
  url: text("url").notNull(), // 推文URL
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  source: text("source").default("x"), // 来源，默认为X
  category: text("category").default("crypto"), // 分类
  language: text("language").default("en"), // 语言
  translatedText: text("translated_text"), // 翻译后的内容
  contractAddress: text("contract_address"), // 提取的合约地址
});

export const insertCryptoTweetSchema = createInsertSchema(cryptoTweets).omit({
  id: true,
  createdAt: true,
});

export type CryptoTweet = typeof cryptoTweets.$inferSelect;
export type InsertCryptoTweet = z.infer<typeof insertCryptoTweetSchema>;

// Telegram 消息模型
export const telegramMessages = pgTable("telegram_messages", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().unique(), // Telegram 消息ID
  text: text("text").notNull(), // 消息内容
  sender: text("sender"), // 发送者名称
  channelTitle: text("channel_title"), // 频道名称
  mediaUrl: text("media_url"), // 媒体URL (如图片、视频等)
  sourceUrl: text("source_url"), // 来源URL，用于阅读全文跳转
  date: timestamp("date").defaultNow().notNull(), // 消息日期
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
  isDisplayed: boolean("is_displayed").default(true), // 是否显示
  channelId: text("channel_id"), // 频道ID
});

export const insertTelegramMessageSchema = createInsertSchema(telegramMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type InsertTelegramMessage = z.infer<typeof insertTelegramMessageSchema>;

// MoontokListing 推文模型
export const tweets = pgTable("tweets", {
  id: serial("id").primaryKey(),
  tweetId: text("tweet_id").notNull().unique(), // 推文ID
  text: text("text").notNull(), // 推文内容
  authorId: text("author_id").notNull(), // 作者ID
  authorName: text("author_name").notNull(), // 作者名称
  authorUsername: text("author_username").notNull(), // 作者用户名
  profileImageUrl: text("profile_image_url"), // 作者头像
  mediaUrl: text("media_url"), // 媒体URL (图片、视频链接)
  createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
  isDisplayed: boolean("is_displayed").default(true), // 是否显示
});

export const insertTweetSchema = createInsertSchema(tweets).omit({
  id: true,
  createdAt: true,
});

export type Tweet = typeof tweets.$inferSelect;
export type InsertTweet = z.infer<typeof insertTweetSchema>;
