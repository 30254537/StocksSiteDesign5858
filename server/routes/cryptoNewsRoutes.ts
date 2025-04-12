import { Express } from "express";
import { 
  getLatestCryptoNews, 
  getCryptoNewsBySource, 
  getCryptoNewsByCategory,
  syncCryptoNews
} from "../services/cryptoNewsService";
import cron from "node-cron";

export function setupCryptoNewsRoutes(app: Express) {
  // 获取最新加密新闻的API
  app.get("/api/crypto-news", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const news = await getLatestCryptoNews(limit);
      res.json(news);
    } catch (error) {
      console.error("获取加密新闻失败:", error);
      res.status(500).json({ message: "获取加密新闻失败" });
    }
  });

  // 获取特定来源的加密新闻API
  app.get("/api/crypto-news/source/:source", async (req, res) => {
    try {
      const { source } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const news = await getCryptoNewsBySource(source, limit);
      res.json(news);
    } catch (error) {
      console.error(`获取来源为 ${req.params.source} 的加密新闻失败:`, error);
      res.status(500).json({ message: "获取加密新闻失败" });
    }
  });

  // 获取特定类别的加密新闻API
  app.get("/api/crypto-news/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const news = await getCryptoNewsByCategory(category, limit);
      res.json(news);
    } catch (error) {
      console.error(`获取类别为 ${req.params.category} 的加密新闻失败:`, error);
      res.status(500).json({ message: "获取加密新闻失败" });
    }
  });

  // 手动触发同步加密新闻的API（公开）
  app.post("/api/crypto-news/sync", async (req, res) => {
    try {
      await syncCryptoNews();
      res.json({ message: "加密新闻同步成功" });
    } catch (error) {
      console.error("手动同步加密新闻失败:", error);
      res.status(500).json({ message: "同步加密新闻失败" });
    }
  });

  // 设置定时任务，每10分钟同步一次加密新闻
  cron.schedule("*/10 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] 执行定时任务: 同步加密新闻...`);
    try {
      await syncCryptoNews();
    } catch (error) {
      console.error("定时同步加密新闻失败:", error);
    }
  });

  // 启动后立即执行一次同步
  setTimeout(async () => {
    console.log("首次启动同步加密新闻...");
    try {
      await syncCryptoNews();
    } catch (error) {
      console.error("首次启动同步加密新闻失败:", error);
    }
  }, 5000); // 等待5秒后执行，确保应用充分启动
}