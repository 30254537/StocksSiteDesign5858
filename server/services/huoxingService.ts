import axios from "axios";
import * as cheerio from "cheerio";
import { InsertCryptoNews } from "@shared/schema";

// 火星财经抓取服务
export async function fetchHuoxingNews(): Promise<InsertCryptoNews[]> {
  try {
    console.log("开始从火星财经获取快讯...");
    const response = await axios.get("https://www.huoxing24.com/news", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const newsItems: InsertCryptoNews[] = [];

    // 适配火星财经网站的DOM结构
    $('.list-item').each((index, element) => {
      if (index < 20) { // 只获取前20条
        const title = $(element).find('.item-title').text().trim();
        const content = $(element).find('.item-desc').text().trim();
        const timeElement = $(element).find('.item-time');
        const time = timeElement.text().trim();
        
        // 将中国时间转换为标准格式
        const publishedAt = new Date();
        
        if (time) {
          const timeParts = time.match(/(\d+):(\d+)/);
          if (timeParts) {
            publishedAt.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]));
          }
        }
        
        // 获取链接
        let sourceUrl = "https://www.huoxing24.com/news";
        const link = $(element).find('a').attr('href');
        if (link) {
          if (link.startsWith('http')) {
            sourceUrl = link;
          } else {
            sourceUrl = `https://www.huoxing24.com${link}`;
          }
        }
        
        if (title || content) { // 允许标题或内容至少有一个
          newsItems.push({
            title: title || content.substring(0, 30) + "...", // 如果没有标题，使用内容的前30个字符
            content: content || title,
            source: "火星财经",
            sourceUrl,
            publishedAt,
            category: "general"
          });
        }
      }
    });

    console.log(`从火星财经获取了 ${newsItems.length} 条快讯`);
    return newsItems;
  } catch (error) {
    console.error("从火星财经获取快讯失败:", error);
    return [];
  }
}