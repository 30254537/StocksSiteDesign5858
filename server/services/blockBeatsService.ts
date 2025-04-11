import axios from 'axios';
import { db } from '../db';
import { telegramMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取律动BlockBeats快讯
 * 使用RESTful API: https://github.com/BlockBeatsOfficial/RESTful-API
 */
export async function fetchBlockBeatsNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从律动BlockBeats API获取快讯...');
    
    // 使用律动BlockBeats的快讯API
    const response = await axios.get('https://www.theblockbeats.info/newsflash', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.theblockbeats.info/',
        'Origin': 'https://www.theblockbeats.info'
      },
      timeout: 15000,
    });

    // 记录请求信息
    console.log(`律动BlockBeats API响应状态码: ${response.status}`);

    // 检查响应是否包含正确的数据结构
    const newsItems: any[] = [];
    
    if (response.data && response.data.data && Array.isArray(response.data.data.list)) {
      // 解析API响应的JSON数据
      const newsData = response.data.data.list.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        // 提取资讯内容
        const content = item.title || item.content || '无内容';
        const timeText = new Date().toLocaleString('zh-CN'); // 使用当前时间作为默认
        
        // 生成一个唯一的消息ID (时间戳+索引+3000作为律动来源标识)
        const newsId = Math.floor(Date.now() / 1000) + index + 3000;
        
        // 从原文URL构建完整链接
        const fullLink = item.url || 'https://www.theblockbeats.info/newsflash';
        
        // 清除代币名称和合约地址信息
        const cleanedContent = content
          .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
          .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
          .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
        
        newsItems.push({
          messageId: newsId,
          text: `📢 律动BlockBeats快讯\n\n${cleanedContent}\n\n${timeText}`,
          sender: '律动BlockBeats',
          channelTitle: '区块链快讯',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isDisplayed: true,
          sourceUrl: fullLink
        });
      });
    } else if (response.data && response.data.data && response.data.data.flash_news) {
      // 备用解析方案，适应不同的API结构
      const newsData = response.data.data.flash_news.slice(0, limit);
      
      newsData.forEach((item: any, index: number) => {
        const content = item.title || item.content || item.desc || '无内容';
        const timeText = new Date().toLocaleString('zh-CN');
        const newsId = Math.floor(Date.now() / 1000) + index + 3000;
        const fullLink = item.url || 'https://www.theblockbeats.info/newsflash';
        
        // 清除代币名称和合约地址信息
        const cleanedContent = content
          .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
          .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
          .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
          .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
        
        newsItems.push({
          messageId: newsId,
          text: `📢 律动BlockBeats快讯\n\n${cleanedContent}\n\n${timeText}`,
          sender: '律动BlockBeats',
          channelTitle: '区块链快讯',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isDisplayed: true,
          sourceUrl: fullLink
        });
      });
    } else {
      // 无法识别的响应结构
      console.log('无法解析律动BlockBeats API响应:', response.data);
    }

    console.log(`成功从律动BlockBeats获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error('从律动BlockBeats获取快讯失败:', error);
    console.log('无法获取律动BlockBeats实时快讯，返回空数组');
    return [];
  }
}

/**
 * 存储律动BlockBeats快讯到数据库
 */
export async function storeBlockBeatsNews(limit: number = 10): Promise<any[]> {
  try {
    // 获取律动BlockBeats的最新快讯
    const blockBeatsNews = await fetchBlockBeatsNews(limit);
    
    if (blockBeatsNews.length === 0) {
      console.log('没有获取到律动BlockBeats的快讯');
      return [];
    }
    
    console.log(`准备存储 ${blockBeatsNews.length} 条律动BlockBeats快讯到数据库`);
    
    // 清除旧的律动BlockBeats快讯
    await db.delete(telegramMessages)
      .where(eq(telegramMessages.sender, '律动BlockBeats'));
    
    // 插入新的快讯
    const insertedMessages = await db.insert(telegramMessages)
      .values(blockBeatsNews)
      .returning();
    
    console.log(`成功存储 ${insertedMessages.length} 条律动BlockBeats快讯`);
    return insertedMessages;
  } catch (error) {
    console.error('存储律动BlockBeats快讯失败:', error);
    return [];
  }
}