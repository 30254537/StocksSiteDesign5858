import { db } from '../db';
import { telegramMessages, InsertTelegramMessage } from '@shared/schema';
import * as financeNewsService from './financeNewsService';

/**
 * 加密快讯服务类 - 负责获取、处理和存储加密货币相关资讯
 * 从金色财经和火星财经获取最新资讯，并以加密快讯的形式呈现
 */
class TelegramService {
  /**
   * 创建基本的加密快讯消息（作为备用数据）
   */
  private createBasicMockMessages(): InsertTelegramMessage[] {
    const currentDate = new Date();
    return [
      {
        messageId: 100001,
        text: `🔔 加密快讯 × 金色财经\n\n💰 代币名称: $BTC\n\n📝 合约地址: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8\n\n🗣️相关资讯: 金色财经7x24H\n\n比特币突破7万美元大关，创下历史新高。市场分析师认为这一上涨趋势可能持续到2025年第二季度，预计比特币将迎来新一轮牛市。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 金色财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        sourceUrl: 'https://www.jinse.cn/',
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100002,
        text: `🔔 加密快讯 × 火星财经\n\n💰 代币名称: $ETH\n\n📝 合约地址: 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c\n\n🗣️相关资讯: 火星财经快讯\n\nETH2.0质押量已突破3000万枚，占以太坊总流通量的25%。这显示了市场对以太坊长期发展的信心，同时也减少了市场上的流通供应。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 火星财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        sourceUrl: 'https://news.marsbit.co/',
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100003,
        text: `🔔 加密快讯 × 金色财经\n\n💰 代币名称: $STONKS\n\n📝 合约地址: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56\n\n🗣️相关资讯: 金色财经7x24H\n\nSTONKS DEX宣布将推出去中心化合成资产交易功能，成为DeFi领域首个提供此类服务的平台。该功能将允许用户交易与传统金融资产挂钩的合成代币。\n\n${currentDate.toLocaleString('zh-CN')}`,
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
   * 获取并存储最新加密快讯到数据库
   */
  async fetchAndStoreMessages(): Promise<InsertTelegramMessage[]> {
    try {
      // 直接使用财经快讯服务获取最新资讯
      const financeNews = await this.getFinanceNews();
      
      if (financeNews.length === 0) {
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
      const uniqueNews = this.deduplicateNews(financeNews);
      console.log(`对 ${financeNews.length} 条快讯进行去重后，剩余 ${uniqueNews.length} 条唯一快讯`);
      
      // 清空现有消息记录，确保每次都能显示最新内容
      await db.delete(telegramMessages);
      console.log('已清空现有快讯记录');
      
      console.log(`准备存储 ${uniqueNews.length} 条金色财经和火星财经的最新资讯`);
      
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
      
      console.log(`成功存储 ${insertedMessages.length} 条加密快讯资讯`);
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
   * 对快讯进行去重处理
   * 根据新闻内容进行去重，而不仅仅是ID
   */
  private deduplicateNews(news: InsertTelegramMessage[]): InsertTelegramMessage[] {
    // 用于存储已处理的消息内容的集合
    const uniqueContents = new Set<string>();
    const uniqueNews: InsertTelegramMessage[] = [];
    
    for (const item of news) {
      // 提取实际的新闻内容，去除时间戳和前缀等
      let content = '';
      const textLines = item.text.split('\n');
      
      // 找到实际内容行（不包括第一行标题和最后一行时间）
      if (textLines.length >= 3) {
        // 排除第一行和最后一行，通常是标题和时间戳
        content = textLines.slice(1, -1).join(' ').trim();
      } else {
        content = item.text; // 如果格式不符合预期，使用整个文本
      }
      
      // 如果这个内容还没有处理过，添加到结果中
      if (!uniqueContents.has(content) && content.length > 0) {
        uniqueContents.add(content);
        uniqueNews.push(item);
      }
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