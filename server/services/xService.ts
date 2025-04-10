import axios from 'axios';
import { storage } from '../storage';
import { InsertCryptoTweet } from '@shared/schema';

/**
 * X用户接口
 */
interface XTweetUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

/**
 * X推文接口
 */
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

/**
 * X API响应结构
 */
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

/**
 * 获取热门加密货币推文
 */
export async function fetchCryptoTweets() {
  try {
    // 验证token是否设置
    if (!process.env.X_BEARER_TOKEN) {
      throw new Error('X_BEARER_TOKEN环境变量未设置');
    }

    // 设置API参数
    const baseUrl = 'https://api.twitter.com/2/tweets/search/recent';
    const params = new URLSearchParams({
      // 加密货币相关关键词查询
      'query': '(crypto OR bitcoin OR ethereum OR blockchain OR defi OR web3 OR #crypto OR #bitcoin OR #ethereum OR #blockchain OR #defi OR #web3 OR stonks) -is:retweet -is:reply lang:en',
      'max_results': '30', // 最多返回30条推文
      'tweet.fields': 'public_metrics,created_at',
      'user.fields': 'name,username,profile_image_url',
      'expansions': 'author_id',
    });
    
    // 发送请求到X API
    const response = await axios.get(`${baseUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error('X API响应无效');
    }

    return response.data as XApiResponse;
  } catch (error) {
    console.error('获取X推文失败:', error);
    throw error;
  }
}

/**
 * 同步热门推文到数据库
 */
export async function syncCryptoTweets(): Promise<number> {
  try {
    // 从X获取推文
    const tweetsResponse = await fetchCryptoTweets();
    
    if (!tweetsResponse.data || !tweetsResponse.includes?.users) {
      console.log('没有找到推文或用户信息');
      return 0;
    }
    
    // 用户映射
    const usersMap = new Map<string, XTweetUser>();
    tweetsResponse.includes.users.forEach(user => {
      usersMap.set(user.id, user);
    });
    
    // 创建的新推文计数
    let newTweetsCount = 0;
    
    // 处理每条推文
    for (const tweet of tweetsResponse.data) {
      try {
        // 检查推文是否已存在
        const existingTweet = await storage.getCryptoTweetByTweetId(tweet.id);
        if (existingTweet) {
          // 如果存在, 更新指标
          await storage.updateCryptoTweet(existingTweet.id, {
            likeCount: tweet.public_metrics?.like_count || 0,
            retweetCount: tweet.public_metrics?.retweet_count || 0,
            replyCount: tweet.public_metrics?.reply_count || 0,
            quoteCount: tweet.public_metrics?.quote_count || 0
          });
          continue;
        }
        
        // 获取作者信息
        const author = usersMap.get(tweet.author_id);
        if (!author) {
          console.log(`找不到作者信息，作者ID: ${tweet.author_id}`);
          continue;
        }
        
        // 创建新的推文记录
        const newTweet: InsertCryptoTweet = {
          tweetId: tweet.id,
          text: tweet.text,
          authorName: author.name,
          authorUsername: author.username,
          authorProfileImage: author.profile_image_url || null,
          likeCount: tweet.public_metrics?.like_count || 0,
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          quoteCount: tweet.public_metrics?.quote_count || 0,
          url: `https://twitter.com/${author.username}/status/${tweet.id}`,
          // createdAt会由defaultNow()自动设置
          source: 'x',
          category: 'crypto',
          language: 'en',
          translatedText: null
        };
        
        // 保存推文到数据库
        await storage.createCryptoTweet(newTweet);
        newTweetsCount++;
      } catch (e) {
        console.error(`处理推文 ${tweet.id} 时出错:`, e);
      }
    }
    
    console.log(`同步完成, 添加了 ${newTweetsCount} 条新推文`);
    return newTweetsCount;
  } catch (error) {
    console.error('同步X推文失败:', error);
    return 0;
  }
}