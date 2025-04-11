import axios from 'axios';
import { db } from '../db';
import { telegramMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Telegram API 基础 URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export interface TelegramMessage {
  id: number;
  text: string;
  date: number; // Unix 时间戳
  sender: string;
  mediaUrl?: string;
  channelTitle?: string;
}

export class TelegramService {
  private botToken: string;
  private channelUsername: string;
  private lastUpdateId: number = 0;
  
  constructor(botToken: string, channelUsername: string) {
    this.botToken = botToken;
    // 确保频道用户名以 @ 开头
    this.channelUsername = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
  }

  /**
   * 获取频道的最新消息
   */
  async getLatestMessages(limit: number = 10): Promise<TelegramMessage[]> {
    try {
      // 从数据库获取消息
      const messages = await db.select().from(telegramMessages)
        .orderBy(telegramMessages.date)
        .limit(limit);
      
      return messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        date: new Date(msg.date).getTime() / 1000,
        sender: msg.sender || '',
        mediaUrl: msg.mediaUrl || undefined,
        channelTitle: msg.channelTitle || undefined
      }));
    } catch (error) {
      console.error('获取 Telegram 消息失败:', error);
      return [];
    }
  }

  /**
   * 从 Telegram API 获取最新消息并保存到数据库
   */
  async fetchAndStoreMessages(): Promise<TelegramMessage[]> {
    try {
      // 获取频道更新
      const response = await axios.get(
        `${TELEGRAM_API_BASE}${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&allowed_updates=["channel_post"]`
      );

      const { ok, result } = response.data;
      
      if (!ok || !result.length) {
        return [];
      }

      // 过滤出来自指定频道的消息
      const channelUpdates = result.filter(
        (update: any) => 
          update.channel_post && 
          update.channel_post.chat.username === this.channelUsername.substring(1)
      );

      if (!channelUpdates.length) {
        return [];
      }

      // 更新最后处理的更新 ID
      this.lastUpdateId = Math.max(...channelUpdates.map((update: any) => update.update_id));

      // 提取消息内容
      const messages: TelegramMessage[] = [];
      
      for (const update of channelUpdates) {
        const post = update.channel_post;
        
        if (!post) continue;

        let mediaUrl = undefined;
        
        // 检查消息中是否包含媒体内容
        if (post.photo) {
          // 获取最大尺寸的照片
          const photoId = post.photo[post.photo.length - 1].file_id;
          // 获取文件信息
          const fileResponse = await axios.get(
            `${TELEGRAM_API_BASE}${this.botToken}/getFile?file_id=${photoId}`
          );
          
          if (fileResponse.data.ok) {
            const filePath = fileResponse.data.result.file_path;
            mediaUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
          }
        }

        const message: TelegramMessage = {
          id: post.message_id,
          text: post.text || post.caption || '',
          date: post.date,
          sender: post.chat.title || post.chat.username || '',
          mediaUrl,
          channelTitle: post.chat.title
        };

        messages.push(message);

        // 保存到数据库
        await db.insert(telegramMessages).values({
          messageId: post.message_id,
          text: message.text,
          date: new Date(post.date * 1000),
          sender: message.sender,
          mediaUrl: message.mediaUrl,
          channelTitle: message.channelTitle
        }).onConflictDoUpdate({
          target: telegramMessages.messageId,
          set: {
            text: message.text,
            mediaUrl: message.mediaUrl
          }
        });
      }

      return messages;
    } catch (error) {
      console.error('从 Telegram 获取消息失败:', error);
      return [];
    }
  }
}

// 导出单例实例
export const telegramService = new TelegramService(
  process.env.TELEGRAM_BOT_TOKEN || '',
  process.env.TELEGRAM_CHANNEL_USERNAME || 'chengzi_golden'
);