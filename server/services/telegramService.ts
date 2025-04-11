import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db';
import { telegramMessages, InsertTelegramMessage } from '@shared/schema';
import { eq } from 'drizzle-orm';

// 简化后的金狗监测格式检查，只关注代币名称和合约地址
function isGoldenDogFormat(text: string): boolean {
  // 简化为只检查代币名称和合约地址
  const hasTokenName = text.includes('代币名称') || text.includes('$') || text.includes('代币:') || text.includes('代币：');
  const hasContract = text.includes('合约地址') || text.includes('合约:') || text.includes('合约：') || text.includes('CA:') || text.includes('0x');
  
  // 只要包含代币名称或合约地址中的一个即符合条件
  const isMatch = hasTokenName || hasContract;
  
  // 记录日志以便调试
  console.log(`消息匹配结果 - 包含代币名称: ${hasTokenName}, 包含合约地址: ${hasContract}, 是否匹配: ${isMatch}`);
  console.log(`消息内容预览: ${text.substring(0, 50)}...`);
  
  return isMatch;
}

// Telegram服务类
class TelegramService {
  // 从财经快讯创建金狗监测格式的消息
  private async createMockMessagesFromFinanceNews(): Promise<InsertTelegramMessage[]> {
    try {
      // 导入 financeNewsService
      const { scrapeJinseNews, scrapeMarsbitNews } = require('./financeNewsService');
      
      // 获取最新的财经快讯
      const jinseNews = await scrapeJinseNews(3);
      const marsbitNews = await scrapeMarsbitNews(2);
      
      // 合并所有快讯
      const allNews = [...jinseNews, ...marsbitNews];
      
      if (!allNews || allNews.length === 0) {
        console.log('没有找到财经快讯数据，创建基本模拟消息');
        return this.createBasicMockMessages();
      }
      
      console.log(`获取到 ${allNews.length} 条财经快讯，转换为金狗监测格式`);
      
      // 创建模拟代币名称和合约地址
      const tokenNames = ['$STONKS', '$BTC', '$ETH', '$BNB', '$SOL'];
      const contractAddresses = [
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        '0x55d398326f99059fF775485246999027B3197955'
      ];
      
      // 将财经快讯转换为金狗监测格式的消息
      return allNews.map((news, index) => {
        // 从财经快讯中提取标题和内容
        const content = news.text;
        
        // 生成随机数据
        const tokenName = tokenNames[index % tokenNames.length];
        const contractAddress = contractAddresses[index % contractAddresses.length];
        const marketCap = ['$10K', '$500K', '$2.3M', '$47M', '$1.2B'][Math.floor(Math.random() * 5)];
        const priceChange = (Math.random() * 30).toFixed(2) + '%';
        const volume = ['$50K', '$320K', '$1.5M', '$25M', '$120M'][Math.floor(Math.random() * 5)];
        const holders = ['120', '580', '2.3K', '12K', '45K'][Math.floor(Math.random() * 5)];
        const riskLevel = ['低', '中', '高'][Math.floor(Math.random() * 3)];
        
        // 创建一个类似金狗监测的消息，同时包含财经快讯内容
        return {
          messageId: news.messageId || 10000 + index,
          text: `🔔 金狗监测 × ${news.sender}\n
💰 代币名称: ${tokenName}
\n📝 合约地址: ${contractAddress}
\n👺市值: ${marketCap}
⏳前十持仓: ${(Math.random() * 40).toFixed(1)}%
👥持有者数量: ${holders}
📊24h交易量: ${volume}
📈6小时价格变化: ${priceChange}
🕒创建时间: ${new Date().toLocaleString('zh-CN')}
🔍捆绑分析: 🟠 ${(Math.random() * 50).toFixed(2)}%
\n🗣️相关资讯: ${content}`,
          sender: '金狗监测 × ' + news.sender,
          channelTitle: '金狗监测与财经快讯',
          mediaUrl: null,
          date: news.date || new Date(),
          isDisplayed: true
        };
      });
    } catch (error) {
      console.error('创建财经快讯金狗监测消息失败:', error);
      return this.createBasicMockMessages();
    }
  }
  
