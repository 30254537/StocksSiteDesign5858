import axios from 'axios';
import { db } from '../db';
import { cryptoTweets, InsertCryptoTweet } from '@shared/schema';
import { desc, eq, sql } from 'drizzle-orm';

// Twitter API v2 接口
const TWITTER_BASE_URL = 'https://api.twitter.com/2';

// 加密货币相关的主题标签
const CRYPTO_HASHTAGS = [
  'crypto',
  'bitcoin', 
  'btc', 
  'ethereum', 
  'eth', 
  'blockchain', 
  'defi', 
  'nft', 
  'web3',
  'stonks',
  'solana'
];

// 加密货币相关的Twitter账号
const CRYPTO_ACCOUNTS = [
  'cz_binance',
  'VitalikButerin',
  'SBF_FTX',
  'elonmusk',
  'CoinDesk',
  'Cointelegraph',
  'cryptonews',
  'Bitcoin',
  'ethereumJoseph',
  'aantonop'
];

/**
 * 获取最新加密货币相关的推文
 * @param limit 获取的推文数量
 */
export async function getLatestCryptoTweets(limit = 30): Promise<any[]> {
  try {
    // 首先尝试从数据库获取
    const storedTweets = await db.select().from(cryptoTweets)
      .orderBy(desc(cryptoTweets.createdAt))
      .limit(limit);
    
    if (storedTweets && storedTweets.length > 0) {
      console.log(`从数据库获取到 ${storedTweets.length} 条加密推文`);
      return storedTweets;
    }
    
    // 如果没有数据库数据，则尝试调用API获取数据
    return await fetchTwitterData();
  } catch (error) {
    console.error('获取加密推文失败:', error);
    return [];
  }
}

/**
 * 根据特定话题获取加密推文
 */
export async function getCryptoTweetsByTopic(topic: string, limit = 20): Promise<any[]> {
  try {
    // 从数据库中查询特定话题的推文
    const tweets = await db.select().from(cryptoTweets)
      .where(
        // 使用简单的文本匹配
        sql`${cryptoTweets.text} LIKE ${`%${topic}%`}`
      )
      .orderBy(desc(cryptoTweets.createdAt))
      .limit(limit);
    
    return tweets;
  } catch (error) {
    console.error(`获取话题为 ${topic} 的加密推文失败:`, error);
    return [];
  }
}

/**
 * 从Twitter API获取数据
 * 注意：需要Twitter API密钥
 */
async function fetchTwitterData(): Promise<any[]> {
  // 检查是否有Twitter令牌
  if (!process.env.X_BEARER_TOKEN) {
    console.warn('没有配置Twitter API令牌，无法获取推文');
    return [];
  }
  
  try {
    // 创建包含认证头的请求配置
    const config = {
      headers: {
        'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    // 构建搜索查询
    const query = CRYPTO_HASHTAGS.map(tag => `#${tag}`).join(' OR ');
    
    // 调用Twitter API搜索端点
    const response = await axios.get(
      `${TWITTER_BASE_URL}/tweets/search/recent?query=${encodeURIComponent(query)}&expansions=author_id&tweet.fields=created_at,public_metrics&user.fields=name,username,profile_image_url,verified`,
      config
    );
    
    if (!response.data || !response.data.data) {
      console.warn('Twitter API没有返回有效数据');
      return [];
    }
    
    // 处理用户数据以便于查找
    const users = response.data.includes?.users?.reduce((acc: any, user: any) => {
      acc[user.id] = user;
      return acc;
    }, {}) || {};
    
    // 转换推文数据结构
    const tweets = response.data.data.map((tweet: any) => {
      const user = users[tweet.author_id] || {};
      
      return {
        tweetId: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id,
        authorName: user.name || 'Unknown',
        authorUsername: user.username || 'unknown',
        authorProfileImage: user.profile_image_url || '',
        authorVerified: user.verified || false,
        createdAt: new Date(tweet.created_at),
        likeCount: tweet.public_metrics?.like_count || 0,
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        replyCount: tweet.public_metrics?.reply_count || 0,
        quoteCount: tweet.public_metrics?.quote_count || 0,
        url: `https://twitter.com/${user.username}/status/${tweet.id}`
      };
    });
    
    // 存储到数据库以备后续使用
    await storeTweetsToDatabase(tweets);
    
    return tweets;
  } catch (error) {
    console.error('从Twitter API获取数据失败:', error);
    return [];
  }
}

/**
 * 将推文存储到数据库
 */
async function storeTweetsToDatabase(tweets: any[]): Promise<void> {
  if (!tweets || tweets.length === 0) {
    console.log('没有推文需要存储');
    return;
  }
  
  try {
    // 构建插入对象数组
    const tweetsToInsert: InsertCryptoTweet[] = tweets.map(tweet => ({
      tweetId: tweet.tweetId,
      text: tweet.text,
      authorId: tweet.authorId,
      authorName: tweet.authorName,
      authorUsername: tweet.authorUsername,
      authorProfileImage: tweet.authorProfileImage,
      authorVerified: tweet.authorVerified ? 1 : 0,
      createdAt: new Date(tweet.createdAt),
      likeCount: tweet.likeCount,
      retweetCount: tweet.retweetCount,
      replyCount: tweet.replyCount,
      quoteCount: tweet.quoteCount,
      url: tweet.url
    }));
    
    // 批量插入
    const result = await db.insert(cryptoTweets).values(tweetsToInsert).onConflictDoNothing();
    
    console.log(`成功存储 ${result.rowCount} 条推文到数据库`);
  } catch (error) {
    console.error('存储推文到数据库失败:', error);
  }
}

/**
 * 同步并更新加密推文
 */
export async function syncCryptoTweets(): Promise<void> {
  try {
    console.log('[Cron] 开始同步加密推文...');
    await fetchTwitterData();
    console.log('[Cron] 成功同步加密推文');
  } catch (error) {
    console.error('同步加密推文失败:', error);
  }
}

/**
 * 用于模拟生成Twitter数据的辅助函数
 * 仅在无法获取真实数据时使用
 */
export function generateDummyCryptoTweets(count = 10): any[] {
  return [];
}