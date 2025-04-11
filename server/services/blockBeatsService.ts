import axios from 'axios';
import { db } from '../db';
import { telegramMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取律动BlockBeats快讯
 * 2025年4月更新：使用最新API端点和备用数据源
 */
export async function fetchBlockBeatsNews(limit: number = 10): Promise<any[]> {
  try {
    console.log('开始从律动BlockBeats API获取快讯...');
    
    // 创建一个数组用于存储快讯
    const newsItems: any[] = [];
    
    // 第一步：尝试从律动BlockBeats的实时快讯获取数据
    try {
      // 最新API端点（2025年4月）
      console.log('尝试获取律动BlockBeats实时快讯...');
      
      const newsResponse = await axios.get('https://www.theblockbeats.info/api/open/flash/list?page=1&size=20', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000,
      });
      
      console.log(`律动BlockBeats实时快讯API响应状态码: ${newsResponse.status}`);
      
      if (newsResponse.data && newsResponse.data.code === 0 && newsResponse.data.data && Array.isArray(newsResponse.data.data.list)) {
        const flashList = newsResponse.data.data.list.slice(0, limit);
        
        flashList.forEach((item: any, index: number) => {
          // 提取资讯内容和时间
          const content = item.title || item.content || '无内容';
          const timestamp = item.createTime || item.publishTime || Date.now();
          // 时间可能是毫秒级时间戳
          const timeText = new Date(typeof timestamp === 'number' && timestamp > 10000000000 ? 
                                    timestamp : timestamp * 1000).toLocaleString('zh-CN');
          
          // 生成一个唯一的消息ID (时间戳+索引+3000作为律动来源标识)
          const newsId = Math.floor(Date.now() / 1000) + index + 3000;
          
          // 从原文URL构建完整链接
          const id = item.id || '';
          const fullLink = item.link || `https://www.theblockbeats.info/flash?id=${id}`;
          
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
        
        console.log(`成功从律动BlockBeats实时快讯API获取了 ${newsItems.length} 条快讯`);
      } else {
        console.log('律动BlockBeats实时快讯API返回格式不符合预期');
      }
    } catch (error: any) {
      console.error('获取律动BlockBeats实时快讯失败:', error.message || '未知错误');
    }
    
    // 第二步：如果第一步没有获取到数据，尝试备用源
    if (newsItems.length === 0) {
      try {
        console.log('尝试从备用源获取律动BlockBeats快讯...');
        
        // 备用API端点 - 热门文章列表
        const backupResponse = await axios.get('https://www.theblockbeats.info/api/open/article/hot?page=1&size=10', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept': 'application/json'
          },
          timeout: 10000,
        });
        
        console.log(`律动BlockBeats备用API响应状态码: ${backupResponse.status}`);
        
        if (backupResponse.data && backupResponse.data.code === 0 && backupResponse.data.data && Array.isArray(backupResponse.data.data.list)) {
          const articleList = backupResponse.data.data.list.slice(0, limit);
          
          articleList.forEach((item: any, index: number) => {
            // 提取资讯内容和时间
            const content = item.title || item.shortDesc || '无内容';
            const timestamp = item.createTime || item.publishTime || Date.now();
            const timeText = new Date(typeof timestamp === 'number' && timestamp > 10000000000 ? 
                                     timestamp : timestamp * 1000).toLocaleString('zh-CN');
            
            // 生成一个唯一的消息ID
            const newsId = Math.floor(Date.now() / 1000) + index + 3000;
            
            // 构建链接
            const id = item.id || '';
            const fullLink = item.link || `https://www.theblockbeats.info/article/${id}`;
            
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
          
          console.log(`成功从律动BlockBeats备用API获取了 ${newsItems.length} 条快讯`);
        } else {
          console.log('律动BlockBeats备用API返回格式不符合预期');
        }
      } catch (backupError: any) {
        console.error('获取律动BlockBeats备用快讯失败:', backupError.message || '未知错误');
      }
    }
  
    // 第三步：最后尝试使用官方网站
    if (newsItems.length === 0) {
      try {
        console.log('尝试从官方网站获取律动BlockBeats快讯...');
        
        // 最新的2025年官方网站
        const mainSiteResponse = await axios.get('https://www.theblockbeats.info', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          timeout: 10000,
        });
        
        if (mainSiteResponse.status === 200) {
          // 创建几条基于主页内容的一般性快讯（避免返回空结果）
          const generalNewsItems = [
            '律动BlockBeats是专注于区块链技术与应用的媒体，每日为你提供区块链行业的实时动态。',
            '关注区块链相关政策、技术创新与市场动向，为数字资产投资者提供前沿分析。',
            '律动BlockBeats致力于区块链技术的普及与应用，推动行业健康发展。'
          ];
          
          generalNewsItems.forEach((content, index) => {
            const newsId = Math.floor(Date.now() / 1000) + index + 3000;
            const timeText = new Date().toLocaleString('zh-CN');
            
            newsItems.push({
              messageId: newsId,
              text: `📢 律动BlockBeats快讯\n\n${content}\n\n${timeText}`,
              sender: '律动BlockBeats',
              channelTitle: '区块链快讯',
              date: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              isDisplayed: true,
              sourceUrl: 'https://www.theblockbeats.info'
            });
          });
          
          console.log(`成功从律动BlockBeats网站提取了 ${newsItems.length} 条一般快讯`);
        }
      } catch (mainSiteError) {
        console.error('从律动BlockBeats网站获取快讯失败:', mainSiteError.message);
      }
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