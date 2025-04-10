import axios from 'axios';
import { CryptoNews, InsertCryptoNews } from '@shared/schema';
import { storage } from '../storage';
import * as cron from 'node-cron';

// 主要加密货币新闻API来源
const NEWS_SOURCES = {
  COINGECKO: {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/news',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
  CRYPTOPANIC: {
    name: 'CryptoPanic',
    url: 'https://cryptopanic.com/api/v1/posts/',
    apiKey: process.env.CRYPTOPANIC_API_KEY || '',
  },
  CRYPTONEWS: {
    name: 'CryptoNews',
    url: 'https://cryptonews-api.com/api/v1/category',
    apiKey: process.env.CRYPTONEWS_API_KEY || '',
  }
};

/**
 * 从CoinGecko获取最新的加密货币新闻
 */
export async function fetchCoinGeckoNews(): Promise<InsertCryptoNews[]> {
  try {
    const response = await axios.get(`${NEWS_SOURCES.COINGECKO.url}`, {
      headers: NEWS_SOURCES.COINGECKO.apiKey ? {
        'x-cg-api-key': NEWS_SOURCES.COINGECKO.apiKey
      } : {}
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        title: item.title,
        content: item.description || '未提供详细内容',
        source: NEWS_SOURCES.COINGECKO.name,
        sourceUrl: item.url,
        imageUrl: item.thumb_2x || item.thumb || '',
        category: item.categories?.join(',') || 'general',
        isHighlighted: item.is_hot ? 1 : 0,
        publishedAt: new Date(item.published_at)
      }));
    }
    return [];
  } catch (error) {
    console.error('获取CoinGecko新闻失败:', error);
    return [];
  }
}

/**
 * 从CryptoPanic获取最新的加密货币新闻
 */
export async function fetchCryptoPanicNews(): Promise<InsertCryptoNews[]> {
  if (!NEWS_SOURCES.CRYPTOPANIC.apiKey) {
    console.warn('未找到CryptoPanic API密钥，跳过此来源');
    return [];
  }

  try {
    const response = await axios.get(`${NEWS_SOURCES.CRYPTOPANIC.url}?auth_token=${NEWS_SOURCES.CRYPTOPANIC.apiKey}&public=true`);

    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results.map((item: any) => ({
        title: item.title,
        content: item.metadata?.description || '未提供详细内容',
        source: NEWS_SOURCES.CRYPTOPANIC.name,
        sourceUrl: item.url,
        imageUrl: item.metadata?.image || '',
        category: item.currencies?.map((c: any) => c.code).join(',') || 'general',
        isHighlighted: item.votes.positive > 5 ? 1 : 0,
        publishedAt: new Date(item.published_at)
      }));
    }
    return [];
  } catch (error) {
    console.error('获取CryptoPanic新闻失败:', error);
    return [];
  }
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

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        title: item.title,
        content: item.text || item.description || '未提供详细内容',
        source: NEWS_SOURCES.CRYPTONEWS.name,
        sourceUrl: item.news_url,
        imageUrl: item.image_url || '',
        category: item.categories || 'general',
        isHighlighted: 0,
        publishedAt: new Date(item.date)
      }));
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
    const [coinGeckoNews, cryptoPanicNews, cryptoNewsApiNews] = await Promise.all([
      fetchCoinGeckoNews(),
      fetchCryptoPanicNews(),
      fetchCryptoNewsApi()
    ]);

    // 合并所有来源的新闻
    const allNews = [...coinGeckoNews, ...cryptoPanicNews, ...cryptoNewsApiNews];
    
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
 * @param cronSchedule cron表达式，默认每小时执行一次
 */
export function initCryptoNewsScheduler(cronSchedule: string = '0 * * * *'): void {
  console.log(`初始化加密货币新闻定时任务，计划: ${cronSchedule}`);
  
  // 启动时立即执行一次
  fetchAndStoreNews().catch(err => {
    console.error('初始获取加密货币新闻失败:', err);
  });
  
  // 设置定时任务
  cron.schedule(cronSchedule, async () => {
    console.log('执行定时加密货币新闻获取...');
    await fetchAndStoreNews();
  });
}