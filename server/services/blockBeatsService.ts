import axios from "axios";
import * as cheerio from "cheerio";
import { InsertCryptoNews } from "@shared/schema";

// BlockBeats抓取服务
export async function fetchBlockBeatsNews(): Promise<InsertCryptoNews[]> {
  try {
    console.log("开始从BlockBeats获取快讯...");
    const response = await axios.get("https://www.theblockbeats.info/newsflash", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const newsItems: InsertCryptoNews[] = [];

    // 适配BlockBeats网站的DOM结构
    $('.newsflash-item').each((index, element) => {
      if (index < 20) { // 只获取前20条
        const title = $(element).find('.title').text().trim();
        const content = $(element).find('.desc').text().trim();
        const timeElem = $(element).find('.time');
        const time = timeElem.text().trim();
        
        // 将中国时间转换为标准格式
        const publishedAt = new Date();
        
        if (time) {
          const timeParts = time.match(/(\d+):(\d+)/);
          if (timeParts) {
            publishedAt.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]));
          }
        }
        
        // 构建链接
        const sourceUrl = `https://www.theblockbeats.info/newsflash`;
        
        if (title && content) {
          newsItems.push({
            title,
            content,
            source: "BlockBeats",
            sourceUrl,
            publishedAt,
            category: "general"
          });
        }
      }
    });

    console.log(`从BlockBeats获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error("从BlockBeats获取快讯失败:", error);
    return [];
  }
}