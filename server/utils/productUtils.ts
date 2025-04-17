// 产品数据格式转换工具

/**
 * 将蛇形命名(snake_case)的产品数据转换为驼峰命名(camelCase)
 * 用于API响应给前端
 */
export function transformProductToCamelCase(product: any): any {
  if (!product) return null;
  
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stonksPrice: product.stonks_price,
    ethPrice: product.ethPrice,
    stock: product.stock || product.inventory, // 支持两种字段名
    isActive: product.is_active,
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
export function transformProductListToCamelCase(products: any[]): any[] {
  if (!products || !Array.isArray(products)) return [];
  return products.map(transformProductToCamelCase);
}