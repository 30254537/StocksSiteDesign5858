import axios from 'axios';
import { InsertCryptoNews } from '@shared/schema';
import * as cheerio from 'cheerio';

/**
 * 从CoinDesk获取最新的加密货币新闻
 */
export async function fetchCoinDeskNews(): Promise<InsertCryptoNews[]> {
  try {
    // 获取首页内容
    const response = await axios.get('https://www.coindesk.com/');
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 处理头条新闻
    $('.featured-leaderboard article').each((_, element) => {
      const title = $(element).find('h5').text().trim();
      const link = $(element).find('a').attr('href');
      const imageUrl = $(element).find('img').attr('src') || '';
      
      if (title && link) {
        articles.push({
          title,
          content: title, // 使用标题作为内容的摘要
          source: 'CoinDesk',
          sourceUrl: link.startsWith('http') ? link : `https://www.coindesk.com${link}`,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    // 处理其他新闻文章
    $('.article-cardstyles__AcTitle-q1x8lc-1').each((_, element) => {
      const title = $(element).text().trim();
      const articleCard = $(element).closest('article');
      const link = articleCard.find('a').attr('href');
      const imageUrl = articleCard.find('img').attr('src') || '';
      
      if (title && link) {
        articles.push({
          title,
          content: title, // 使用标题作为内容的摘要
          source: 'CoinDesk',
          sourceUrl: link.startsWith('http') ? link : `https://www.coindesk.com${link}`,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    return articles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取CoinDesk新闻失败:', error);
    return [];
  }
}

/**
 * 从CoinTelegraph获取最新的加密货币新闻
 */
export async function fetchCoinTelegraphNews(): Promise<InsertCryptoNews[]> {
  try {
    const response = await axios.get('https://cointelegraph.com/');
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 处理所有新闻文章
    $('.post-card-inline').each((_, element) => {
      const title = $(element).find('.post-card-inline__title').text().trim();
      const link = $(element).find('a').attr('href');
      const imageUrl = $(element).find('img').attr('src') || '';
      const content = $(element).find('.post-card-inline__text').text().trim();
      
      if (title && link) {
        articles.push({
          title,
          content: content || title,
          source: 'CoinTelegraph',
          sourceUrl: link.startsWith('http') ? link : `https://cointelegraph.com${link}`,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    return articles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取CoinTelegraph新闻失败:', error);
    return [];
  }
}

/**
 * 从TheBlock获取最新的加密货币新闻
 */
export async function fetchTheBlockNews(): Promise<InsertCryptoNews[]> {
  try {
    const response = await axios.get('https://www.theblock.co/latest');
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 处理所有新闻文章
    $('.post-card').each((_, element) => {
      const title = $(element).find('.post-card__title').text().trim();
      const link = $(element).find('a').attr('href');
      const imageUrl = $(element).find('img').attr('src') || '';
      
      if (title && link) {
        articles.push({
          title,
          content: title, // 使用标题作为内容的摘要
          source: 'TheBlock',
          sourceUrl: link.startsWith('http') ? link : `https://www.theblock.co${link}`,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    return articles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取TheBlock新闻失败:', error);
    return [];
  }
}

/**
 * 从CryptoSlate获取最新的加密货币新闻
 */
export async function fetchCryptoSlateNews(): Promise<InsertCryptoNews[]> {
  try {
    const response = await axios.get('https://cryptoslate.com/news/');
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 处理所有新闻文章
    $('.wp-block-latest-posts__list li').each((_, element) => {
      const title = $(element).find('a').text().trim();
      const link = $(element).find('a').attr('href');
      const imageEl = $(element).find('img');
      const imageUrl = imageEl.attr('src') || imageEl.attr('data-src') || '';
      
      if (title && link) {
        articles.push({
          title,
          content: title, // 使用标题作为内容的摘要
          source: 'CryptoSlate',
          sourceUrl: link || '',
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    return articles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取CryptoSlate新闻失败:', error);
    return [];
  }
}

/**
 * 从8BTC获取最新的加密货币新闻（中文）
 */
export async function fetch8BTCNews(): Promise<InsertCryptoNews[]> {
  try {
    const response = await axios.get('https://www.8btc.com/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 处理所有新闻文章
    $('.article-item').each((_, element) => {
      const title = $(element).find('.article-item__title').text().trim();
      const link = $(element).find('a').attr('href');
      const imageUrl = $(element).find('img').attr('src') || '';
      const content = $(element).find('.article-item__content').text().trim();
      
      if (title && link) {
        articles.push({
          title,
          content: content || title,
          source: '8BTC',
          sourceUrl: link?.startsWith('http') ? link : `https://www.8btc.com${link}`,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    return articles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取8BTC新闻失败:', error);
    return [];
  }
}

/**
 * 从多个网站抓取加密货币新闻
 */
export async function scrapeAllNews(): Promise<InsertCryptoNews[]> {
  try {
    const allPromises = [
      fetchCoinDeskNews(),
      fetchCoinTelegraphNews(),
      fetchTheBlockNews(),
      fetchCryptoSlateNews(),
      fetch8BTCNews()
    ];
    
    const results = await Promise.allSettled(allPromises);
    
    const allNews: InsertCryptoNews[] = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    });
    
    return allNews;
  } catch (error) {
    console.error('抓取所有加密货币新闻失败:', error);
    return [];
  }
}