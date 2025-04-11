import axios from 'axios';
import { db } from '../db';
import { eq, desc, or, and } from 'drizzle-orm';
import { telegramMessages } from '@shared/schema';

// 使用API端点而不是直接爬取网页
// 金色财经API URL（实时数据）- 更新为更可靠的公开接口
const JINSE_API_URL = 'https://www.jinse.cn/spot/api/front/lives/list?page=1&limit=30&reading=false&flag=down';
// 火星财经API URL（实时数据）- 更新为更可靠的公开接口 
const MARSBIT_API_URL = 'https://www.marsbit.co/api/v3/frontend/search?channel_id=0&pn=1&ps=30';

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
    
    // 适配新版金色财经API格式
    if (response.data && response.data.data && Array.isArray(response.data.data.lives)) {
      // 解析API响应的JSON数据
      const newsData = response.data.data.lives.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        // 适配新API格式
        const content = item.content || item.summary || item.title || '无内容';
        // 确保时间戳存在
        const timestamp = item.addtime || item.created_at || Math.floor(Date.now() / 1000);
        const timeText = new Date(timestamp * 1000).toLocaleString('zh-CN');
        
        // 生成符合PostgreSQL integer范围的唯一ID
        const newsId = generateUniqueId(index, 'jinse');
        const itemId = item.id || index;
        const fullLink = item.link || item.url || `https://www.jinse.cn/lives/${itemId}`;
        
        // 清除代币名称和合约地址信息
        const cleanedContent = content
          .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
          .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
          .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
          
        newsItems.push({
          messageId: newsId,
          text: `🔔 金色财经快讯\n\n${cleanedContent}\n\n${timeText}`,
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
    
    if (response.data && response.data.data && Array.isArray(response.data.data.list)) {
      // 解析API响应的JSON数据
      const newsData = response.data.data.list.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        // 适配新版火星财经API格式
        const content = item.title || item.content || item.summary || '无内容';
        // 确保时间戳存在，默认为当前时间
        const timestamp = item.published_at || item.created_at || Math.floor(Date.now() / 1000);
        const timeText = new Date(timestamp * 1000).toLocaleString('zh-CN');
        
        // 生成符合PostgreSQL integer范围的唯一ID
        const newsId = generateUniqueId(index, 'marsbit');
        // 确保链接有效
        const itemId = item.id || index;
        const fullLink = item.url || item.link || `https://www.marsbit.co/article/${itemId}`;
        
        // 清除代币名称和合约地址信息
        const cleanedContent = content
          .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
          .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
          .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
          
        newsItems.push({
          messageId: newsId,
          text: `🔥 火星财经快讯\n\n${cleanedContent}\n\n${timeText}`,
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