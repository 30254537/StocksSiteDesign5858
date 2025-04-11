import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { eq, desc, or, and } from 'drizzle-orm';
import { telegramMessages } from '@shared/schema';

// 金色财经快讯页面URL
const JINSE_URL = 'https://www.jinse.cn/lives';
// 火星财经快讯页面URL
const MARSBIT_URL = 'https://www.marsbit.co/express';

/**
 * 从金色财经获取快讯
 */
export async function scrapeJinseNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从金色财经抓取快讯...');
    const response = await axios.get(JINSE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const newsItems: any[] = [];

    // 金色财经的快讯通常在.content-box .flash-list下
    $('.flash-item').each((index: number, element: any) => {
      if (index >= limit) return false;

      const timeElement = $(element).find('.flash-item-time');
      const contentElement = $(element).find('.flash-item-content');
      
      const timeText = timeElement.text().trim();
      const content = contentElement.text().trim();
      
      // 获取快讯ID，通常在data-id属性中
      const newsId = $(element).attr('data-id') || `jinse-${Date.now()}-${index}`;
      
      // 获取相对链接，可能在a标签中
      const link = $(element).find('a').attr('href');
      const fullLink = link ? (link.startsWith('http') ? link : `https://www.jinse.cn${link}`) : null;

      newsItems.push({
        messageId: newsId,
        text: `🔔 金色财经快讯\n\n${content}\n\n${timeText}`,
        sender: '金色财经',
        channelTitle: '金色财经快讯',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDisplayed: true,
        sourceUrl: fullLink
      });
    });

    console.log(`成功从金色财经抓取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error('从金色财经抓取快讯失败:', error);
    return [];
  }
}

/**
 * 从火星财经获取快讯
 */
export async function scrapeMarsbitNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从火星财经抓取快讯...');
    const response = await axios.get(MARSBIT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const newsItems: any[] = [];

    // 火星财经快讯通常在特定的列表容器中
    $('.express_content_list .express_item').each((index: number, element: any) => {
      if (index >= limit) return false;

      const timeElement = $(element).find('.time');
      const contentElement = $(element).find('.content');
      
      const timeText = timeElement.text().trim();
      const content = contentElement.text().trim();
      
      // 获取快讯ID
      const newsId = $(element).attr('data-id') || `marsbit-${Date.now()}-${index}`;
      
      // 获取相对链接
      const link = $(element).find('a').attr('href');
      const fullLink = link ? (link.startsWith('http') ? link : `https://www.marsbit.co${link}`) : null;

      newsItems.push({
        messageId: newsId,
        text: `🔥 火星财经快讯\n\n${content}\n\n${timeText}`,
        sender: '火星财经',
        channelTitle: '火星财经快讯',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isDisplayed: true,
        sourceUrl: fullLink
      });
    });

    console.log(`成功从火星财经抓取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error('从火星财经抓取快讯失败:', error);
    return [];
  }
}

/**
 * 获取并存储快讯到数据库
 */
export async function fetchAndStoreFinanceNews(limit: number = 10): Promise<any[]> {
  try {
    // 获取两个来源的快讯
    const jinseNews = await scrapeJinseNews(limit);
    const marsbitNews = await scrapeMarsbitNews(limit);
    
    // 合并快讯
    const allNews = [...jinseNews, ...marsbitNews];
    
    if (allNews.length === 0) {
      console.log('没有获取到任何财经快讯');
      return [];
    }
    
    console.log(`总共获取了 ${allNews.length} 条财经快讯，准备存储到数据库`);
    
    // 获取所有现有的快讯ID
    const existingMessages = await db.select({ messageId: telegramMessages.messageId })
      .from(telegramMessages)
      .where(
        or(
          eq(telegramMessages.sender, '金色财经'),
          eq(telegramMessages.sender, '火星财经')
        )
      );
    
    const existingMessageIds = new Set(existingMessages.map((m: {messageId: number | string}) => String(m.messageId)));
    
    // 只插入新的快讯
    const newMessages = allNews.filter(news => !existingMessageIds.has(news.messageId));
    
    if (newMessages.length === 0) {
      console.log('没有新的财经快讯需要存储');
      return [];
    }
    
    console.log(`准备存储 ${newMessages.length} 条新财经快讯`);
    
    // 清空现有的快讯记录（可选，取决于是否要保留历史记录）
    await db.delete(telegramMessages)
      .where(
        or(
          eq(telegramMessages.sender, '金色财经'),
          eq(telegramMessages.sender, '火星财经')
        )
      );
    
    // 插入新数据
    const insertedMessages = await db.insert(telegramMessages)
      .values(newMessages)
      .returning();
    
    console.log(`成功存储 ${insertedMessages.length} 条财经快讯`);
    
    return insertedMessages;
  } catch (error) {
    console.error('获取并存储财经快讯失败:', error);
    return [];
  }
}

/**
 * 获取最新的快讯
 */
export async function getLatestFinanceNews(limit: number = 10): Promise<any[]> {
  try {
    const latestMessages = await db.select()
      .from(telegramMessages)
      .where(
        and(
          eq(telegramMessages.isDisplayed, true),
          or(
            eq(telegramMessages.sender, '金色财经'),
            eq(telegramMessages.sender, '火星财经')
          )
        )
      )
      .orderBy(desc(telegramMessages.createdAt))
      .limit(limit);
    
    return latestMessages;
  } catch (error) {
    console.error('获取最新财经快讯失败:', error);
    return [];
  }
}