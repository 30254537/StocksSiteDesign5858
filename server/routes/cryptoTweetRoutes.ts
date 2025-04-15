import { Express } from "express";
import { 
  getLatestCryptoTweets, 
  getCryptoTweetsByTopic,
  syncCryptoTweets,
  generateDummyCryptoTweets
} from "../services/cryptoTwitterService";
import cron from "node-cron";

export function setupCryptoTweetRoutes(app: Express) {
  // 获取最新加密推文
  app.get("/api/crypto-tweets", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const tweets = await getLatestCryptoTweets(limit);
      
      // 如果没有获取到真实数据，尝试使用X Bearer Token
      if (tweets.length === 0 && process.env.X_BEARER_TOKEN) {
        console.log("从数据库中未找到推文，尝试从Twitter API获取...");
        await syncCryptoTweets();
        const freshTweets = await getLatestCryptoTweets(limit);
        res.json(freshTweets);
      } else if (tweets.length === 0) {
        // 如果没有API token，使用模拟数据
        console.log("未找到真实推文数据，生成占位数据...");
        // 提示用户添加X_BEARER_TOKEN环境变量
        res.status(200).json({
          tweets: generateDummyCryptoTweets(10),
          message: "使用模拟数据。请添加X_BEARER_TOKEN环境变量以获取真实数据。"
        });
      } else {
        res.json(tweets);
      }
    } catch (error) {
      console.error("获取加密推文失败:", error);
      res.status(500).json({ message: "获取加密推文失败" });
    }
  });

  // 获取特定话题的加密推文
  app.get("/api/crypto-tweets/topic/:topic", async (req, res) => {
    try {
      const { topic } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const tweets = await getCryptoTweetsByTopic(topic, limit);
      res.json(tweets);
    } catch (error) {
      console.error(`获取话题为 ${req.params.topic} 的推文失败:`, error);
      res.status(500).json({ message: `获取话题为 ${req.params.topic} 的推文失败` });
    }
  });

  // 手动同步加密推文 - 管理员路由
  app.post("/api/crypto-tweets/sync", async (req, res) => {
    try {
      await syncCryptoTweets();
      res.json({ message: "成功同步加密推文" });
    } catch (error) {
      console.error("同步加密推文失败:", error);
      res.status(500).json({ message: "同步加密推文失败" });
    }
  });

  // 设置每小时自动同步推文的定时任务
  if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 * * * *', async () => {
      console.log('执行定时任务: 同步加密推文');
      try {
        await syncCryptoTweets();
      } catch (error) {
        console.error('自动同步加密推文失败:', error);
      }
    });
  }
}