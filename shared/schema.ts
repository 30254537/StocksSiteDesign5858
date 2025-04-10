import { pgTable, text, serial, integer, doublePrecision, timestamp, primaryKey, foreignKey } from "drizzle-orm/pg-core";
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
