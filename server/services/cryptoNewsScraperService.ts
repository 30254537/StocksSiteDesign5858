import axios from 'axios';
import { InsertCryptoNews } from '@shared/schema';
import * as cheerio from 'cheerio';

/**
 * 从CoinDesk获取最新的加密货币新闻
 */
export async function fetchCoinDeskNews(): Promise<InsertCryptoNews[]> {
  try {
    // 获取首页内容
    const response = await axios.get('https://www.coindesk.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000 // 10秒超时
    });
    
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 尝试通用选择器抓取所有文章
    $('article, .card, .article-card, .story').each((_, element) => {
      // 尝试多种可能的标题选择器
      const titleSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', '.headline', '.title', 
        '.article-title', '.card-title'
      ];
      
      let title = '';
      
      // 尝试每个标题选择器直到找到一个有内容的
      for (const selector of titleSelectors) {
        const titleElement = $(element).find(selector);
        if (titleElement.length && titleElement.text().trim()) {
          title = titleElement.text().trim();
          break;
        }
      }
      
      // 如果没有找到标题，尝试自身
      if (!title && $(element).text().trim()) {
        title = $(element).text().trim();
      }
      
      // 尝试找到链接
      let link = '';
      const linkSelectors = ['a', 'a.link', '.headline a', '.title a'];
      
      for (const selector of linkSelectors) {
        const linkElement = $(element).find(selector).first();
        if (linkElement.length && linkElement.attr('href')) {
          link = linkElement.attr('href') as string;
          break;
        }
      }
      
      // 如果没有找到链接，尝试元素自身是否为链接
      if (!link && $(element).is('a') && $(element).attr('href')) {
        link = $(element).attr('href') as string;
      }
      
      // 尝试多种可能的图片选择器
      let imageUrl = '';
      const imageSelectors = ['img', '.image img', '.card-image img', '.media img'];
      
      for (const selector of imageSelectors) {
        const imgElement = $(element).find(selector).first();
        if (imgElement.length) {
          imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
          if (imageUrl) break;
        }
      }
      
      // 如果找到了标题和链接
      if (title && link) {
        // 确保链接是绝对URL
        const fullLink = link.startsWith('http') ? link : (
          link.startsWith('/') ? `https://www.coindesk.com${link}` : `https://www.coindesk.com/${link}`
        );
        
        // 限制标题长度为合理范围
        if (title.length > 200) {
          title = title.substring(0, 197) + '...';
        }
        
        articles.push({
          title,
          content: title, // 使用标题作为内容摘要
          source: 'CoinDesk',
          sourceUrl: fullLink,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    // 如果上面的通用抓取没有找到文章，尝试特定的CoinDesk选择器
    if (articles.length === 0) {
      // 尝试头条新闻
      $('.featured-leaderboard article, .featured article, .headline, .hero article').each((_, element) => {
        const title = $(element).find('h1, h2, h3, h4, h5').text().trim();
        const link = $(element).find('a').attr('href');
        const imageUrl = $(element).find('img').attr('src') || $(element).find('img').attr('data-src') || '';
        
        if (title && link) {
          articles.push({
            title,
            content: title, // 使用标题作为内容的摘要
            source: 'CoinDesk',
            sourceUrl: link.startsWith('http') ? link : `https://www.coindesk.com${link}`,
            imageUrl,
            category: 'general',
            isHighlighted: 1, // 头条新闻标记为突出显示
            publishedAt: new Date()
          });
        }
      });

      // 尝试其他新闻文章
      $('.article-cardstyles__AcTitle-q1x8lc-1, .article-card, .story-card, .card-title').each((_, element) => {
        const title = $(element).text().trim();
        const articleCard = $(element).closest('article, .card, .story');
        const link = articleCard.find('a').attr('href') || $(element).closest('a').attr('href');
        const imageUrl = articleCard.find('img').attr('src') || articleCard.find('img').attr('data-src') || '';
        
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
    }

    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    return uniqueArticles.slice(0, 10); // 限制数量
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
    const response = await axios.get('https://cointelegraph.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000 // 10秒超时
    });
    
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 使用更通用的选择器
    $('.post-card, article, .article-card, .posts__item, .posts-listing__item').each((_, element) => {
      const titleElement = $(element).find('.post-card-inline__title, .post-card__title, h1, h2, h3, .title, .headline');
      const title = titleElement.text().trim();
      
      const linkElement = $(element).find('a').first();
      const link = linkElement.attr('href');
      
      const imageElement = $(element).find('img');
      const imageUrl = imageElement.attr('src') || imageElement.attr('data-src') || imageElement.attr('data-lazy-src') || '';
      
      const contentElement = $(element).find('.post-card-inline__text, .post-card__text, .excerpt, .summary, .description');
      const content = contentElement.text().trim();
      
      if (title && link) {
        const fullLink = link.startsWith('http') ? link : (
          link.startsWith('/') ? `https://cointelegraph.com${link}` : `https://cointelegraph.com/${link}`
        );
        
        articles.push({
          title,
          content: content || title,
          source: 'CoinTelegraph',
          sourceUrl: fullLink,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    // 如果没有找到文章，尝试特定的选择器
    if (articles.length === 0) {
      $('.post-card-inline, .article, .news-teaser').each((_, element) => {
        const title = $(element).find('.post-card-inline__title, h2, h3, h4, .title').text().trim();
        const link = $(element).find('a').attr('href');
        const imageUrl = $(element).find('img').attr('src') || $(element).find('img').attr('data-src') || '';
        const content = $(element).find('.post-card-inline__text, .excerpt, .teaser').text().trim();
        
        if (title && link) {
          const fullLink = link.startsWith('http') ? link : (
            link.startsWith('/') ? `https://cointelegraph.com${link}` : `https://cointelegraph.com/${link}`
          );
          
          articles.push({
            title,
            content: content || title,
            source: 'CoinTelegraph',
            sourceUrl: fullLink,
            imageUrl,
            category: 'general',
            isHighlighted: 0,
            publishedAt: new Date()
          });
        }
      });
    }

    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    return uniqueArticles.slice(0, 10); // 限制数量
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
    const response = await axios.get('https://www.theblock.co/latest', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000 // 10秒超时
    });
    
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 使用更通用的选择器查找文章
    $('article, .post, .card, .entry, .item').each((_, element) => {
      // 尝试多种可能的标题选择器
      const titleSelectors = [
        'h1', 'h2', 'h3', 'h4', '.post-card__title', '.title', '.headline', 
        '.entry-title', '.post-title'
      ];
      
      let title = '';
      
      for (const selector of titleSelectors) {
        const titleElement = $(element).find(selector);
        if (titleElement.length && titleElement.text().trim()) {
          title = titleElement.text().trim();
          break;
        }
      }
      
      // 尝试找到链接
      let link = '';
      
      // 首先检查标题中的链接
      for (const selector of titleSelectors) {
        const titleElement = $(element).find(selector);
        if (titleElement.length) {
          const titleLink = titleElement.find('a').attr('href');
          if (titleLink) {
            link = titleLink;
            break;
          }
        }
      }
      
      // 如果标题中没有链接，尝试元素中的链接
      if (!link) {
        link = $(element).find('a').attr('href') || '';
      }
      
      // 尝试找到图片
      const imageUrl = $(element).find('img').attr('src') || 
                       $(element).find('img').attr('data-src') || 
                       $(element).find('img').attr('data-lazy-src') || '';
      
      if (title && link) {
        const fullLink = link.startsWith('http') ? link : (
          link.startsWith('/') ? `https://www.theblock.co${link}` : `https://www.theblock.co/${link}`
        );
        
        articles.push({
          title,
          content: title, // 使用标题作为内容的摘要
          source: 'TheBlock',
          sourceUrl: fullLink,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });
    
    // 如果通用选择器没有找到文章，尝试特定的选择器
    if (articles.length === 0) {
      $('.post-card, .news-item, .article').each((_, element) => {
        const title = $(element).find('.post-card__title, h2, h3, .title').text().trim();
        const link = $(element).find('a').attr('href');
        const imageUrl = $(element).find('img').attr('src') || $(element).find('img').attr('data-src') || '';
        
        if (title && link) {
          const fullLink = link.startsWith('http') ? link : (
            link.startsWith('/') ? `https://www.theblock.co${link}` : `https://www.theblock.co/${link}`
          );
          
          articles.push({
            title,
            content: title,
            source: 'TheBlock',
            sourceUrl: fullLink,
            imageUrl,
            category: 'general',
            isHighlighted: 0,
            publishedAt: new Date()
          });
        }
      });
    }

    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    return uniqueArticles.slice(0, 10); // 限制数量
  } catch (error) {
    console.error('获取TheBlock新闻失败:', error);
    return [];
  }
}

// CryptoSlate已被移除

/**
 * 从8BTC获取最新的加密货币新闻（中文）
 */
export async function fetch8BTCNews(): Promise<InsertCryptoNews[]> {
  try {
    // 尝试获取8BTC首页内容，它包含更多最新新闻
    const response = await axios.get('https://www.8btc.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 10000 // 10秒超时
    });
    
    const $ = cheerio.load(response.data);
    const articles: InsertCryptoNews[] = [];

    // 选择更通用的选择器来匹配文章元素
    $('article, .post-item, .article-item, .news-item, .card, .media').each((_, element) => {
      // 尝试多种可能的标题选择器
      const titleSelectors = [
        'h2', 'h3', 'h4', '.title', '.post-title', '.article-title', 
        '.article-item__title', '.news-title', '.card-title'
      ];
      
      let title = '';
      
      // 尝试每个标题选择器直到找到一个有内容的
      for (const selector of titleSelectors) {
        const titleElement = $(element).find(selector);
        if (titleElement.length && titleElement.text().trim()) {
          title = titleElement.text().trim();
          break;
        }
      }
      
      // 尝试找到链接
      const linkElement = $(element).find('a').first();
      const link = linkElement.attr('href');
      
      // 尝试多种可能的图片选择器
      const imgElement = $(element).find('img').first();
      const imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
      
      // 尝试多种可能的内容选择器
      const contentSelectors = [
        '.summary', '.excerpt', '.content', '.description', '.post-content', 
        '.article-content', '.article-item__content', '.text', '.card-text'
      ];
      
      let content = '';
      
      // 尝试每个内容选择器直到找到一个有内容的
      for (const selector of contentSelectors) {
        const contentElement = $(element).find(selector);
        if (contentElement.length && contentElement.text().trim()) {
          content = contentElement.text().trim();
          break;
        }
      }
      
      // 如果有标题和链接，则添加文章
      if (title && link) {
        // 确保链接是完整的URL
        const fullLink = link.startsWith('http') ? link : (
          link.startsWith('/') ? `https://www.8btc.com${link}` : `https://www.8btc.com/${link}`
        );
        
        articles.push({
          title,
          content: content || title, // 如果没有内容摘要，使用标题
          source: '8BTC',
          sourceUrl: fullLink,
          imageUrl,
          category: 'general',
          isHighlighted: 0,
          publishedAt: new Date()
        });
      }
    });

    // 如果没有找到文章，尝试新闻页面
    if (articles.length === 0) {
      const newsResponse = await axios.get('https://www.8btc.com/news', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        timeout: 10000
      });
      
      const $news = cheerio.load(newsResponse.data);
      
      $news('.article-item, .news-item, .post').each((_, element) => {
        const title = $news(element).find('.article-item__title, h2, h3, .title').text().trim();
        const link = $news(element).find('a').attr('href');
        const imageUrl = $news(element).find('img').attr('src') || $news(element).find('img').attr('data-src') || '';
        const content = $news(element).find('.article-item__content, .summary, .excerpt').text().trim();
        
        if (title && link) {
          const fullLink = link.startsWith('http') ? link : (
            link.startsWith('/') ? `https://www.8btc.com${link}` : `https://www.8btc.com/${link}`
          );
          
          articles.push({
            title,
            content: content || title,
            source: '8BTC',
            sourceUrl: fullLink,
            imageUrl,
            category: 'general',
            isHighlighted: 0,
            publishedAt: new Date()
          });
        }
      });
    }

    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    );

    return uniqueArticles.slice(0, 10); // 限制数量到10条
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
    // 独立尝试每个源，如果一个源失败，不影响其他源
    console.log('开始抓取加密货币新闻网站...');
    
    // 单独调用每个函数并捕获错误
    let coinDeskNews: InsertCryptoNews[] = [];
    try {
      coinDeskNews = await fetchCoinDeskNews();
      console.log(`成功从CoinDesk抓取了 ${coinDeskNews.length} 条新闻`);
    } catch (error) {
      console.error('从CoinDesk抓取新闻失败:', error);
    }
    
    let coinTelegraphNews: InsertCryptoNews[] = [];
    try {
      coinTelegraphNews = await fetchCoinTelegraphNews();
      console.log(`成功从CoinTelegraph抓取了 ${coinTelegraphNews.length} 条新闻`);
    } catch (error) {
      console.error('从CoinTelegraph抓取新闻失败:', error);
    }
    
    let theBlockNews: InsertCryptoNews[] = [];
    try {
      theBlockNews = await fetchTheBlockNews();
      console.log(`成功从TheBlock抓取了 ${theBlockNews.length} 条新闻`);
    } catch (error) {
      console.error('从TheBlock抓取新闻失败:', error);
    }
    
    let eightBTCNews: InsertCryptoNews[] = [];
    try {
      eightBTCNews = await fetch8BTCNews();
      console.log(`成功从8BTC抓取了 ${eightBTCNews.length} 条新闻`);
    } catch (error) {
      console.error('从8BTC抓取新闻失败:', error);
    }
    
    // 合并所有来源的新闻
    const allNews: InsertCryptoNews[] = [
      ...coinDeskNews, 
      ...coinTelegraphNews, 
      ...theBlockNews, 
      ...eightBTCNews
    ];
    
    console.log(`总共从网站抓取了 ${allNews.length} 条新闻`);
    return allNews;
  } catch (error) {
    console.error('抓取所有加密货币新闻失败:', error);
    return [];
  }
}