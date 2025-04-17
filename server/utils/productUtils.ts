// 产品数据格式转换工具
import { storage } from "../storage";

/**
 * 将蛇形命名(snake_case)的产品数据转换为驼峰命名(camelCase)
 * 用于API响应给前端
 */
export async function transformProductToCamelCase(product: any): Promise<any> {
  if (!product) return null;
  
  // 使用实时的STONKS/USD价格计算stonksPrice (如果没有提供stonks_price字段)
  // 从storage获取实时STONKS价格
  const currentStonksPrice = await storage.getCurrentStonksPrice();
  const stonksPrice = product.stonks_price || product.stonksPrice || (product.price / currentStonksPrice);
  
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stonksPrice: stonksPrice,
    ethPrice: product.ethPrice,
    stock: product.stock || product.inventory, // 支持两种字段名
    isActive: product.is_active !== undefined ? product.is_active : true,  // 默认激活
    imageUrl: product.image_url || product.imageUrl, // 支持两种字段名
    imageUrls: product.image_urls || product.imageUrls || [], // 支持两种字段名
    category: product.category,
    featured: product.featured,
    hasSizes: product.hasSizes,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

/**
 * 将驼峰命名(camelCase)的产品数据转换为蛇形命名(snake_case)
 * 用于前端传递到API
 */
export function transformProductToSnakeCase(product: any): any {
  if (!product) return null;
  
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stonks_price: product.stonksPrice,
    ethPrice: product.ethPrice,
    stock: product.stock || product.inventory, // 支持两种字段名
    is_active: product.isActive,
    image_url: product.imageUrl, // 转换为蛇形命名
    image_urls: product.imageUrls || [], // 转换为蛇形命名
    category: product.category,
    featured: product.featured,
    hasSizes: product.hasSizes,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

/**
 * 转换产品列表
 */
export async function transformProductListToCamelCase(products: any[]): Promise<any[]> {
  if (!products || !Array.isArray(products)) return [];
  
  // 使用Promise.all处理异步转换
  const transformedProducts = await Promise.all(
    products.map(product => transformProductToCamelCase(product))
  );
  
  return transformedProducts;
}