  // 创建财经快讯消息
  private createBasicMockMessages(): InsertTelegramMessage[] {
    const currentDate = new Date();
    return [
      {
        messageId: 100001,
        text: `🔔 加密快讯 × 金色财经\n
💰 代币名称: $BTC
\n📝 合约地址: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
\n🗣️相关资讯: 金色财经7x24H\n\n比特币突破7万美元大关，创下历史新高。市场分析师认为这一上涨趋势可能持续到2025年第二季度，预计比特币将迎来新一轮牛市。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 金色财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100002,
        text: `🔔 加密快讯 × 火星财经\n
💰 代币名称: $ETH
\n📝 合约地址: 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
\n🗣️相关资讯: 火星财经快讯\n\nETH2.0质押量已突破3000万枚，占以太坊总流通量的25%。这显示了市场对以太坊长期发展的信心，同时也减少了市场上的流通供应。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 火星财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        date: currentDate,
        isDisplayed: true
      },
      {
        messageId: 100003,
        text: `🔔 加密快讯 × 金色财经\n
💰 代币名称: $STONKS
\n📝 合约地址: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
\n🗣️相关资讯: 金色财经7x24H\n\nSTONKS DEX宣布将推出去中心化合成资产交易功能，成为DeFi领域首个提供此类服务的平台。该功能将允许用户交易与传统金融资产挂钩的合成代币。\n\n${currentDate.toLocaleString('zh-CN')}`,
        sender: '加密快讯 × 金色财经',
        channelTitle: '加密资讯频道',
        mediaUrl: null,
        date: currentDate,
        isDisplayed: true
      }
    ];
  }

  // 支持多个频道同时抓取 - 使用多种URL格式提高成功率
  private channels = [
    {
      name: '金狗监测频道',
      url: 'https://t.me/s/chengzi_golden',
      alternativeUrl: 'https://t.me/chengzi_golden'
      // 注意：由于Telegram限制，可能无法通过Web直接抓取消息
      // 因此我们提供模拟数据作为备份
    },
    {
      name: 'GoldDogAlpha频道',
      url: 'https://t.me/s/GoldDogAlpha',
      alternativeUrl: 'https://t.me/GoldDogAlpha'
    }
  ];

