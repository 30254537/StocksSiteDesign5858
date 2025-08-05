import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
  role: text("role").default("user").notNull(),
  lastLogin: text("last_login"),
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
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  ethPrice: real("eth_price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls"), // JSON string for array
  stock: integer("stock").notNull().default(10),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
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
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  sessionId: text("session_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: text("size"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

// Order model
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(),
  status: text("status").notNull().default("pending"),
  total: real("total").notNull(),
  ethTotal: real("eth_total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  transactionHash: text("transaction_hash"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Order item model
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  ethPrice: real("eth_price").notNull(),
  size: text("size"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Telegram messages for crypto news
export const telegramMessages = sqliteTable("telegram_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: integer("message_id").notNull(),
  channelId: text("channel_id").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Crypto news
export const cryptoNews = sqliteTable("crypto_news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  url: text("url"),
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  category: text("category").default("general"),
});

// Crypto prices
export const cryptoPrices = sqliteTable("crypto_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  change24h: real("change_24h"),
  marketCap: real("market_cap"),
  volume24h: real("volume_24h"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Community posts
export const communityPosts = sqliteTable("community_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  category: text("category").default("general"),
  tags: text("tags"), // JSON string for array
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

// Community comments
export const communityComments = sqliteTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  parentId: integer("parent_id"),
  likes: integer("likes").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  views: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  likes: true,
});

// Export type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type NewTelegramMessage = typeof telegramMessages.$inferInsert;
export type CryptoNews = typeof cryptoNews.$inferSelect;
export type NewCryptoNews = typeof cryptoNews.$inferInsert;
export type CryptoPrice = typeof cryptoPrices.$inferSelect;
export type NewCryptoPrice = typeof cryptoPrices.$inferInsert;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type NewCommunityPost = typeof communityPosts.$inferInsert;
export type CommunityComment = typeof communityComments.$inferSelect;
export type NewCommunityComment = typeof communityComments.$inferInsert;
