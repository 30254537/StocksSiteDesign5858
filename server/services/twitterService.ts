import axios from 'axios';
import { db } from '../db';
import { tweets, type Tweet } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

// MoontokListing Twitter 用户ID
const MOONTOK_LISTING_USER_ID = '1702274513189580801'; // @MoontokListing

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

interface TwitterMedia {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

interface TwitterData {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterResponse {
  data: TwitterData[];
  includes?: {
    users?: TwitterUser[];
    media?: TwitterMedia[];
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}

// 创建带有授权头的 axios 实例
const twitterApi = axios.create({
  baseURL: 'https://api.twitter.com/2',
  headers: {
    Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
  },
});

// Debug: 检查令牌
console.log('Using Twitter API with token (first few chars):', 
  process.env.X_BEARER_TOKEN ? `${process.env.X_BEARER_TOKEN.substring(0, 5)}...` : 'Not set');

/**
 * 获取指定用户的最新推文
 */
export async function getUserTweets(userId: string = MOONTOK_LISTING_USER_ID, count: number = 10): Promise<TwitterResponse> {
  try {
    const response = await twitterApi.get(`/users/${userId}/tweets`, {
      params: {
        max_results: count,
        'tweet.fields': 'created_at,attachments',
        'user.fields': 'profile_image_url',
        'media.fields': 'url,preview_image_url',
        expansions: 'author_id,attachments.media_keys',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('获取推文失败:', error);
    throw new Error('获取推文失败');
  }
}

/**
 * 搜索推文
 */
export async function searchTweets(query: string, count: number = 10): Promise<TwitterResponse> {
  try {
    const response = await twitterApi.get('/tweets/search/recent', {
      params: {
        query,
        max_results: count,
        'tweet.fields': 'created_at,attachments',
        'user.fields': 'profile_image_url',
        'media.fields': 'url,preview_image_url',
        expansions: 'author_id,attachments.media_keys',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('搜索推文失败:', error);
    throw new Error('搜索推文失败');
  }
}

/**
 * 解析Twitter响应并转换为我们自己的推文格式
 */
function parseTwitterResponse(response: TwitterResponse): Omit<Tweet, 'id'>[] {
  const { data: tweets, includes } = response;
  
  if (!tweets || tweets.length === 0) {
    return [];
  }
  
  const userMap = new Map<string, TwitterUser>();
  const mediaMap = new Map<string, TwitterMedia>();
  
  // 创建用户映射
  if (includes?.users) {
    includes.users.forEach(user => {
      userMap.set(user.id, user);
    });
  }
  
  // 创建媒体映射
  if (includes?.media) {
    includes.media.forEach(media => {
      mediaMap.set(media.media_key, media);
    });
  }
  
  // 将Twitter数据转换为我们的模型格式
  return tweets.map(tweet => {
    const user = userMap.get(tweet.author_id);
    
    // 查找媒体
    let mediaUrl = null;
    if (tweet.attachments?.media_keys && tweet.attachments.media_keys.length > 0) {
      const mediaKey = tweet.attachments.media_keys[0];
      const media = mediaMap.get(mediaKey);
      if (media) {
        mediaUrl = media.url || media.preview_image_url || null;
      }
    }
    
    return {
      tweetId: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id,
      authorName: user?.name || 'Unknown',
      authorUsername: user?.username || 'unknown',
      profileImageUrl: user?.profile_image_url || null,
      mediaUrl,
      createdAt: new Date(tweet.created_at),
      isDisplayed: true,
    };
  });
}

/**
 * 获取并保存最新推文到数据库
 */
export async function fetchAndStoreTweets(count: number = 10): Promise<Tweet[]> {
  try {
    console.log(`开始获取 MoontokListing 的最新 ${count} 条推文...`);
    
    // 获取推文数据
    const response = await getUserTweets(MOONTOK_LISTING_USER_ID, count);
    
    // 解析为我们的模型格式
    const parsedTweets = parseTwitterResponse(response);
    
    if (parsedTweets.length === 0) {
      console.log('没有找到推文数据');
      return [];
    }
    
    console.log(`成功获取 ${parsedTweets.length} 条推文，准备存储到数据库`);
    
    // 清空旧推文 (可选，取决于您是否要保留历史记录)
    // await db.delete(tweets);
    
    // 获取所有现有的推文ID
    const existingTweets = await db.select({ tweetId: tweets.tweetId }).from(tweets);
    const existingTweetIds = new Set(existingTweets.map(t => t.tweetId));
    
    // 只插入新的推文
    const newTweets = parsedTweets.filter(tweet => !existingTweetIds.has(tweet.tweetId));
    
    if (newTweets.length === 0) {
      console.log('没有新的推文需要存储');
      return [];
    }
    
    console.log(`准备存储 ${newTweets.length} 条新推文`);
    
    // 插入新数据
    const insertedTweets = await db.insert(tweets)
      .values(newTweets)
      .returning();
    
    console.log(`成功存储 ${insertedTweets.length} 条推文`);
    
    return insertedTweets;
  } catch (error) {
    console.error('获取并存储推文失败:', error);
    return [];
  }
}

/**
 * 获取最新的推文
 */
export async function getLatestTweets(limit: number = 10): Promise<Tweet[]> {
  try {
    const latestTweets = await db.select()
      .from(tweets)
      .where(eq(tweets.isDisplayed, true))
      .orderBy(desc(tweets.createdAt))
      .limit(limit);
    
    return latestTweets;
  } catch (error) {
    console.error('获取最新推文失败:', error);
    return [];
  }
}