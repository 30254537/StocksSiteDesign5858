import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db';
import { telegramMessages, InsertTelegramMessage } from '@shared/schema';
import { eq } from 'drizzle-orm';

class TelegramService {
  private channelUrl: string = 'https://t.me/s/chengzi_golden';
  
  /**
   * 从 Telegram 频道获取最新消息
   */
  async fetchMessages(): Promise<InsertTelegramMessage[]> {
    try {
      console.log(`开始获取 ${this.channelUrl} 的最新消息...`);
      
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
      const channelTitle = document.querySelector('.tgme_channel_info_header_title')?.textContent?.trim() || 'Telegram 频道';
      
      // 获取所有消息容器
      const messageContainers = document.querySelectorAll('.tgme_widget_message');
      console.log(`找到 ${messageContainers.length} 条消息`);
      
      const messages: InsertTelegramMessage[] = [];
      
      // 处理每条消息
      messageContainers.forEach((container) => {
        try {
          // 获取消息 ID
          const messageLink = container.getAttribute('data-post') || '';
          const messageIdMatch = messageLink.match(/chengzi_golden\/(\d+)/);
          if (!messageIdMatch) return;
          
          const messageId = parseInt(messageIdMatch[1]);
          
          // 获取消息日期
          const dateElement = container.querySelector('.tgme_widget_message_date time');
          const date = dateElement?.getAttribute('datetime') || new Date().toISOString();
          
          // 获取消息发送者
          const senderElement = container.querySelector('.tgme_widget_message_owner_name');
          const sender = senderElement?.textContent?.trim() || channelTitle;
          
          // 获取消息文本
          const textElement = container.querySelector('.tgme_widget_message_text');
          const text = textElement?.textContent?.trim() || '';
          
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
            sender,
            channelTitle,
            mediaUrl,
            date,
            isDisplayed: true // 默认显示所有消息
          });
        } catch (error) {
          console.error('解析消息时出错:', error);
        }
      });
      
      console.log(`成功解析 ${messages.length} 条消息`);
      return messages;
    } catch (error) {
      console.error('获取 Telegram 消息失败:', error);
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
        return new Date(b.date).getTime() - new Date(a.date).getTime();
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