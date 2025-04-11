import { db } from '../db';
import { telegramMessages, InsertTelegramMessage } from '@shared/schema';
import * as financeNewsService from './financeNewsService';
import * as blockBeatsService from './blockBeatsService';
import * as cryptoTwitterService from './cryptoTwitterService';

/**
 * 加密快讯服务类 - 负责获取、处理和存储加密货币相关资讯
 * 从金色财经和火星财经获取最新资讯，并以加密快讯的形式呈现
 */
class TelegramService {
  /**
   * 创建基本的加密快讯消息（作为备用数据）- 移除了代币名称和合约地址信息
   */
  private createBasicMockMessages(): InsertTelegramMessage[] {
    const currentDate = new Date();
    return [
      {
        messageId: 100001,
        text: `🔔 加密快讯 × 金色财经\n\n🗣️ 市场分析师认为，近期数字资产市场整体上涨趋势可能持续到2025年第二季度，预计将迎来新一轮市场行情。市场代表性数字资产已创下历史新高。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 金色财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        sourceUrl: 'https://www.jinse.cn/',
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100002,
        text: `🔔 加密快讯 × 火星财经\n\n🗣️ 最新区块链技术2.0质押量已突破3000万个单位，占总流通量的25%。这显示了市场对该技术长期发展的信心，同时也减少了市场上的流通供应。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 火星财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        sourceUrl: 'https://news.marsbit.co/',
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100003,
        text: `🔔 加密快讯 × 金色财经\n\n🗣️ STONKS DEX宣布将推出去中心化合成资产交易功能，成为DeFi领域首个提供此类服务的平台。该功能将允许用户交易与传统金融资产挂钩的合成代币。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 金色财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        sourceUrl: 'https://www.jinse.cn/',
        date: currentDate,
        isDisplayed: true
      }
    ];
  }

  /**
   * 从财经资讯服务获取实时快讯
   */
  private async getFinanceNews(): Promise<InsertTelegramMessage[]> {
    try {
      // 获取金色财经和火星财经的最新快讯
      const jinseNews = await financeNewsService.scrapeJinseNews(10);
      const marsbitNews = await financeNewsService.scrapeMarsbitNews(5);
      
      // 合并所有快讯
      const allNews = [...jinseNews, ...marsbitNews];
      
      if (!allNews || allNews.length === 0) {
        console.log('没有找到财经快讯数据，使用基本模拟数据');
        return this.createBasicMockMessages();
      }
      
      console.log(`成功获取 ${allNews.length} 条金色财经与火星财经的实时资讯`);
      
      // 将所有快讯格式化为加密快讯格式
      return allNews.map((news, index) => {
        const isJinse = news.sender.includes('金色财经');
        return {
          messageId: 200000 + index,
          text: news.text,
          sender: isJinse ? '加密快讯 × 金色财经' : '加密快讯 × 火星财经',
          channelTitle: '加密资讯频道',
          mediaUrl: news.mediaUrl,
          sourceUrl: news.sourceUrl || (isJinse ? 'https://www.jinse.cn/' : 'https://news.marsbit.co/'),
          date: news.date || new Date(),
          isDisplayed: true
        };
      });
    } catch (error) {
      console.error('获取财经实时资讯失败:', error);
      return this.createBasicMockMessages();
    }
  }
  
  /**
   * 获取并整合所有来源的加密资讯
   */
  private async getAllCryptoNews(): Promise<InsertTelegramMessage[]> {
    try {
      const allNews: InsertTelegramMessage[] = [];
      
      // 1. 获取金色财经和火星财经资讯
      const financeNews = await this.getFinanceNews();
      if (financeNews && financeNews.length > 0) {
        console.log(`成功获取 ${financeNews.length} 条金色财经和火星财经资讯`);
        allNews.push(...financeNews);
      }
      
      // 2. 获取律动BlockBeats资讯
      try {
        const blockBeatsNews = await blockBeatsService.fetchBlockBeatsNews(8);
        if (blockBeatsNews && blockBeatsNews.length > 0) {
          console.log(`成功获取 ${blockBeatsNews.length} 条律动BlockBeats资讯`);
          allNews.push(...blockBeatsNews);
        }
      } catch (blockBeatsError) {
        console.error('获取律动BlockBeats资讯失败:', blockBeatsError);
      }
      
      // 3. 获取加密KOL的X推文
      try {
        const cryptoTweets = await cryptoTwitterService.fetchCryptoKolTweets(5);
        if (cryptoTweets && cryptoTweets.length > 0) {
          console.log(`成功获取 ${cryptoTweets.length} 条加密KOL的X推文`);
          allNews.push(...cryptoTweets);
        }
      } catch (twitterError) {
        console.error('获取加密KOL的X推文失败:', twitterError);
      }
      
      // 如果没有获取到任何资讯，则使用基本模拟数据
      if (allNews.length === 0) {
        console.log('没有获取到任何类型的加密资讯，使用基本模拟数据');
        return this.createBasicMockMessages();
      }
      
      console.log(`总共获取到 ${allNews.length} 条来自所有来源的加密资讯`);
      return allNews;
    } catch (error) {
      console.error('整合所有加密资讯失败:', error);
      return this.createBasicMockMessages();
    }
  }
  
  /**
   * 获取并存储最新加密快讯到数据库
   */
  async fetchAndStoreMessages(): Promise<InsertTelegramMessage[]> {
    try {
      // 整合所有来源的加密资讯
      const allNews = await this.getAllCryptoNews();
      
      if (allNews.length === 0) {
        console.log('没有获取到任何加密快讯，使用基本模拟数据');
        const basicMessages = this.createBasicMockMessages();
        
        // 清空现有消息记录
        await db.delete(telegramMessages);
        
        // 插入基本模拟数据
        const insertedMessages = await db.insert(telegramMessages)
          .values(basicMessages)
          .returning();
        
        console.log(`成功存储 ${insertedMessages.length} 条基本模拟数据`);
        return insertedMessages;
      }
      
      // 对新闻进行去重处理，避免重复内容
      const uniqueNews = this.deduplicateNews(allNews);
      console.log(`对 ${allNews.length} 条快讯进行去重后，剩余 ${uniqueNews.length} 条唯一快讯`);
      
      // 清空现有消息记录，确保每次都能显示最新内容
      await db.delete(telegramMessages);
      console.log('已清空现有快讯记录');
      
      console.log(`准备存储 ${uniqueNews.length} 条来自多个来源的加密资讯`);
      
      // 按时间排序（从新到旧）
      uniqueNews.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date || Date.now());
        const dateB = b.date instanceof Date ? b.date : new Date(b.date || Date.now());
        return dateB.getTime() - dateA.getTime();
      });
      
      // 确保每条消息都有sourceUrl
      const newsWithUrls = uniqueNews.map(news => {
        // 使用类型断言确保TypeScript知道我们在添加sourceUrl属性
        const newsWithUrl = news as InsertTelegramMessage & { sourceUrl?: string };
        
        if (!newsWithUrl.sourceUrl) {
          if (newsWithUrl.sender && newsWithUrl.sender.includes('金色财经')) {
            newsWithUrl.sourceUrl = 'https://www.jinse.cn/';
          } else if (newsWithUrl.sender && newsWithUrl.sender.includes('火星财经')) {
            newsWithUrl.sourceUrl = 'https://news.marsbit.co/';
          } else if (newsWithUrl.sender && newsWithUrl.sender.includes('律动')) {
            newsWithUrl.sourceUrl = 'https://www.theblockbeats.info/';
          } else if (newsWithUrl.sender && newsWithUrl.sender.includes('CoinDesk')) {
            newsWithUrl.sourceUrl = 'https://www.coindesk.com/';
          } else if (newsWithUrl.sender && newsWithUrl.sender.includes('CryptoSlate')) {
            newsWithUrl.sourceUrl = 'https://cryptoslate.com/';
          } else {
            newsWithUrl.sourceUrl = 'https://www.cryptonews.com/';
          }
        }
        return newsWithUrl;
      });
      
      // 存储到数据库
      const insertedMessages = await db.insert(telegramMessages)
        .values(newsWithUrls)
        .returning();
      
      console.log(`成功存储 ${insertedMessages.length} 条加密资讯`);
      return insertedMessages;
    } catch (error) {
      console.error('获取并存储加密快讯失败:', error);
      
      // 出错时使用基本模拟数据
      try {
        console.log('获取快讯失败，使用基本模拟数据');
        // 清空现有消息
        await db.delete(telegramMessages);
        
        // 获取基本模拟消息
        const basicMessages = this.createBasicMockMessages();
        
        // 插入基本模拟数据
        const insertedMessages = await db.insert(telegramMessages)
          .values(basicMessages)
          .returning();
        
        console.log(`成功存储 ${insertedMessages.length} 条基本模拟数据`);
        return insertedMessages;
      } catch (mockError) {
        console.error('存储基本模拟数据失败:', mockError);
        return [];
      }
    }
  }
  
  /**
   * 对快讯进行去重处理 - 强化版
   * 通过多级去重策略，解决重复消息问题
   */
  private deduplicateNews(news: InsertTelegramMessage[]): InsertTelegramMessage[] {
    // 用于存储已处理的消息指纹
    const uniqueFingerprints = new Set<string>();
    const uniqueSenderTexts = new Set<string>();
    const uniqueNews: InsertTelegramMessage[] = [];
    
    // 对原始消息数组进行排序，优先添加最新的消息
    const sortedNews = [...news].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date || Date.now());
      const dateB = b.date instanceof Date ? b.date : new Date(b.date || Date.now());
      return dateB.getTime() - dateA.getTime();
    });
    
    // 强化的内容去重逻辑
    for (const item of sortedNews) {
      // 提取正文内容
      const fullText = item.text || '';
      const textLines = fullText.split('\n').filter(line => line.trim() !== '');
      
      // 1. 提取核心内容
      let coreContent = '';
      if (textLines.length >= 3) {
        // 通常第二行是核心内容
        coreContent = textLines[1].trim();
      } else if (textLines.length === 2) {
        coreContent = textLines[1].trim();
      } else if (textLines.length === 1) {
        coreContent = textLines[0].trim();
      } else {
        // 如果没有内容行，跳过此条目
        continue;
      }
      
      // 2. 清理核心内容，创建标准化指纹
      const cleanedContent = coreContent
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 只保留中英文和数字
        .toLowerCase(); // 转为小写以忽略大小写差异
      
      // 3. 创建发送者+内容的组合指纹，避免不同来源的相同内容被去重
      const senderText = `${item.sender || ''}:${cleanedContent}`;
      
      // 4. 多级去重检查：检查清理后的内容 + 发送者-内容组合
      if (
        cleanedContent.length > 5 && 
        !uniqueFingerprints.has(cleanedContent) &&
        !uniqueSenderTexts.has(senderText)
      ) {
        uniqueFingerprints.add(cleanedContent);
        uniqueSenderTexts.add(senderText);
        uniqueNews.push(item);
      }
    }
    
    // 确保结果中至少有一条数据
    if (uniqueNews.length === 0 && news.length > 0) {
      return [news[0]];
    }
    
    return uniqueNews;
  }
}

export const telegramService = new TelegramService();

// 初始化存储加密快讯数据，确保网站上有内容可显示
(async function initializeCryptoNewsData() {
  try {
    console.log('初始化加密快讯数据...');
    
    // 检查数据库中是否已有消息
    const existingMessages = await db.select().from(telegramMessages);
    
    // 如果没有消息，插入初始数据
    if (existingMessages.length === 0) {
      console.log('数据库中没有加密快讯，添加初始数据');
      await telegramService.fetchAndStoreMessages();
    } else {
      console.log(`数据库中已有 ${existingMessages.length} 条加密快讯`);
    }
  } catch (error) {
    console.error('初始化加密快讯数据失败:', error);
  }
})();