import axios from 'axios';
import { CryptoNews, InsertCryptoNews } from '@shared/schema';
import { storage } from '../storage';
import * as cron from 'node-cron';
import { scrapeAllNews } from './cryptoNewsScraperService';

// 主要加密货币新闻API来源
const NEWS_SOURCES = {
  COINGECKO: {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/news',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
  CRYPTONEWS: {
    name: 'CryptoNews',
    url: 'https://cryptonews-api.com/api/v1/category',
    apiKey: process.env.CRYPTONEWS_API_KEY || '',
  },
  SCRAPED_SOURCES: {
    name: 'ScrapedSources',
    enabled: true
  }
};

/**
 * 从CoinGecko获取最新的加密货币新闻
 */
export async function fetchCoinGeckoNews(): Promise<InsertCryptoNews[]> {
  try {
    // CoinGecko需要页码参数
    const response = await axios.get(`${NEWS_SOURCES.COINGECKO.url}?page=1`, {
      headers: NEWS_SOURCES.COINGECKO.apiKey ? {
        'x-cg-api-key': NEWS_SOURCES.COINGECKO.apiKey
      } : {}
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => {
        // 确保日期格式正确
        let publishedAt = new Date();
        try {
          if (item.published_at) {
            publishedAt = new Date(item.published_at);
            // 验证日期是否有效
            if (isNaN(publishedAt.getTime())) {
              publishedAt = new Date(); // 使用当前日期作为后备
            }
          }
        } catch (e) {
          console.warn('无效的日期格式，使用当前日期:', e);
        }
        
        return {
          title: item.title,
          content: item.description || '未提供详细内容',
          source: NEWS_SOURCES.COINGECKO.name,
          sourceUrl: item.url,
          imageUrl: item.thumb_2x || item.thumb || '',
          category: item.categories?.join(',') || 'general',
          isHighlighted: item.is_hot ? 1 : 0,
          publishedAt
        };
      });
    }
    return [];
  } catch (error) {
    console.error('获取CoinGecko新闻失败:', error);
    return [];
  }
}

/**
 * CryptoPanic已被移除
 * 此函数只是一个存根，保持API兼容性，永远返回空数组
 */
export async function fetchCryptoPanicNews(): Promise<InsertCryptoNews[]> {
  return [];
}

/**
 * 从CryptoNews获取最新的加密货币新闻
 */
export async function fetchCryptoNewsApi(): Promise<InsertCryptoNews[]> {
  if (!NEWS_SOURCES.CRYPTONEWS.apiKey) {
    console.warn('未找到CryptoNews API密钥，跳过此来源');
    return [];
  }

  try {
    const response = await axios.get(`${NEWS_SOURCES.CRYPTONEWS.url}?section=general&apiKey=${NEWS_SOURCES.CRYPTONEWS.apiKey}`);

    // 检查API错误响应
    if (response.data && response.data.title === 'Crypto News API' && response.data.text && response.data.text.includes('API Token inactive')) {
      console.warn('CryptoNews API Token无效，请检查API密钥是否正确');
      return [];
    }

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => {
        // 确保日期格式正确
        let publishedAt = new Date();
        try {
          if (item.date) {
            publishedAt = new Date(item.date);
            // 验证日期是否有效
            if (isNaN(publishedAt.getTime())) {
              publishedAt = new Date(); // 使用当前日期作为后备
            }
          }
        } catch (e) {
          console.warn('无效的日期格式，使用当前日期:', e);
        }
        
        return {
          title: item.title,
          content: item.text || item.description || '未提供详细内容',
          source: NEWS_SOURCES.CRYPTONEWS.name,
          sourceUrl: item.news_url,
          imageUrl: item.image_url || '',
          category: item.categories || 'general',
          isHighlighted: 0,
          publishedAt
        };
      });
    }
    return [];
  } catch (error) {
    console.error('获取CryptoNews新闻失败:', error);
    return [];
  }
}

/**
 * 从多个来源获取最新加密货币新闻并存储到数据库
 */
export async function fetchAndStoreNews(): Promise<number> {
  console.log('开始获取加密货币新闻...');
  
  try {
    // 并行获取所有来源的新闻
    const [coinGeckoNews, cryptoNewsApiNews, scrapedNews] = await Promise.all([
      fetchCoinGeckoNews(),
      fetchCryptoNewsApi(),
      scrapeAllNews() // 从各大网站抓取新闻
    ]);

    console.log(`抓取结果: CoinGecko: ${coinGeckoNews.length}, CryptoNews API: ${cryptoNewsApiNews.length}, 网站抓取: ${scrapedNews.length}`);

    // 合并所有来源的新闻
    const allNews = [...coinGeckoNews, ...cryptoNewsApiNews, ...scrapedNews];
    
    if (allNews.length === 0) {
      console.log('没有找到新的加密货币新闻');
      return 0;
    }

    // 防止重复添加，通过标题和来源检查
    let addedCount = 0;
    for (const news of allNews) {
      // 检查30天内是否有相同标题和来源的新闻
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const existingNews = await storage.getCryptoNews(1000, 0); // 获取所有新闻来检查
      const isDuplicate = existingNews.some(item => 
        item.title === news.title && 
        item.source === news.source &&
        new Date(item.publishedAt) >= thirtyDaysAgo
      );

      if (!isDuplicate) {
        await storage.createCryptoNews(news);
        addedCount++;
      }
    }

    console.log(`成功添加 ${addedCount} 条新的加密货币新闻`);
    return addedCount;
  } catch (error) {
    console.error('获取和存储加密货币新闻时出错:', error);
    return 0;
  }
}

/**
 * 初始化定时任务，定期获取最新加密货币新闻
 * @param cronSchedule cron表达式，默认每5分钟执行一次
 */
export function initCryptoNewsScheduler(cronSchedule: string = '*/5 * * * *'): void {
  console.log(`初始化加密货币新闻定时任务，计划: ${cronSchedule}`);
  
  // 启动时立即执行一次
  fetchAndStoreNews().then(count => {
    console.log(`初始化: 成功同步 ${count} 条加密快讯实时资讯`);
  }).catch(err => {
    console.error('初始获取加密货币新闻失败:', err);
  });
  
  // 设置定时任务
  cron.schedule(cronSchedule, async () => {
    console.log('执行定时加密货币新闻获取...');
    const count = await fetchAndStoreNews();
    console.log(`[Cron] 成功同步 ${count} 条加密快讯实时资讯`);
  });
  
  // 每天一次全量更新（清除旧数据，获取全新数据）
  cron.schedule('0 4 * * *', async () => {
    console.log('执行每日全量加密货币新闻更新...');
    
    try {
      // 清空所有已有数据（除Telegram消息外）
      const oldNewsCount = await storage.clearAllCryptoNews();
      console.log(`已清除 ${oldNewsCount} 条旧的加密货币新闻`);
      
      // 获取全新数据
      const newCount = await fetchAndStoreNews(50);
      console.log(`[每日更新] 成功添加 ${newCount} 条新的加密货币新闻`);
    } catch (err) {
      console.error('每日全量更新加密货币新闻失败:', err);
    }
  });
}