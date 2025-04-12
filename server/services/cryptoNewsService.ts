import { db } from "../db";
import { InsertCryptoNews, cryptoNews } from "@shared/schema";
import { fetchBlockBeatsNews } from "./blockBeatsService";
import { fetchJinseNews } from "./jinseService";
import { fetchHuoxingNews } from "./huoxingService";
import { eq } from "drizzle-orm";

// 主加密新闻服务
export async function syncCryptoNews(): Promise<void> {
  try {
    console.log("[Cron] 开始同步加密快讯实时资讯...");

    // 从所有来源获取新闻
    const blockBeatsNews = await fetchBlockBeatsNews();
    console.log("开始从金色财经API获取快讯...");
    const jinseNews = await fetchJinseNews();
    console.log("开始从火星财经API获取快讯...");
    const huoxingNews = await fetchHuoxingNews();

    // 合并所有新闻
    const allNews = [
      ...blockBeatsNews,
      ...jinseNews,
      ...huoxingNews
    ];

    console.log(`总共获取到 ${allNews.length} 条来自所有来源的加密资讯`);

    if (allNews.length === 0) {
      console.log("没有获取到任何加密快讯，跳过后续处理");
      return;
    }

    // 去重处理 - 通过标题比较
    const uniqueNewsTitles = new Set<string>();
    const uniqueNews: InsertCryptoNews[] = [];

    allNews.forEach(news => {
      if (!uniqueNewsTitles.has(news.title)) {
        uniqueNewsTitles.add(news.title);
        uniqueNews.push(news);
      }
    });

    console.log(`对 ${allNews.length} 条快讯进行去重后，剩余 ${uniqueNews.length} 条唯一快讯`);

    // 清空旧数据 (可选：如果希望保留历史数据，可以移除这一步)
    // 根据实际需求，可以保留一定数量的历史数据，例如只保留最近7天的
    try {
      await db.delete(cryptoNews);
      console.log("已清空现有快讯记录");
    } catch (error) {
      console.error("清空现有快讯记录失败:", error);
    }

    // 存储新闻到数据库
    try {
      console.log(`准备存储 ${uniqueNews.length} 条来自多个来源的加密资讯`);
      
      // 分批插入，每批50条，避免数据库压力过大
      const batchSize = 50;
      for (let i = 0; i < uniqueNews.length; i += batchSize) {
        const batch = uniqueNews.slice(i, i + batchSize);
        await db.insert(cryptoNews).values(batch);
      }
      
      console.log(`成功存储 ${uniqueNews.length} 条加密资讯`);
    } catch (error) {
      console.error("存储加密资讯失败:", error);
    }

    console.log(`[Cron] 成功同步 ${uniqueNews.length} 条加密快讯实时资讯`);
  } catch (error) {
    console.error("[Cron] 同步加密快讯失败:", error);
  }
}

// 获取最新加密新闻
export async function getLatestCryptoNews(limit: number = 30): Promise<any[]> {
  try {
    // 获取最新的加密新闻，按发布时间降序排序
    const news = await db
      .select()
      .from(cryptoNews)
      .limit(limit);

    return news;
  } catch (error) {
    console.error("获取最新加密新闻失败:", error);
    return [];
  }
}

// 按来源获取新闻
export async function getCryptoNewsBySource(source: string, limit: number = 10): Promise<any[]> {
  try {
    const news = await db
      .select()
      .from(cryptoNews)
      .where(eq(cryptoNews.source, source))
      .limit(limit);

    return news;
  } catch (error) {
    console.error(`获取来源为 ${source} 的加密新闻失败:`, error);
    return [];
  }
}

// 按类别获取新闻
export async function getCryptoNewsByCategory(category: string, limit: number = 10): Promise<any[]> {
  try {
    const news = await db
      .select()
      .from(cryptoNews)
      .where(eq(cryptoNews.category, category))
      .limit(limit);

    return news;
  } catch (error) {
    console.error(`获取类别为 ${category} 的加密新闻失败:`, error);
    return [];
  }
}