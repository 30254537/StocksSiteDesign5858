import { storage } from '../storage';
import * as cron from 'node-cron';

/**
 * 推文翻译服务
 * 用于将英文推文翻译为中文
 */

// 常见加密货币词汇翻译映射
const cryptoTermMap: Record<string, string> = {
  // 加密货币
  "Bitcoin": "比特币",
  "BTC": "BTC",
  "Ethereum": "以太坊",
  "ETH": "ETH",
  "crypto": "加密货币",
  "cryptocurrency": "加密货币",
  "STONKS": "STONKS",
  "DEX": "DEX",
  
  // 技术词汇
  "blockchain": "区块链",
  "token": "代币",
  "tokens": "代币",
  "wallet": "钱包",
  "wallets": "钱包",
  "mining": "挖矿",
  "miners": "矿工",
  "staking": "质押",
  "NFT": "NFT",
  "DeFi": "DeFi",
  "smart contract": "智能合约",
  "decentralized": "去中心化",
  "centralized": "中心化",
  
  // 市场词汇
  "bull market": "牛市",
  "bear market": "熊市",
  "ATH": "历史新高",
  "dip": "下跌",
  "pump": "拉盘",
  "dump": "砸盘",
  "HODL": "长期持有",
  "liquidity": "流动性",
  "volume": "交易量",
  "market cap": "市值",
  "airdrop": "空投",
  
  // 常见短语
  "to the moon": "冲向月球",
  "buy the dip": "逢低买入",
  "diamond hands": "钻石手",
  "paper hands": "纸手",
  "gas fee": "燃料费",
  "rugpull": "跑路",
  "FUD": "恐惧、不确定和怀疑",
  "FOMO": "害怕错过",
};

// 常见短语的模板翻译
const phraseTemplates: Record<string, string> = {
  "launching new liquidity pools": "推出新的流动性池",
  "Check out the latest update": "查看最新更新",
  "surges to new heights": "飙升至新高度",
  "institutional adoption increases": "机构采用增加",
  "The future of finance is here": "金融的未来已经到来",
  "continues to grow": "持续增长",
  "leading the way": "引领潮流",
  "breaking soon": "即将突破",
  "just announced": "刚刚宣布",
  "huge milestone": "重要里程碑",
  "partnership with": "与...建立合作伙伴关系",
  "new all-time high": "创历史新高",
};

/**
 * 使用模板匹配方法翻译推文文本
 * @param text 需要翻译的英文文本
 * @returns 翻译后的中文文本
 */
export function translateTweetText(text: string): string {
  // 如果文本为空，返回空字符串
  if (!text) return '';
  
  // 如果文本已经包含中文字符，说明已经翻译过，直接返回
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return text;
  }
  
  let translatedText = text;
  
  // 1. 替换加密货币词汇
  Object.entries(cryptoTermMap).forEach(([enTerm, zhTerm]) => {
    // 使用正则表达式确保只匹配完整的单词
    const regex = new RegExp(`\\b${enTerm}\\b`, 'gi');
    translatedText = translatedText.replace(regex, zhTerm);
  });
  
  // 2. 替换短语模板
  Object.entries(phraseTemplates).forEach(([enPhrase, zhPhrase]) => {
    const regex = new RegExp(enPhrase, 'gi');
    translatedText = translatedText.replace(regex, zhPhrase);
  });
  
  // 3. 翻译一些基本语法结构
  translatedText = translatedText
    .replace(/\bwith\b/g, '与')
    .replace(/\band\b/g, '和')
    .replace(/\bfor\b/g, '为')
    .replace(/\bto\b/g, '到')
    .replace(/\bin\b/g, '在')
    .replace(/\bon\b/g, '在')
    .replace(/\bour\b/g, '我们的')
    .replace(/\byour\b/g, '你的')
    .replace(/\btheir\b/g, '他们的')
    .replace(/\bthis\b/g, '这个')
    .replace(/\bthat\b/g, '那个')
    .replace(/\bis\b/g, '是')
    .replace(/\bare\b/g, '是')
    .replace(/\bwas\b/g, '曾是')
    .replace(/\bwere\b/g, '曾是')
    .replace(/\bwill\b/g, '将会')
    .replace(/\bcan\b/g, '可以')
    .replace(/\bcould\b/g, '可能')
    .replace(/\bshould\b/g, '应该')
    .replace(/\bmust\b/g, '必须')
    .replace(/\bhave\b/g, '拥有')
    .replace(/\bhas\b/g, '拥有')
    .replace(/\bhad\b/g, '曾拥有')
    .replace(/\bnew\b/g, '新的')
    .replace(/\bold\b/g, '旧的')
    .replace(/\bgood\b/g, '好的')
    .replace(/\bbad\b/g, '坏的')
    .replace(/\bbig\b/g, '大的')
    .replace(/\bsmall\b/g, '小的')
    .replace(/\bmany\b/g, '许多')
    .replace(/\bfew\b/g, '几个')
    .replace(/\bmore\b/g, '更多')
    .replace(/\bless\b/g, '更少')
    .replace(/\bnow\b/g, '现在')
    .replace(/\bthen\b/g, '然后')
    .replace(/\bsoon\b/g, '很快')
    .replace(/\blater\b/g, '稍后')
    .replace(/\btoday\b/g, '今天')
    .replace(/\btomorrow\b/g, '明天')
    .replace(/\byesterday\b/g, '昨天');
    
  return translatedText;
}

/**
 * 翻译所有未翻译的推文
 * 仅翻译那些没有翻译文本的推文
 */
export async function translateAllUntranslatedTweets(): Promise<number> {
  try {
    // 获取所有推文
    const allTweets = await storage.getCryptoTweets();
    let translatedCount = 0;
    
    // 对每个没有翻译的推文进行翻译
    for (const tweet of allTweets) {
      if (!tweet.translatedText) {
        const translatedText = translateTweetText(tweet.text);
        
        // 如果翻译后的文本与原文不同，更新数据库
        if (translatedText !== tweet.text) {
          await storage.updateTweetTranslation(tweet.id, translatedText);
          translatedCount++;
        }
      }
    }
    
    console.log(`成功翻译了 ${translatedCount} 条推文`);
    return translatedCount;
  } catch (error) {
    console.error('翻译推文失败:', error);
    return 0;
  }
}

/**
 * 初始化推文翻译定时任务
 * @param cronExpression cron表达式，例如每4小时执行一次
 */
export function initTweetTranslationScheduler(cronExpression: string): void {
  // 立即执行一次翻译
  translateAllUntranslatedTweets()
    .then((count) => {
      console.log(`初始化翻译了 ${count} 条推文`);
    })
    .catch((error) => {
      console.error('初始化推文翻译失败:', error);
    });
    
  // 使用已导入的node-cron并设置定时任务
  try {
    if (cron.validate(cronExpression)) {
      cron.schedule(cronExpression, async () => {
        console.log('执行定时推文翻译任务...');
        try {
          const count = await translateAllUntranslatedTweets();
          console.log(`定时任务翻译了 ${count} 条推文`);
        } catch (error) {
          console.error('定时翻译推文失败:', error);
        }
      });
      
      console.log(`已设置推文翻译定时任务: ${cronExpression}`);
    } else {
      console.error(`无效的cron表达式: ${cronExpression}`);
    }
  } catch (error) {
    console.error('设置推文翻译定时任务失败:', error);
  }
}