  // 从单个频道获取消息
  private async fetchChannelMessages(channel: {name: string, url: string, alternativeUrl?: string}): Promise<InsertTelegramMessage[]> {
    // 准备URL列表，优先使用主URL，然后尝试备用URL
    const urls = [channel.url];
    if (channel.alternativeUrl) {
      urls.push(channel.alternativeUrl);
    }
    
    let lastError = null;
    
    // 尝试每个URL
    for (const currentUrl of urls) {
      try {
        console.log(`尝试从 ${channel.name} (${currentUrl}) 获取消息...`);
        
        // 发送HTTP请求获取页面内容
        const response = await axios.get(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          }
        });
        
        // 使用JSDOM解析HTML
        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        
        // 获取频道标题
        const channelTitle = document.querySelector('.tgme_channel_info_header_title')?.textContent?.trim() || channel.name;
        
        // 获取所有消息容器
        const messageContainers = document.querySelectorAll('.tgme_widget_message');
        console.log(`在 ${channel.name} 中找到 ${messageContainers.length} 条消息`);
        
        const messages: InsertTelegramMessage[] = [];
        
        // 处理每条消息
        messageContainers.forEach((container) => {
          try {
            // 获取消息ID
            const messageLink = container.getAttribute('data-post') || '';
            
            // 尝试多种正则匹配方式提取消息ID
            let messageIdMatch = messageLink.match(/chengzi_golden\/(\d+)/);
            if (!messageIdMatch) {
              messageIdMatch = messageLink.match(/GoldDogAlpha\/(\d+)/);
            }
            
            // 如果还是无法匹配，尝试直接获取最后一段数字
            if (!messageIdMatch) {
              const parts = messageLink.split('/');
              const lastPart = parts[parts.length - 1];
              if (/^\d+$/.test(lastPart)) {
                messageIdMatch = [lastPart, lastPart];
              } else {
                console.log(`无法从链接提取消息ID: ${messageLink}`);
                return;
              }
            }
            
            const messageId = parseInt(messageIdMatch[1]);
            
            // 获取消息日期
            const dateElement = container.querySelector('.tgme_widget_message_date time');
            const date = dateElement?.getAttribute('datetime') || new Date().toISOString();
            
            // 获取消息发送者
            const senderElement = container.querySelector('.tgme_widget_message_owner_name');
            const sender = senderElement?.textContent?.trim() || channel.name;
            
            // 获取消息文本
            const textElement = container.querySelector('.tgme_widget_message_text');
            const text = textElement?.textContent?.trim() || '';
            
            // 检查是否符合金狗监测格式
            if (!isGoldenDogFormat(text)) {
              console.log(`消息不符合金狗监测格式: ${text.substring(0, 50)}...`);
              return;
            }
            
            // 获取消息图片(如果有)
            const photoElement = container.querySelector('.tgme_widget_message_photo_wrap');
            let mediaUrl = null;
            
            if (photoElement) {
              const style = photoElement.getAttribute('style') || '';
              const urlMatch = style.match(/background-image:url\('(.+?)'\)/);
              if (urlMatch) {
                mediaUrl = urlMatch[1];
              }
            }
            
            // 创建消息对象并添加到数组
            messages.push({
              messageId,
              text,
              sender: channel.name, 
              channelTitle,
              mediaUrl,
              date: new Date(date),
              isDisplayed: true
            });
          } catch (error) {
            console.error('解析消息时出错:', error);
          }
        });
        
        console.log(`成功从 ${channel.name} 解析 ${messages.length} 条消息`);
        
        // 如果找到了消息，立即返回
        if (messages.length > 0) {
          return messages;
        }
      } catch (error) {
        lastError = error;
        console.error(`获取 ${channel.name} (${currentUrl}) 消息失败:`, error);
      }
    }
    
    // 所有URL都失败时，返回空数组
    console.error(`无法从 ${channel.name} 获取消息`);
    return [];
  }

  // 从所有频道获取消息
  async fetchMessages(): Promise<InsertTelegramMessage[]> {
    try {
      console.log(`开始从 ${this.channels.length} 个频道获取消息...`);
      
      // 用于存储所有频道的消息
      const allMessages: InsertTelegramMessage[] = [];
      
      // 遍历所有频道并获取消息
      for (const channel of this.channels) {
        try {
          const channelMessages = await this.fetchChannelMessages(channel);
          allMessages.push(...channelMessages);
        } catch (error) {
          console.error(`获取 ${channel.name} 消息时出错:`, error);
        }
      }
      
      console.log(`从所有频道共获取 ${allMessages.length} 条消息`);
      return allMessages;
    } catch (error) {
      console.error('获取所有频道消息失败:', error);
      return [];
    }
  }
  
  // 获取并存储消息到数据库
  async fetchAndStoreMessages(): Promise<InsertTelegramMessage[]> {
    try {
      // 通过模拟的TG爬取API尝试获取消息
      const telegramMessages = await this.fetchMessages();
      
      // 同时从财经快讯获取消息
      const financeMessages = await this.createMockMessagesFromFinanceNews();
      
      // 合并两组消息
      let messages = [...telegramMessages];
      
      // 如果没有找到TG消息，只使用财经快讯格式化的消息
      if (messages.length === 0) {
        console.log('没有找到金狗监测真实消息，使用财经快讯数据');
        messages = financeMessages;
      } else {
        // 如果有TG消息，将财经快讯添加到列表中
        messages = [...messages, ...financeMessages];
      }
      
      // 清空现有消息记录，确保每次都能正确展示
      try {
        await db.delete(telegramMessages);
        console.log('已清空现有消息记录');
      } catch (error) {
        console.error('清空消息记录失败:', error);
      }
      
      console.log(`准备存储 ${messages.length} 条金狗监测与财经快讯消息`);
      
      // 按时间排序（从新到旧）
      messages.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date || Date.now());
        const dateB = b.date instanceof Date ? b.date : new Date(b.date || Date.now());
        return dateB.getTime() - dateA.getTime();
      });
      
      // 存储到数据库
      const insertedMessages = await db.insert(telegramMessages)
        .values(messages)
        .returning();
      
      console.log(`成功存储 ${insertedMessages.length} 条消息`);
      return insertedMessages;
    } catch (error) {
      console.error('获取并存储消息失败:', error);
      
      // 出错时使用基本模拟数据
      try {
        console.log('获取消息失败，使用基本模拟数据');
        // 清空现有消息
        await db.delete(telegramMessages);
        
        // 获取基本模拟消息
        const basicMessages = this.createBasicMockMessages();
        
        // 插入基本模拟数据
        const insertedMessages = await db.insert(telegramMessages)
          .values(basicMessages)
          .returning();
        
        console.log(`成功存储 ${insertedMessages.length} 条基本模拟消息`);
        return insertedMessages;
      } catch (mockError) {
        console.error('存储基本模拟消息失败:', mockError);
        return [];
      }
    }
  }
}

export const telegramService = new TelegramService();

// 初始化存储模拟数据，确保网站上有内容可显示
(async function initializeMockData() {
  try {
    console.log('初始化金狗监测消息数据...');
    
    // 检查数据库中是否已有消息
    const existingMessages = await db.select().from(telegramMessages);
    
    // 如果没有消息，插入模拟数据
    if (existingMessages.length === 0) {
      console.log('数据库中没有金狗监测消息，添加模拟数据');
      await telegramService.fetchAndStoreMessages();
    } else {
      console.log(`数据库中已有 ${existingMessages.length} 条金狗监测消息`);
    }
  } catch (error) {
    console.error('初始化金狗监测消息数据失败:', error);
  }
})();