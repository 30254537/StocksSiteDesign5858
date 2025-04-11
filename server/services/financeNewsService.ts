import axios from 'axios';
import { db } from '../db';
import { eq, desc, or, and } from 'drizzle-orm';
import { telegramMessages } from '@shared/schema';

// 使用API端点而不是直接爬取网页
// 金色财经API URL（模拟数据）
const JINSE_API_URL = 'https://api.jinse.cn/noah/v2/lives?limit=20&reading=false&source=web';
// 火星财经API URL（模拟数据）
const MARSBIT_API_URL = 'https://api.marsbit.co/hotevents/list?size=20';

// 生成符合PostgreSQL整数范围的ID
function generateUniqueId(index: number = 0, source: string = ''): number {
  // 使用Unix时间戳的秒数作为基础（而不是毫秒）
  const baseId = Math.floor(Date.now() / 1000);
  
  // 对不同来源使用不同偏移量
  let sourceOffset = 0;
  if (source === 'jinse') {
    sourceOffset = 1000;
  } else if (source === 'marsbit') {
    sourceOffset = 2000;
  }
  
  // 组合生成最终ID
  return baseId + sourceOffset + index;
}

/**
 * 从金色财经获取快讯 - 优化版，提供详细内容
 */
export async function scrapeJinseNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从金色财经API获取快讯...');
    
    // 尝试通过API获取数据
    const response = await axios.get(JINSE_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.jinse.cn/',
        'Origin': 'https://www.jinse.cn'
      },
      timeout: 15000,
    });

    // 检查API响应
    const newsItems: any[] = [];
    
    if (response.data && response.data.data && response.data.data.list) {
      // 解析API响应的JSON数据
      const newsData = response.data.data.list.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        const content = item.content || '无内容';
        const timeText = new Date(item.created_at * 1000).toLocaleString('zh-CN');
        // 生成符合PostgreSQL integer范围的唯一ID
        const newsId = generateUniqueId(index, 'jinse');
        const fullLink = item.link || `https://www.jinse.cn/lives/${item.id}`;
        
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
    } else {
      // 如果无法从API获取实时数据，则返回空结果
      console.log('无法通过金色财经API获取实时数据');
    }

    console.log(`成功从金色财经获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error('从金色财经获取快讯失败:', error);
    console.log('无法获取金色财经实时快讯，返回空数组');
    // 不再使用模拟数据，直接返回空数组
    return [];
  }
}

/**
 * 从火星财经获取快讯
 */
export async function scrapeMarsbitNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从火星财经API获取快讯...');
    const response = await axios.get(MARSBIT_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://news.marsbit.co',
        'Origin': 'https://news.marsbit.co'
      },
      timeout: 15000,
    });

    // 检查API响应
    const newsItems: any[] = [];
    
    if (response.data && response.data.data && response.data.data.list) {
      // 解析API响应的JSON数据
      const newsData = response.data.data.list.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        const content = item.title || item.content || '无内容';
        const timeText = new Date(item.created_at * 1000).toLocaleString('zh-CN');
        // 生成符合PostgreSQL integer范围的唯一ID
        const newsId = generateUniqueId(index, 'marsbit');
        const fullLink = item.url || `https://news.marsbit.co/flash/${item.id}`;
        
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
    } else {
      // 如果无法从API获取实时数据，则返回空结果
      console.log('无法通过火星财经API获取实时数据');
    }

    console.log(`成功从火星财经获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error('从火星财经获取快讯失败:', error);
    console.log('无法获取火星财经实时快讯，返回空数组');
    // 不再使用模拟数据，直接返回空数组
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
    const newMessages = allNews.filter(news => !existingMessageIds.has(String(news.messageId)));
    
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