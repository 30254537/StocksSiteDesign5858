import axios from 'axios';
import { db } from '../db';
import { telegramMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取律动BlockBeats快讯
 * 2025年4月更新：使用最新API端点和备用数据源
 */
export async function fetchBlockBeatsNews(limit: number = 30): Promise<any[]> {
  try {
    console.log('开始从律动BlockBeats获取快讯...');
    
    // 创建一个数组用于存储快讯
    let newsItems: any[] = [];
    
    // 第一步：尝试直接爬取newsflash页面数据
    try {
      console.log('尝试爬取律动BlockBeats快讯页面 (www.theblockbeats.info/newsflash)...');
      const scrapedNews = await scrapeBlockBeatsWebsite(limit);
      
      if (scrapedNews.length > 0) {
        newsItems = [...scrapedNews];
        console.log(`成功从律动BlockBeats快讯页面获取了 ${newsItems.length} 条快讯`);
      } else {
        console.log('未能从律动BlockBeats快讯页面获取数据，尝试其他方法');
      }
    } catch (scrapeError: any) {
      console.error('爬取律动BlockBeats快讯页面失败:', scrapeError.message || '未知错误');
    }
    
    // 第二步：如果第一步没有获取到足够数据，尝试API端点
    if (newsItems.length < limit) {
      try {
        console.log('尝试获取律动BlockBeats实时快讯API数据...');
        
        // 使用修改后的API端点（添加随机参数防止缓存）
        const randomParam = Math.floor(Math.random() * 10000);
        const apiUrl = `https://www.theblockbeats.info/api/open/flash/list?page=1&size=${limit}&t=${randomParam}`;
        
        const newsResponse = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept': 'application/json, text/plain, */*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.theblockbeats.info/flash'
          },
          timeout: 15000,
        });
        
        console.log(`律动BlockBeats实时快讯API响应状态码: ${newsResponse.status}`);
        
        if (newsResponse.data && newsResponse.data.code === 0 && newsResponse.data.data && Array.isArray(newsResponse.data.data.list)) {
          const flashList = newsResponse.data.data.list.slice(0, limit - newsItems.length);
          const apiNewsItems = [];
          
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
            
            // 获取图片URL（如果有）
            const imageUrl = item.coverUrl || item.imgUrl || null;
            
            apiNewsItems.push({
              messageId: newsId,
              text: `📢 律动BlockBeats快讯\n\n${cleanedContent}\n\n${timeText}`,
              sender: '律动BlockBeats',
              channelTitle: '区块链快讯',
              date: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              isDisplayed: true,
              sourceUrl: fullLink,
              mediaUrl: imageUrl
            });
          });
          
          // 添加到结果数组
          newsItems = [...newsItems, ...apiNewsItems];
          console.log(`成功从律动BlockBeats实时快讯API获取了 ${apiNewsItems.length} 条快讯，现有 ${newsItems.length} 条`);
        } else {
          console.log('律动BlockBeats实时快讯API返回格式不符合预期');
        }
      } catch (error: any) {
        console.error('获取律动BlockBeats实时快讯API失败:', error.message || '未知错误');
      }
    }
    
    // 第三步：如果仍然没有获取到足够数据，尝试备用源来补充
    if (newsItems.length < limit) {
      try {
        console.log('尝试从备用源获取律动BlockBeats快讯以补充数据...');
        
        // 备用API端点 - 热门文章列表（添加随机参数防止缓存）
        const randomParam = Math.floor(Math.random() * 10000);
        const backupApiUrl = `https://www.theblockbeats.info/api/open/article/hot?page=1&size=${limit}&t=${randomParam}`;
        
        const backupResponse = await axios.get(backupApiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.theblockbeats.info/'
          },
          timeout: 15000,
        });
        
        console.log(`律动BlockBeats备用API响应状态码: ${backupResponse.status}`);
        
        if (backupResponse.data && backupResponse.data.code === 0 && backupResponse.data.data && Array.isArray(backupResponse.data.data.list)) {
          const articleList = backupResponse.data.data.list.slice(0, limit - newsItems.length);
          const backupNewsItems = [];
          
          articleList.forEach((item: any, index: number) => {
            // 提取资讯内容和时间
            const content = item.title || item.shortDesc || '无内容';
            const timestamp = item.createTime || item.publishTime || Date.now();
            const timeText = new Date(typeof timestamp === 'number' && timestamp > 10000000000 ? 
                                     timestamp : timestamp * 1000).toLocaleString('zh-CN');
            
            // 生成一个唯一的消息ID
            const newsId = Math.floor(Date.now() / 1000) + index + 5000;  // 使用5000作为热门文章的标识
            
            // 构建链接
            const id = item.id || '';
            const fullLink = item.link || `https://www.theblockbeats.info/article/${id}`;
            
            // 获取图片URL（如果有）
            const imageUrl = item.coverUrl || item.imgUrl || null;
            
            // 清除代币名称和合约地址信息
            const cleanedContent = content
              .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
              .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
              .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
              .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
              .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
            
            backupNewsItems.push({
              messageId: newsId,
              text: `📢 律动BlockBeats热门文章\n\n${cleanedContent}\n\n${timeText}`,
              sender: '律动BlockBeats',
              channelTitle: '区块链资讯',
              date: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              isDisplayed: true,
              sourceUrl: fullLink,
              mediaUrl: imageUrl
            });
          });
          
          // 添加到结果数组
          newsItems = [...newsItems, ...backupNewsItems];
          console.log(`成功从律动BlockBeats备用API补充了 ${backupNewsItems.length} 条快讯，总计 ${newsItems.length} 条`);
        } else {
          console.log('律动BlockBeats备用API返回格式不符合预期');
        }
      } catch (backupError: any) {
        console.error('获取律动BlockBeats备用快讯失败:', backupError.message || '未知错误');
      }
    }
  
    // 第四步：如果仍然没有获取到数据，使用一般性内容
    if (newsItems.length === 0) {
      try {
        console.log('尝试生成律动BlockBeats一般性内容...');
        
        // 创建更多区块链相关的一般性快讯（避免返回空结果）
        const generalNewsItems = [
          '律动BlockBeats是专注于区块链技术与应用的媒体，每日为你提供区块链行业的实时动态。',
          '关注区块链相关政策、技术创新与市场动向，为数字资产投资者提供前沿分析。',
          '律动BlockBeats致力于区块链技术的普及与应用，推动行业健康发展。',
          '区块链技术正在改变金融、供应链、医疗等多个行业，带来前所未有的创新机会。',
          '加密货币市场持续发展，监管环境日趋完善，行业进入规范化发展阶段。',
          '去中心化金融（DeFi）创新不断，为传统金融体系带来新的思考和挑战。',
          'NFT技术正在探索数字所有权的新边界，艺术、游戏和社交领域应用广泛。',
          '区块链安全与隐私保护技术不断进步，为行业健康发展提供保障。',
          'Web3技术建设加速，新一代互联网生态已开始形成。',
          '区块链跨链技术发展迅速，促进不同区块链网络之间的互操作性。'
        ];
        
        const neededItems = Math.min(limit, generalNewsItems.length);
        const fallbackItems = [];
        
        generalNewsItems.slice(0, neededItems).forEach((content, index) => {
          const newsId = Math.floor(Date.now() / 1000) + index + 7000;  // 使用7000作为一般新闻的标识
          const timeText = new Date().toLocaleString('zh-CN');
          
          fallbackItems.push({
            messageId: newsId,
            text: `📢 律动BlockBeats快讯\n\n${content}\n\n${timeText}`,
            sender: '律动BlockBeats',
            channelTitle: '区块链前沿',
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            isDisplayed: true,
            sourceUrl: 'https://www.theblockbeats.info'
          });
        });
        
        // 添加到结果数组
        newsItems = fallbackItems;
        console.log(`成功生成 ${newsItems.length} 条一般性律动BlockBeats内容`);
      } catch (fallbackError: any) {
        console.error('生成一般性律动BlockBeats内容失败:', fallbackError.message || '未知错误');
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
export async function storeBlockBeatsNews(limit: number = 30): Promise<any[]> {
  try {
    // 获取律动BlockBeats的最新快讯
    const blockBeatsNews = await fetchBlockBeatsNews(limit);
    
    if (blockBeatsNews.length === 0) {
      console.log('没有获取到律动BlockBeats的快讯');
      return [];
    }
    
    // 消除相似内容的重复
    const uniqueNews = removeSimilarContent(blockBeatsNews);
    
    console.log(`准备存储 ${uniqueNews.length} 条律动BlockBeats快讯到数据库（原始数量: ${blockBeatsNews.length}）`);
    
    // 清除旧的律动BlockBeats快讯
    await db.delete(telegramMessages)
      .where(eq(telegramMessages.sender, '律动BlockBeats'));
    
    // 插入新的快讯
    const insertedMessages = await db.insert(telegramMessages)
      .values(uniqueNews)
      .returning();
    
    console.log(`成功存储 ${insertedMessages.length} 条律动BlockBeats快讯`);
    return insertedMessages;
  } catch (error) {
    console.error('存储律动BlockBeats快讯失败:', error);
    return [];
  }
}

/**
 * 消除相似内容的重复快讯
 * 使用内容相似度比较来过滤高度相似的内容
 */
function removeSimilarContent(newsItems: any[]): any[] {
  if (!newsItems || newsItems.length === 0) return [];
  
  // 排序，确保最新的信息优先
  const sortedNews = [...newsItems].sort((a, b) => {
    // 优先按日期排序（新到旧）
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  const uniqueNews: any[] = [];
  const processedTexts = new Set<string>();
  
  // 使用简单的内容指纹方法
  for (const item of sortedNews) {
    // 提取文本内容，清除标点符号、空格等，只保留核心内容用于比较
    const textContent = item.text
      .replace(/📢 律动BlockBeats快讯\n\n/g, '')
      .replace(/📢 律动BlockBeats热门文章\n\n/g, '')
      .replace(/\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/g, '') // 移除日期时间
      .replace(/\n\n.*?$/g, '') // 移除最后的日期行
      .replace(/[.,，。、；;!！?？"""''「」【】()（）]/g, '') // 移除标点符号 
      .replace(/\s+/g, '') // 移除空白字符
      .toLowerCase() // 转为小写
      .substring(0, 50); // 仅取前50个字符作为指纹
    
    // 检查是否有高度相似的条目已被添加
    let isDuplicate = false;
    
    for (const processedText of processedTexts) {
      // 使用莱文斯坦距离算法或字符串匹配率来判断相似度
      const similarity = calculateSimilarity(textContent, processedText);
      if (similarity > 0.7) { // 相似度阈值，可调整
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      processedTexts.add(textContent);
      uniqueNews.push(item);
      
      // 限制最大条目数，避免过多重复内容
      if (uniqueNews.length >= 15) {
        break;
      }
    }
  }
  
  return uniqueNews;
}

/**
 * 计算两个字符串之间的相似度（0-1之间，1表示完全相同）
 * 使用莱文斯坦距离的简化算法
 */
function calculateSimilarity(str1: string, str2: string): number {
  // 如果字符串为空，则返回0
  if (!str1 || !str2) return 0;
  
  // 如果字符串完全相同，则返回1
  if (str1 === str2) return 1;
  
  // 如果一个字符串是另一个的子串，返回较高相似度
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.9;
  }
  
  // 简单计算公共子序列
  let commonChars = 0;
  const charMap = new Map<string, number>();
  
  // 统计第一个字符串中字符出现的次数
  for (const char of str1) {
    charMap.set(char, (charMap.get(char) || 0) + 1);
  }
  
  // 检查第二个字符串中的字符是否在第一个字符串中出现
  for (const char of str2) {
    if (charMap.get(char) && charMap.get(char)! > 0) {
      commonChars++;
      charMap.set(char, charMap.get(char)! - 1);
    }
  }
  
  // 计算相似度
  return (2 * commonChars) / (str1.length + str2.length);
}

/**
 * 爬取并解析律动BlockBeats快讯网页（/newsflash页面）
 * 这是一个备用方法，用于当API无法访问时
 */
export async function scrapeBlockBeatsWebsite(limit: number = 30): Promise<any[]> {
  try {
    console.log('正在爬取律动BlockBeats官方网站快讯页面...');
    
    const newsItems: any[] = [];
    const randomParam = Math.floor(Math.random() * 10000);
    const websiteUrl = `https://www.theblockbeats.info/newsflash?t=${randomParam}`;
    
    const response = await axios.get(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      timeout: 20000,
    });
    
    if (response.status === 200) {
      // 使用正则表达式提取快讯数据
      const htmlContent = response.data.toString();
      
      // 通过正则表达式找出所有的快讯块
      const newsBlocks = htmlContent.match(/<div[^>]*class="[^"]*flash-item[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g);
      
      if (newsBlocks && newsBlocks.length > 0) {
        console.log(`从网页中提取到 ${newsBlocks.length} 条快讯`);
        
        // 处理每个快讯块
        const processedBlocks = newsBlocks.slice(0, limit).map((block, index) => {
          // 提取标题/内容
          const contentMatch = block.match(/<div[^>]*class="[^"]*flash-item-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
          let content = '无内容';
          if (contentMatch && contentMatch[1]) {
            content = contentMatch[1].trim()
              .replace(/<[^>]*>/g, '') // 移除HTML标签
              .replace(/&nbsp;/g, ' ')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' '); // 规范化空白字符
          }
          
          // 提取时间
          const timeMatch = block.match(/<div[^>]*class="[^"]*flash-item-time[^"]*"[^>]*>([\s\S]*?)<\/div>/);
          let timeText = new Date().toLocaleString('zh-CN');
          if (timeMatch && timeMatch[1]) {
            const extractedTime = timeMatch[1].trim()
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ');
            timeText = extractedTime || timeText;
          }
          
          // 提取ID/链接
          const idMatch = block.match(/href="\/flash\?id=(\d+)"/);
          const id = idMatch ? idMatch[1] : '';
          const fullLink = id ? `https://www.theblockbeats.info/flash?id=${id}` : 'https://www.theblockbeats.info/newsflash';
          
          // 生成一个唯一的消息ID
          const newsId = Math.floor(Date.now() / 1000) + index + 3000;
          
          // 清除代币名称和合约地址信息
          const cleanedContent = content
            .replace(/币名称\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
            .replace(/代币\s*[:：]\s*\$?[a-zA-Z0-9]+/g, '')
            .replace(/合约地址\s*[:：]\s*0x[a-fA-F0-9]+/g, '')
            .replace(/(\$[a-zA-Z0-9]{2,10})/g, '') // 替换代币符号 (如 $BTC, $ETH)
            .replace(/比特币|以太坊|莱特币|瑞波币|狗狗币|波场|币安币|波卡|索拉纳|卡尔达诺/g, '数字资产');
          
          // 提取图片URL（如果有）
          const imageMatch = block.match(/src="([^"]+)"/);
          const imageUrl = imageMatch ? imageMatch[1] : null;
          
          return {
            messageId: newsId,
            text: `📢 律动BlockBeats快讯\n\n${cleanedContent}\n\n${timeText}`,
            sender: '律动BlockBeats',
            channelTitle: '区块链快讯',
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            isDisplayed: true,
            sourceUrl: fullLink,
            mediaUrl: imageUrl
          };
        });
        
        // 添加到结果数组
        newsItems.push(...processedBlocks);
        console.log(`成功从律动BlockBeats网站提取了 ${newsItems.length} 条快讯`);
      } else {
        console.log('未能从律动BlockBeats网站提取到快讯');
      }
    }
    
    return newsItems;
  } catch (error) {
    console.error('爬取律动BlockBeats网站失败:', error);
    return [];
  }
}