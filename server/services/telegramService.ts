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
  // 手动添加一些测试消息用于显示，包括新的TrashCoin格式
  private mockMessages: InsertTelegramMessage[] = [
    {
      messageId: 1001,
      text: `🔔 金狗监测提醒
代币名称: $pablo
市值: $17K
前1小时涨幅: 28.9%
24h交易量: $36K
创建时间: 2025/4/11 15:59:54
合约地址: 0x6dbz5txzT3xHwB3JX2Lf8bQeqcYUkrTabCeGfS7Tpump
市场分析: 🔴 31.80%
有关此文件查看数量: 7`,
      sender: '金狗监测频道',
      channelTitle: '金狗监测频道',
      mediaUrl: null,
      date: new Date(),
      isDisplayed: true
    },
    {
      messageId: 1002,
      text: `🚀 金狗监测
      
代币: $STONKS
价格: 0.031 USDT
24h涨幅: +15.4%
市值: $31M
持有者: 9521
      
🔄 当前动作: 建仓中
⚠️ 风险等级: 中等
      
合约: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
      
👉 交易: https://app.uniswap.org/#/swap?outputCurrency=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
      
🔗 查看更多: t.me/GoldDogAlpha`,
      sender: 'GoldDogAlpha频道',
      channelTitle: 'GoldDogAlpha频道',
      mediaUrl: null,
      date: new Date(),
      isDisplayed: true
    },
    {
      messageId: 1003,
      text: `买币渠道
代币: BLORB 涨幅: 2120.22% 合约地址: Azf..,
现在上线: uniswap | MEXC | Bybit | Huobi | ByDFI | OKX | Gate | Binance | HTX

#SOL #Solana #金狗监测

⚠ 金狗监测高度提醒
💰 代币名称:$TrashCoin TrashCoin
📝 合约地址:
Ba32nK2fV9yr7ALcyoiBdzw1AryjzazmBBW877ZEpump

🪙 K线链接:
https://gmgn.ai/sol/token/l2XlXD4b_Ba32nK2fV9yr7ALcyoiBdzw1AryjzazmBBW877ZEpump

💴 市值$21K
💵 前十持仓:30.9%
👨‍👨‍👧‍👦持有者数量: 117
📈24h交易量: $34K
💶6小时价格变化: 543%
⏰创建时间:2025/4/11 17:41:25
🔮市场分析: 🔴 40.12%

👨‍💻有关此文件查看数量: 7
📡蓝V用户: 0

⚠ 推荐信息:无推特

⚠ 笔记:`,
      sender: '金狗监测频道',
      channelTitle: '金狗监测频道',
      mediaUrl: null,
      date: new Date(),
      isDisplayed: true
    }
  ];

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
      // 尝试获取真实消息
      let messages = await this.fetchMessages();
      
      // 如果没有找到消息，使用模拟数据作为备用选项
      if (messages.length === 0) {
        console.log('没有找到真实消息，使用模拟数据');
        messages = this.mockMessages;
      }
      
      // 清空现有消息记录，确保每次都能正确展示
      try {
        await db.delete(telegramMessages);
        console.log('已清空现有消息记录');
      } catch (error) {
        console.error('清空消息记录失败:', error);
      }
      
      console.log(`准备存储 ${messages.length} 条消息`);
      
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
      
      // 出错时尝试返回模拟数据
      try {
        console.log('尝试使用模拟数据');
        // 清空现有消息
        await db.delete(telegramMessages);
        
        // 插入模拟数据
        const insertedMessages = await db.insert(telegramMessages)
          .values(this.mockMessages)
          .returning();
        
        console.log(`成功存储 ${insertedMessages.length} 条模拟消息`);
        return insertedMessages;
      } catch (mockError) {
        console.error('存储模拟消息失败:', mockError);
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