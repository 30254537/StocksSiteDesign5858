import axios from 'axios';
import { db } from '../db';
import { cryptoTweets } from '@shared/schema';
import { eq } from 'drizzle-orm';

// X API认证头
const headers = {
  Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`
};

// X API 基础URL
const API_BASE_URL = 'https://api.twitter.com/2';

interface XTweetUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  author_id: string;
}

interface XApiResponse {
  data: XTweet[];
  includes: {
    users: XTweetUser[];
  };
  meta: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}

const CRYPTO_KEYWORDS = [
  'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'blockchain', 
  'btc', 'eth', 'defi', 'nft', 'altcoin', 'web3', 'stonks', '$btc', '$eth'
];

/**
 * 获取热门加密货币推文
 */
export async function fetchCryptoTweets() {
  try {
    // 构建查询字符串，搜索多个加密货币关键词
    const query = CRYPTO_KEYWORDS.map(kw => `${kw} lang:en`).join(' OR ');
    
    // API参数
    const params = {
      query,
      'tweet.fields': 'created_at,public_metrics',
      'user.fields': 'profile_image_url,username,name',
      expansions: 'author_id',
      max_results: 20, // 获取20条推文
    };
    
    // 调用X API获取搜索结果
    const response = await axios.get<XApiResponse>(`${API_BASE_URL}/tweets/search/recent`, {
      headers,
      params
    });
    
    if (!response.data || !response.data.data || !response.data.includes) {
      console.error('X API返回的数据格式不符合预期');
      return [];
    }
    
    // 处理获取到的推文数据
    const tweets = response.data.data;
    const users = response.data.includes.users;
    
    // 将推文和用户数据结合，创建完整的推文对象
    const processedTweets = tweets.map(tweet => {
      const author = users.find(user => user.id === tweet.author_id);
      
      return {
        tweetId: tweet.id,
        text: tweet.text,
        createdAt: new Date(tweet.created_at),
        authorName: author?.name || '',
        authorUsername: author?.username || '',
        authorProfileImage: author?.profile_image_url || '',
        likeCount: tweet.public_metrics?.like_count || 0,
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        replyCount: tweet.public_metrics?.reply_count || 0,
        quoteCount: tweet.public_metrics?.quote_count || 0,
        url: `https://twitter.com/${author?.username}/status/${tweet.id}`
      };
    });
    
    return processedTweets;
  } catch (error) {
    console.error('从X获取加密货币推文时出错:', error);
    return [];
  }
}

/**
 * 同步热门推文到数据库
 */
export async function syncCryptoTweets() {
  try {
    console.log('开始同步X上的加密货币热门推文...');
    const tweets = await fetchCryptoTweets();
    
    if (!tweets || tweets.length === 0) {
      console.log('没有找到新的加密货币推文');
      return 0;
    }
    
    // 获取已有推文ID，避免重复添加
    const existingTweets = await db.select({ tweetId: cryptoTweets.tweetId }).from(cryptoTweets);
    const existingTweetIds = new Set(existingTweets.map(t => t.tweetId));
    
    // 过滤出新的推文
    const newTweets = tweets.filter(tweet => !existingTweetIds.has(tweet.tweetId));
    
    if (newTweets.length === 0) {
      console.log('没有新的加密货币推文需要添加');
      return 0;
    }
    
    // 按照点赞数和转发数排序，只保留前10条热门推文
    newTweets.sort((a, b) => {
      const scoreA = a.likeCount * 2 + a.retweetCount * 3;
      const scoreB = b.likeCount * 2 + b.retweetCount * 3;
      return scoreB - scoreA;
    });
    
    const tweetsToInsert = newTweets.slice(0, 10);
    
    // 清理旧的推文，保持数据库中最多只有30条记录
    const allTweetCount = await db.select({ count: cryptoTweets.id }).from(cryptoTweets);
    const currentCount = allTweetCount.length;
    
    if (currentCount + tweetsToInsert.length > 30) {
      // 按照ID排序，删除最旧的记录
      const tweetsToDelete = await db
        .select()
        .from(cryptoTweets)
        .orderBy(cryptoTweets.id)
        .limit(tweetsToInsert.length);
      
      for (const tweet of tweetsToDelete) {
        await db.delete(cryptoTweets).where(eq(cryptoTweets.id, tweet.id));
      }
    }
    
    // 插入新的推文
    for (const tweet of tweetsToInsert) {
      await db.insert(cryptoTweets).values({
        tweetId: tweet.tweetId,
        text: tweet.text,
        authorName: tweet.authorName,
        authorUsername: tweet.authorUsername,
        authorProfileImage: tweet.authorProfileImage,
        likeCount: tweet.likeCount,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        quoteCount: tweet.quoteCount,
        url: tweet.url,
        createdAt: tweet.createdAt,
        source: 'x',
        category: 'crypto',
        language: 'en'
      });
    }
    
    console.log(`成功添加了 ${tweetsToInsert.length} 条新的加密货币推文`);
    return tweetsToInsert.length;
  } catch (error) {
    console.error('同步X上的加密货币推文时出错:', error);
    return 0;
  }
}