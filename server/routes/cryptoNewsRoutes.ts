import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { fetchAndStoreNews } from '../services/cryptoNewsService';

// 引入全局管理员变量(这里使用声明扩展接口的方式)
declare global {
  var adminLoggedIn: boolean;
}

// 管理员权限检查中间件
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (global.adminLoggedIn) {
    next();
  } else {
    res.status(401).json({ success: false, message: "需要管理员权限" });
  }
};

const router = Router();

// 获取最新的加密货币新闻
router.get('/news', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const news = await storage.getCryptoNews(limit, offset);
    const total = await storage.getCryptoNewsCount();
    
    res.json({
      data: news,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('获取加密货币新闻失败:', error);
    res.status(500).json({ error: '获取加密货币新闻时发生错误' });
  }
});

// 获取特定分类的加密货币新闻
router.get('/news/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const news = await storage.getCryptoNewsByCategory(category, limit);
    res.json(news);
  } catch (error) {
    console.error(`获取分类 ${req.params.category} 的加密货币新闻失败:`, error);
    res.status(500).json({ error: '获取分类加密货币新闻时发生错误' });
  }
});

// 获取重点加密货币新闻
router.get('/news/highlighted', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const news = await storage.getHighlightedCryptoNews(limit);
    res.json(news);
  } catch (error) {
    console.error('获取重点加密货币新闻失败:', error);
    res.status(500).json({ error: '获取重点加密货币新闻时发生错误' });
  }
});

// 获取单个加密货币新闻详情
router.get('/news/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const news = await storage.getCryptoNewsById(id);
    
    if (!news) {
      return res.status(404).json({ error: '找不到指定的加密货币新闻' });
    }
    
    res.json(news);
  } catch (error) {
    console.error(`获取ID为 ${req.params.id} 的加密货币新闻失败:`, error);
    res.status(500).json({ error: '获取加密货币新闻详情时发生错误' });
  }
});

// 手动触发新闻获取 (仅限管理员)
router.post('/news/fetch', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('管理员请求手动获取加密货币新闻');
    const addedCount = await fetchAndStoreNews();
    
    // 记录抓取结果
    console.log(`管理员手动获取成功，添加了 ${addedCount} 条新的加密货币新闻`);
    
    res.json({ 
      success: true, 
      message: `成功获取并添加 ${addedCount} 条新的加密货币新闻` 
    });
  } catch (error) {
    console.error('管理员手动获取加密货币新闻失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取加密货币新闻时发生错误',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;