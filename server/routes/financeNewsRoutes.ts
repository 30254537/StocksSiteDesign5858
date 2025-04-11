import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import * as financeNewsService from '../services/financeNewsService';

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

// 获取最新的财经快讯
router.get('/finance-news', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const news = await financeNewsService.getLatestFinanceNews(limit);
    
    res.json({
      data: news,
      pagination: {
        total: news.length,
        limit,
        offset: 0,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('获取财经快讯失败:', error);
    res.status(500).json({ error: '获取财经快讯时发生错误' });
  }
});

// 手动触发财经快讯获取 (仅限管理员)
router.post('/finance-news/fetch', requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('管理员请求手动获取财经快讯');
    const limit = req.body.limit ? parseInt(req.body.limit) : 10;
    const news = await financeNewsService.fetchAndStoreFinanceNews(limit);
    
    // 记录抓取结果
    console.log(`管理员手动获取成功，添加了 ${news.length} 条新的财经快讯`);
    
    res.json({ 
      success: true, 
      message: `成功获取并添加 ${news.length} 条新的财经快讯` 
    });
  } catch (error) {
    console.error('管理员手动获取财经快讯失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取财经快讯时发生错误',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;