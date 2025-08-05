import { sqliteTable, text, integer, real, primaryKey, foreignKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  role: text("role").default("user").notNull(),
  lastLogin: integer("last_login", { mode: 'timestamp' }),
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
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  ethPrice: real("eth_price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls"), // JSON string for SQLite
  stock: integer("stock").notNull().default(10),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  featured: integer("featured").default(0),
  hasSizes: integer("has_sizes").default(0),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Category model
export const categories = sqliteTable("categories", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Order model
export const orders = sqliteTable("orders", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  paymentMethod: text("payment_method").default("stripe"),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Order Items model
export const orderItems = sqliteTable("order_items", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  size: text("size"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  orderIdFk: foreignKey({
    columns: [table.orderId],
    foreignColumns: [orders.id],
  }),
  productIdFk: foreignKey({
    columns: [table.productId],
    foreignColumns: [products.id],
  }),
}));

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Cart model
export const cart = sqliteTable("cart", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  size: text("size"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
  productIdFk: foreignKey({
    columns: [table.productId],
    foreignColumns: [products.id],
  }),
}));

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Telegram 消息模型
export const telegramMessages = sqliteTable("telegram_messages", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  messageId: integer("message_id").notNull().unique(), // Telegram 消息ID
  text: text("text").notNull(), // 消息内容
  sender: text("sender"), // 发送者名称
  channelTitle: text("channel_title"), // 频道名称
  mediaUrl: text("media_url"), // 媒体URL (如图片、视频等)
  sourceUrl: text("source_url"), // 来源URL，用于阅读全文跳转
  date: integer("date", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()), // 消息日期
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()), // 创建时间
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()), // 更新时间
  isDisplayed: integer("is_displayed", { mode: 'boolean' }).default(1), // 是否显示
  channelId: text("channel_id"), // 频道ID
});

export const insertTelegramMessageSchema = createInsertSchema(telegramMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export all table types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert;
export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type NewTelegramMessage = typeof telegramMessages.$inferInsert;