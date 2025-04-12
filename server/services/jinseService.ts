import axios from "axios";
import * as cheerio from "cheerio";
import { InsertCryptoNews } from "@shared/schema";

// 金色财经抓取服务
export async function fetchJinseNews(): Promise<InsertCryptoNews[]> {
  try {
    console.log("开始从金色财经API获取快讯...");
    const response = await axios.get("https://www.jinse.cn/newsflash", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const newsItems: InsertCryptoNews[] = [];

    // 适配金色财经网站的DOM结构
    $('.flash-item').each((index, element) => {
      if (index < 20) { // 只获取前20条
        const title = $(element).find('.content-title').text().trim();
        const content = $(element).find('.content-text').text().trim();
        const timeElement = $(element).find('.time');
        const time = timeElement.text().trim();
        
        // 将中国时间转换为标准格式
        const publishedAt = new Date();
        
        if (time) {
          const timeParts = time.match(/(\d+):(\d+)/);
          if (timeParts) {
            publishedAt.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]));
          }
        }
        
        // 获取文章ID并构建链接
        let sourceUrl = "https://www.jinse.cn/newsflash";
        const link = $(element).find('a').attr('href');
        if (link) {
          sourceUrl = `https://www.jinse.cn${link}`;
        }
        
        if (title || content) { // 允许标题或内容至少有一个
          newsItems.push({
            title: title || content.substring(0, 30) + "...", // 如果没有标题，使用内容的前30个字符
            content: content || title,
            source: "金色财经",
            sourceUrl,
            publishedAt,
            category: "general"
          });
        }
      }
    });

    console.log(`从金色财经获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error("从金色财经获取快讯失败:", error);
    return [];
  }
}