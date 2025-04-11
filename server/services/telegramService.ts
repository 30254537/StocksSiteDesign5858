import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db';
import { telegramMessages, InsertTelegramMessage } from '@shared/schema';
import { eq } from 'drizzle-orm';

// 检查是否为金狗监测新格式
function isGoldenDogFormat(text: string): boolean {
  // 检查是否含有典型的金狗监测标记
  const hasGoldenDogMarker = text.includes("金狗监测") || 
                            text.includes("全狗信号") || 
                            text.includes("全狗监测") || 
                            text.includes("全狗值守机器人");
  
  // 老格式
  const isOldFormat = text.includes("🔔 金狗监测提醒") || 
                     (text.includes("代币名称") && text.includes("合约地址"));
  
  // 新格式: 检查与加密货币相关的关键词
  const hasContractInfo = text.includes("合约地址") || 
                          text.includes("CA:") || 
                          text.includes("代币名称") || 
                          text.includes("建仓");
                          
  // 检查价格、市值等数据类信息
  const hasMarketInfo = text.includes("市值") || 
                        text.includes("价格") || 
                        text.includes("持有者") || 
                        text.includes("交易量");
  
  console.log(`消息格式检查: hasGoldenDogMarker=${hasGoldenDogMarker}, hasContractInfo=${hasContractInfo}, hasMarketInfo=${hasMarketInfo}`);
  
  // 满足以下任一条件即可：
  // 1. 包含金狗监测标记
  // 2. 同时包含合约信息和市场信息
  return hasGoldenDogMarker || (hasContractInfo && hasMarketInfo);
}

class TelegramService {
  // 使用金狗监测提醒频道URL，这是正确的Telegram公开频道URL格式
  private channelUrl: string = 'https://t.me/s/chengzi_golden';
  
  /**
   * 从 Telegram 频道获取最新消息
   */
  async fetchMessages(): Promise<InsertTelegramMessage[]> {
    try {
      console.log(`开始获取 ${this.channelUrl} 的最新金狗监测提醒消息...`);
      
      // 获取频道页面内容
      const response = await axios.get(this.channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      });
      
      // 解析 HTML
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // 获取频道标题
      const channelTitle = document.querySelector('.tgme_channel_info_header_title')?.textContent?.trim() || '金狗监测频道';
      
      // 获取所有消息容器
      const messageContainers = document.querySelectorAll('.tgme_widget_message');
      console.log(`找到 ${messageContainers.length} 条消息`);
      
      const messages: InsertTelegramMessage[] = [];
      
      // 处理每条消息
      messageContainers.forEach((container) => {
        try {
          // 获取消息 ID
          const messageLink = container.getAttribute('data-post') || '';
          console.log(`处理消息链接: ${messageLink}`);
          
          // 适配不同频道格式
          let messageIdMatch = messageLink.match(/chengzi_golden\/(\d+)/);
          
          // 如果无法匹配，尝试其他格式
          if (!messageIdMatch) {
            messageIdMatch = messageLink.match(/GoldDogAlpha\/(\d+)/);
          }
          
          // 如果还是无法匹配，尝试直接获取最后一段数字作为消息ID
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
          const sender = senderElement?.textContent?.trim() || '金狗监测';
          
          // 获取消息文本
          const textElement = container.querySelector('.tgme_widget_message_text');
          const text = textElement?.textContent?.trim() || '';
          
          // 过滤只保留金狗监测提醒格式的消息
          if (!isGoldenDogFormat(text)) {
            return;
          }
          
          // 获取消息媒体 (如果有)
          const photoElement = container.querySelector('.tgme_widget_message_photo_wrap');
          let mediaUrl = null;
          
          if (photoElement) {
            const style = photoElement.getAttribute('style') || '';
            const urlMatch = style.match(/background-image:url\('(.+?)'\)/);
            if (urlMatch) {
              mediaUrl = urlMatch[1];
            }
          }
          
          // 创建消息对象
          messages.push({
            messageId,
            text,
            sender: '金狗监测', // 固定发送者为金狗监测
            channelTitle: '金狗监测频道',
            mediaUrl,
            date: new Date(date), // 转换为日期对象
            isDisplayed: true // 默认显示所有消息
          });
        } catch (error) {
          console.error('解析消息时出错:', error);
        }
      });
      
      console.log(`成功解析 ${messages.length} 条金狗监测提醒消息`);
      return messages;
    } catch (error) {
      console.error('获取 Telegram 金狗监测提醒消息失败:', error);
      return [];
    }
  }
  
  /**
   * 获取并存储消息
   */
  async fetchAndStoreMessages(): Promise<InsertTelegramMessage[]> {
    try {
      // 获取消息
      const messages = await this.fetchMessages();
      if (messages.length === 0) {
        console.log('没有找到 Telegram 消息');
        return [];
      }
      
      console.log(`准备存储 ${messages.length} 条 Telegram 消息`);
      
      // 过滤出新消息
      const newMessages: InsertTelegramMessage[] = [];
      
      // 检查每条消息是否已存在
      for (const message of messages) {
        // 查询数据库
        const existingMessage = await db.select()
          .from(telegramMessages)
          .where(eq(telegramMessages.messageId, message.messageId))
          .limit(1);
        
        // 如果消息不存在，添加到新消息列表
        if (existingMessage.length === 0) {
          newMessages.push(message);
        }
      }
      
      if (newMessages.length === 0) {
        console.log('没有新的 Telegram 消息需要存储');
        return [];
      }
      
      console.log(`发现 ${newMessages.length} 条新 Telegram 消息，准备存储`);
      
      // 按消息时间排序（从新到旧）
      newMessages.sort((a, b) => {
        // 确保 date 是有效的 Date 对象或能转换为 Date 的值
        const dateA = a.date instanceof Date ? a.date : new Date(a.date || Date.now());
        const dateB = b.date instanceof Date ? b.date : new Date(b.date || Date.now());
        return dateB.getTime() - dateA.getTime();
      });
      
      // 将新消息插入数据库
      const insertedMessages = await db.insert(telegramMessages)
        .values(newMessages)
        .returning();
      
      console.log(`成功存储 ${insertedMessages.length} 条新 Telegram 消息`);
      return insertedMessages;
    } catch (error) {
      console.error('获取并存储 Telegram 消息失败:', error);
      return [];
    }
  }
}

export const telegramService = new TelegramService();