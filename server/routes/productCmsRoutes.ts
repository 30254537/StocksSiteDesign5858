import type { Express } from "express";
import { storage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transformProductToCamelCase, transformProductListToCamelCase } from "../utils/productUtils";

// 配置multer用于处理产品图片上传
const productUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve("public/uploads/products");
      
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'product-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

// 设置产品管理路由
export function setupProductCmsRoutes(app: Express) {
  // 获取所有产品
  app.get('/api/cms/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      // 将所有产品数据转换为驼峰命名格式
      const formattedProducts = transformProductListToCamelCase(products);
      res.json(formattedProducts);
    } catch (error) {
      console.error('获取产品列表时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 获取单个产品
  app.get('/api/cms/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(parseInt(id));
      
      if (!product) {
        return res.status(404).json({ message: '未找到指定的产品' });
      }
      
      // 将产品数据转换为驼峰命名格式
      const formattedProduct = transformProductToCamelCase(product);
      res.json(formattedProduct);
    } catch (error) {
      console.error('获取产品详情时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
  
  // 添加产品（需要管理员权限）
  app.post('/api/cms/products', productUpload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      console.log('添加产品请求数据:', req.body);
      console.log('添加产品上传文件:', req.files);
      
      // 处理上传的图片文件
      let imageUrls: string[] = [];
      
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        imageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/products/${file.filename}`
        );
        console.log(`上传了 ${req.files.length} 张产品图片:`, imageUrls);
      }
      
      // 解析价格和库存为数字
      const price = parseFloat(req.body.price);
      const stonksPrice = parseFloat(req.body.stonksPrice);
      const stock = parseInt(req.body.stock || '999');
      
      // 准备产品数据
      const productData = {
        name: req.body.name,
        description: req.body.description || '',
        price: price,
        stonksPrice: stonksPrice,
        ethPrice: price / 0.037, // 使用默认STONKS价格
        category: 'merchandise', // 默认分类
        stock: stock,
        isActive: req.body.isActive === '1' || req.body.isActive === 'true',
        featured: 0,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
        imageUrls: imageUrls,
        hasSizes: 0
      };
      
      // 创建产品
      const newProduct = await storage.createProduct(productData);
      // 转换为驼峰格式
      const formattedProduct = transformProductToCamelCase(newProduct);
      res.status(201).json(formattedProduct);
    } catch (error) {
      console.error('创建产品时出错:', error);
      res.status(500).json({ 
        message: '服务器错误',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 更新产品（需要管理员权限）
  app.put('/api/cms/products/:id', productUpload.array('images', 5), async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const { id } = req.params;
      const productId = parseInt(id);
      
      // 获取现有产品信息
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: '未找到指定的产品' });
      }
      
      console.log('更新产品请求数据:', req.body);
      console.log('更新产品上传文件:', req.files);
      
      // 处理上传的图片文件
      let newImageUrls: string[] = [];
      
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        newImageUrls = (req.files as Express.Multer.File[]).map(file => 
          `/uploads/products/${file.filename}`
        );
        console.log(`上传了 ${req.files.length} 张新产品图片:`, newImageUrls);
      }
      
      // 保留现有图片URLs (如果存在)
      const existingImageUrls = existingProduct.imageUrls || [];
      
      // 合并现有图片和新上传的图片
      const combinedImageUrls = [...existingImageUrls, ...newImageUrls];
      
      // 解析价格和库存为数字
      const price = parseFloat(req.body.price);
      const stonksPrice = parseFloat(req.body.stonksPrice);
      const stock = parseInt(req.body.stock || existingProduct.stock.toString());
      
      // 准备更新的产品数据
      const productData = {
        name: req.body.name,
        description: req.body.description || existingProduct.description,
        price: price,
        stonksPrice: stonksPrice,
        ethPrice: price / 0.037, // 使用默认STONKS价格
        stock: stock,
        isActive: req.body.isActive === '1' || req.body.isActive === 'true',
        imageUrl: combinedImageUrls.length > 0 ? combinedImageUrls[0] : existingProduct.imageUrl,
        imageUrls: combinedImageUrls
      };
      
      // 更新产品
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      if (!updatedProduct) {
        return res.status(500).json({ message: '更新产品失败' });
      }
      
      // 转换为驼峰格式返回给前端
      const formattedProduct = transformProductToCamelCase(updatedProduct);
      res.json(formattedProduct);
    } catch (error) {
      console.error('更新产品时出错:', error);
      res.status(500).json({ 
        message: '服务器错误',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // 删除产品（需要管理员权限）
  app.delete('/api/cms/products/:id', async (req, res) => {
    try {
      if (!global.adminLoggedIn) {
        return res.status(401).json({ message: '需要管理员权限' });
      }
      
      const { id } = req.params;
      const productId = parseInt(id);
      
      // 获取产品信息，以便删除相关图片
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: '未找到指定的产品' });
      }
      
      // 删除主图片文件
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        const imagePath = path.resolve(`public${product.imageUrl}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`已删除产品主图片: ${imagePath}`);
          } catch (err) {
            console.error(`删除产品主图片时出错:`, err);
          }
        }
      }
      
      // 删除所有附加图片文件
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach((imgUrl: string) => {
          if (imgUrl && imgUrl.startsWith('/uploads/')) {
            const imagePath = path.resolve(`public${imgUrl}`);
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
                console.log(`已删除产品附加图片: ${imagePath}`);
              } catch (err) {
                console.error(`删除产品附加图片时出错:`, err);
              }
            }
          }
        });
      }
      
      // 执行删除操作
      const success = await storage.deleteProduct(productId);
      
      if (!success) {
        return res.status(500).json({ message: '删除产品失败' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除产品时出错:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });
}