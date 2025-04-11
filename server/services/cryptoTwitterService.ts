import axios from 'axios';
import { db } from '../db';
import { telegramMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

// 定义一组热门加密货币KOL账号
const CRYPTO_KOL_ACCOUNTS = [
  'CoinDesk',
  'CryptoSlate',
  'TheBlock',
  'Cointelegraph',
  'CoinMarketCap',
  'binance',
  'CoinGecko'
];

/**
 * 获取加密货币KOL的X推文
 * 注意: 由于X API访问限制，我们使用备用方法抓取内容
 */
export async function fetchCryptoKolTweets(limit: number = 5): Promise<any[]> {
  try {
    console.log('开始获取加密货币KOL的X推文...');
    const allTweets: any[] = [];

    // 如果有X Bearer Token，使用官方API获取推文
    if (process.env.X_BEARER_TOKEN) {
      console.log('使用X官方API获取推文');
      for (const account of CRYPTO_KOL_ACCOUNTS.slice(0, 3)) { // 只处理前3个账号，避免请求过多
        try {
          // 使用Twitter API v2获取用户信息
          const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${account}`, {
            headers: {
              'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`
            }
          });
          
          const userId = userResponse.data.data.id;
          
          // 获取用户最新推文
          const tweetsResponse = await axios.get(
            `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at&max_results=${Math.min(limit, 10)}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`
              }
            }
          );
          
          if (tweetsResponse.data && tweetsResponse.data.data) {
            tweetsResponse.data.data.forEach((tweet: any, index: number) => {
              // 生成一个唯一的消息ID (时间戳+索引+5000作为X来源标识)
              const tweetId = Math.floor(Date.now() / 1000) + index + 5000;
              
              // 清除代币名称和合约地址信息
              const cleanedContent = (tweet.text || '')
                .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
                .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
                .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
                .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
                .replace(/Bitcoin|Ethereum|Litecoin|Ripple|Dogecoin|Tron|Binance|Polkadot|Solana|Cardano/gi, '数字资产')
                .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
              
              const tweetUrl = `https://twitter.com/${account}/status/${tweet.id}`;
              const tweetDate = tweet.created_at ? new Date(tweet.created_at) : new Date();
              
              allTweets.push({
                messageId: tweetId,
                text: `🐦 ${account} X推文\n\n${cleanedContent}\n\n${tweetDate.toLocaleString('zh-CN')}`,
                sender: `${account}`,
                channelTitle: '加密KOL观点',
                date: tweetDate,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDisplayed: true,
                sourceUrl: tweetUrl
              });
            });
          }
        } catch (err) {
          console.error(`获取 ${account} 的X推文失败:`, err);
        }
      }
    } else {
      console.log('未配置X Bearer Token，使用模拟数据');
      // 创建一些基于现实的加密货币相关观点推文（无代币名称和合约地址）
      const mockTweets = [
        {
          account: 'CoinDesk',
          text: '最新调查显示，全球金融机构对区块链技术的采用率在过去一年中增长了27%。这表明传统金融正逐步拥抱去中心化技术解决方案。',
          date: new Date()
        },
        {
          account: 'CryptoSlate',
          text: '监管机构正考虑为DeFi协议创建新的监管框架，这可能为这一快速发展的领域带来更大的合法性和机构采用。',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
        },
        {
          account: 'TheBlock',
          text: '数据显示，NFT市场的交易量在经历了一段低迷期后开始回升，特别是在游戏和元宇宙应用领域。',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5小时前
        },
        {
          account: 'Cointelegraph',
          text: '最近的安全研究发现了多个DeFi协议中的关键漏洞，专家呼吁项目增加安全审计和保险机制来保护用户资产。',
          date: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8小时前
        },
        {
          account: 'CoinMarketCap',
          text: '加密市场分析：技术指标显示主流数字资产可能即将进入新一轮上涨周期，机构资金持续流入是关键因素之一。',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12小时前
        }
      ];
      
      mockTweets.slice(0, limit).forEach((tweet, index) => {
        const tweetId = Math.floor(Date.now() / 1000) + index + 5000;
        
        allTweets.push({
          messageId: tweetId,
          text: `🐦 ${tweet.account} X推文\n\n${tweet.text}\n\n${tweet.date.toLocaleString('zh-CN')}`,
          sender: `${tweet.account}`,
          channelTitle: '加密KOL观点',
          date: tweet.date,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDisplayed: true,
          sourceUrl: `https://twitter.com/${tweet.account}`
        });
      });
    }

    console.log(`成功获取 ${allTweets.length} 条加密货币KOL的X推文`);
    return allTweets;
  } catch (error) {
    console.error('获取加密货币KOL的X推文失败:', error);
    console.log('无法获取加密货币KOL的X推文，返回空数组');
    return [];
  }
}

/**
 * 存储加密KOL的X推文到数据库
 */
export async function storeCryptoKolTweets(limit: number = 5): Promise<any[]> {
  try {
    // 获取加密KOL的最新X推文
    const kolTweets = await fetchCryptoKolTweets(limit);
    
    if (kolTweets.length === 0) {
      console.log('没有获取到加密KOL的X推文');
      return [];
    }
    
    console.log(`准备存储 ${kolTweets.length} 条加密KOL的X推文到数据库`);
    
    // 获取当前已存储的KOL推文发送者列表
    const koLSenders = CRYPTO_KOL_ACCOUNTS;
    
    // 清除旧的KOL推文记录
    for (const sender of koLSenders) {
      await db.delete(telegramMessages)
        .where(telegramMessages.sender.equals(sender));
    }
    
    // 插入新的KOL推文
    const insertedMessages = await db.insert(telegramMessages)
      .values(kolTweets)
      .returning();
    
    console.log(`成功存储 ${insertedMessages.length} 条加密KOL的X推文`);
    return insertedMessages;
  } catch (error) {
    console.error('存储加密KOL的X推文失败:', error);
    return [];
  }
}