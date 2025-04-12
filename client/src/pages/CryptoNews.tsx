import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { FaTwitter, FaTelegram, FaDiscord } from 'react-icons/fa';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Layout from '../components/layout/Layout';
import { StonksPriceDisplay } from '../components/ui/stonks-price-display';
import LoadingSkeleton from '../components/ui/loading-skeleton';
import { CryptoNewsType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { EnhancedNewsImage } from '../components/ui/enhanced-news-image';

// 定义硬编码的翻译，以确保在翻译系统失败时仍能正确显示
type TranslationLanguage = 'en' | 'zh';
type TranslationEntry = {
  [key in TranslationLanguage]: string;
};

const translations: Record<string, TranslationEntry> = {
  "cryptoNews.title": {
    en: "Cryptocurrency News",
    zh: "加密货币新闻"
  },
  "cryptoNews.featured": {
    en: "Featured",
    zh: "置顶新闻"
  },
  "cryptoNews.readMore": {
    en: "Read More",
    zh: "阅读更多"
  },
  "cryptoNews.allNews": {
    en: "All News",
    zh: "全部新闻"
  },
  "cryptoNews.error": {
    en: "Error fetching news",
    zh: "获取新闻失败"
  },
  "cryptoNews.noNews": {
    en: "No news available",
    zh: "暂无可用新闻"
  },
  "cryptoNews.stayUpdated": {
    en: "Follow us for more crypto updates",
    zh: "关注我们以获取更多加密货币更新"
  }
};

const PAGE_SIZE = 10;

const CryptoNews: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 打印当前语言状态，用于调试
  useEffect(() => {
    console.log(`当前语言状态: ${language}`);
    // 测试一些翻译键
    const keys = ['cryptoNews.title', 'cryptoNews.allNews', 'cryptoNews.readMore'];
    keys.forEach(key => {
      console.log(`测试翻译 - ${key}: "${t(key)}"`);
    });
  }, [language, t]);
  
  // 计算分页偏移
  const offset = (currentPage - 1) * PAGE_SIZE;
  
  // 获取新闻数据
  const { 
    data: newsData, 
    isLoading, 
    error 
  } = useQuery<CryptoNewsType[]>({
    queryKey: ['/api/crypto-news', currentPage, PAGE_SIZE],
    queryFn: async () => {
      const res = await fetch(`/api/crypto-news?limit=${PAGE_SIZE}`);
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      return {
        data: data,
        pagination: { 
          total: data.length, 
          limit: PAGE_SIZE, 
          offset: offset, 
          hasMore: data.length >= PAGE_SIZE 
        }
      };
    }
  });
  
  // 获取突出显示的新闻
  const { 
    data: highlightedNews, 
    isLoading: isLoadingHighlighted 
  } = useQuery<CryptoNewsType[]>({
    queryKey: ['/api/crypto-news/highlighted'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/crypto-news?limit=5');
        if (!res.ok) {
          console.error('Failed to fetch highlighted news');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching highlighted news:', error);
        return [];
      }
    }
  });
  
  // 处理分页变更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // 计算总页数
  const totalPages = newsData && newsData.pagination
    ? Math.ceil(newsData.pagination.total / PAGE_SIZE) 
    : 0;
    
  // 处理类别变更
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };
  
  // 为新闻生成图片（确保所有新闻都有多样化的图片）
  const getNewsImage = (news: CryptoNewsType) => {
    console.log("处理图片URL:", news.title, news.imageUrl);
    
    // 默认图片，如果所有其他方法都失败，将使用此图片
    const DEFAULT_IMAGE = "https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_1280.jpg";
    
    // 首先检查新闻是否有有效的图片URL
    if (news.imageUrl && 
        news.imageUrl.trim() !== '' && 
        news.imageUrl !== 'undefined' && 
        news.imageUrl !== 'null' && 
        !news.imageUrl.includes('undefined') && 
        !news.imageUrl.includes('null') &&
        news.imageUrl.startsWith('http')) {
      // 验证URL格式是否正确
      try {
        new URL(news.imageUrl);
        return news.imageUrl;
      } catch (e) {
        console.log(`图片URL格式错误: ${news.imageUrl}`);
      }
    }
    
    // 根据新闻ID和标题生成一个固定的随机数，以便相同的新闻总是使用相同的图片
    const generateSeed = (id: number, title: string) => {
      // 使用新闻ID和标题的长度作为种子
      return (id * 31 + title.length) % 1000;
    };
    
    // 使用AI生成的图片数据库 - 这些是预设的高质量加密货币相关图片
    const aiGeneratedImages = [
      // 比特币相关
      'https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/01/25/12/31/bitcoin-2007769_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/05/17/11/34/bitcoin-3408112_1280.jpg',
      'https://cdn.pixabay.com/photo/2020/11/24/15/18/bitcoin-5772137_1280.jpg',
      'https://cdn.pixabay.com/photo/2020/06/04/14/37/matrix-5259943_1280.jpg',
      'https://cdn.pixabay.com/photo/2021/05/21/17/26/bitcoin-6272448_1280.jpg',
      'https://assets.coingecko.com/article_images/311064/large/Bitcoin-2.jpg',
      
      // 以太坊相关
      'https://cdn.pixabay.com/photo/2021/05/25/17/51/ethereum-6283367_1280.png',
      'https://cdn.pixabay.com/photo/2022/03/19/20/17/ethereum-7078201_1280.jpg',
      'https://cdn.pixabay.com/photo/2021/11/12/13/13/ethereum-6788950_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/01/23/14/56/ethereum-3100862_1280.jpg',
      'https://assets.coingecko.com/article_images/310980/large/ETH.jpg',
      
      // 加密钱包相关
      'https://cdn.pixabay.com/photo/2018/01/28/10/31/bitcoin-3113503_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/01/23/18/54/crypto-currency-3101917_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/01/18/21/34/cryptocurrency-3091785_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/06/07/10/53/business-3460442_1280.jpg',
      'https://cdn.pixabay.com/photo/2021/11/06/04/49/non-fungible-tokens-6772690_1280.jpg',
      
      // 安全与黑客相关
      'https://cdn.pixabay.com/photo/2018/04/15/16/17/cyber-security-3321717_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/05/24/02/29/hacking-2339031_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/11/19/23/54/hacking-2964100_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/01/17/20/22/analytics-3088958_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/03/08/16/36/network-3209352_1280.jpg',
      
      // 区块链和技术相关
      'https://cdn.pixabay.com/photo/2019/12/21/09/32/blockchain-4709892_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/02/21/08/40/blockchain-3169899_1280.jpg',
      'https://cdn.pixabay.com/photo/2021/09/09/22/17/network-6611550_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/05/07/13/46/hacker-3380124_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/05/19/02/22/book-3412494_1280.jpg',
      
      // 抗议和社会事件相关
      'https://cdn.pixabay.com/photo/2020/06/24/19/12/cabbage-5337431_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/14/04/22/boy-1822631_1280.jpg',
      'https://cdn.pixabay.com/photo/2019/07/16/18/18/political-4342215_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/07/24/22/07/protest-2536024_1280.jpg',
      
      // 金融和交易相关
      'https://cdn.pixabay.com/photo/2018/01/28/11/03/bitcoin-3113465_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/11/10/01/59/bitcoin-2935330_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/27/21/42/stock-1863880_1280.jpg',
      'https://cdn.pixabay.com/photo/2021/05/05/19/26/bitcoin-6231928_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/02/12/10/45/depression-3147543_1280.jpg',
      
      // 空间与元宇宙相关
      'https://cdn.pixabay.com/photo/2016/10/20/18/35/earth-1756274_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/08/25/16/15/universe-2680998_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/03/23/09/34/artificial-intelligence-2167834_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/03/23/12/00/virtual-reality-2168470_1280.jpg',
      
      // 公司和商业相关
      'https://cdn.pixabay.com/photo/2017/02/01/10/41/chart-2029863_1280.png',
      'https://cdn.pixabay.com/photo/2015/09/05/20/02/coding-924920_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/08/30/07/56/money-2696228_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/12/19/08/55/business-3028309_1280.jpg'
    ];

    // 使用新种子函数选择AI生成的图片
    const selectAIImage = () => {
      const seed = generateSeed(news.id, news.title || "");
      return aiGeneratedImages[seed % aiGeneratedImages.length];
    };
    
    // 源特定图片
    const sourceImages: Record<string, string[]> = {
      'CoinGecko': [
        'https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca4be1c81f0db30e924154750d208683fad7ae6f2ce06c76d0a56.png',
        'https://cryptologos.cc/logos/coingecko-cg-logo.png',
        'https://assets.coingecko.com/article_images/311064/large/Bitcoin-2.jpg'
      ],
      'CoinTelegraph': [
        'https://assets.coingecko.com/article_images/310805/large/COINTELEGRAPH-2.jpg',
        'https://s2.coinmarketcap.com/static/img/coins/200x200/8996.png',
        'https://cryptologos.cc/logos/cointelegraph-ct-logo.png'
      ],
      'TheBlock': [
        'https://pbs.twimg.com/profile_images/1559173535693926400/BV9v1HDo_400x400.jpg',
        'https://cryptologos.cc/logos/the-block-block-logo.png',
        'https://assets.coingecko.com/article_images/310958/large/THEBLOCK.jpg'
      ],
      'CoinDesk': [
        'https://cryptologos.cc/logos/coindesk-cd-logo.png',
        'https://pbs.twimg.com/profile_images/1599803099607384066/UW4sH2ii_400x400.jpg',
        'https://assets.coingecko.com/article_images/310789/large/COINDESK.jpg'
      ],
      '8BTC': [
        'https://pbs.twimg.com/profile_images/1275716146762661890/BP8aHRk2_400x400.jpg',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple114/v4/8a/88/bd/8a88bd76-e81f-87b9-0c24-7a29b9b5d9f5/source/512x512bb.jpg',
        'https://img.block123.com/nav/images/4aaf1c6bcd2054418ed0aca9d08e7c1ejpg.jpg',
        'https://assets.coingecko.com/article_images/310969/large/8BTC.jpg'
      ]
    };
    
    // 内容相关图片集合
    const contentImages = {
      bitcoin: [
        'https://img.freepik.com/premium-vector/bitcoin-cryptocurrency-golden-coin-3d-icon_116083-4986.jpg',
        'https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/01/25/12/31/bitcoin-2007769_1280.jpg'
      ],
      ethereum: [
        'https://img.freepik.com/premium-vector/ethereum-cryptocurrency-golden-3d-coin-icon_116083-4994.jpg',
        'https://cdn.pixabay.com/photo/2021/05/25/17/51/ethereum-6283367_1280.png',
        'https://cdn.pixabay.com/photo/2022/03/19/20/17/ethereum-7078201_1280.jpg'
      ],
      nft: [
        'https://img.freepik.com/premium-vector/nft-non-fungible-token-logo-icon-modern-crypto-token_187882-1377.jpg',
        'https://cdn.pixabay.com/photo/2022/03/01/02/51/nft-7040393_1280.png',
        'https://cdn.pixabay.com/photo/2022/02/19/10/37/nft-7022358_1280.jpg'
      ],
      defi: [
        'https://img.freepik.com/premium-vector/defi-decentralized-finance-icon-vector-illustration_116137-7975.jpg',
        'https://cdn.pixabay.com/photo/2022/03/02/10/27/decentralized-7043197_1280.jpg',
        'https://cdn.pixabay.com/photo/2021/12/06/13/48/defi-6850597_1280.jpg'
      ],
      stonks: [
        'https://i.imgur.com/0YEzUGn.png',
        'https://cdn.pixabay.com/photo/2021/03/17/01/31/stonks-6101327_1280.png'
      ],
      general: [
        'https://img.freepik.com/premium-vector/cryptocurrency-bitcoin-golden-coin-background_116083-4199.jpg',
        'https://cdn.pixabay.com/photo/2018/01/19/07/57/crypto-3091905_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/12/12/13/02/ripple-3014411_1280.jpg',
        'https://cdn.pixabay.com/photo/2021/05/24/17/23/cryptocurrency-6279754_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/06/26/23/44/artificial-intelligence-3500208_1280.jpg'
      ]
    };
    
    // 使用news.id作为随机选择器的种子，使相同的新闻始终使用相同的图片
    const selectRandom = (arr: string[]) => arr[news.id % arr.length];
    
    // 先检查来源是否有特定图片
    if (news.source && sourceImages[news.source]) {
      return selectRandom(sourceImages[news.source]);
    }
    
    // 定义更完整的内容与图片类别匹配规则
    const title = (news.title || '').toLowerCase();
    const content = (news.content || '').toLowerCase();
    
    // 钱包与安全相关
    if (title.includes('wallet') || content.includes('wallet') || 
        title.includes('exodus') || content.includes('exodus') ||
        title.includes('atomic') || content.includes('atomic')) {
      // 添加专门针对钱包新闻的图片
      const walletImages = [
        'https://cdn.pixabay.com/photo/2018/01/28/10/31/bitcoin-3113503_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/01/23/18/54/crypto-currency-3101917_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/01/18/21/34/cryptocurrency-3091785_1280.jpg'
      ];
      return selectRandom(walletImages);
    }
    
    // 网络安全相关
    if (title.includes('exploit') || content.includes('exploit') ||
        title.includes('cybersecurity') || content.includes('cybersecurity') ||
        title.includes('hack') || content.includes('hack') ||
        title.includes('security') || content.includes('security')) {
      // 添加专门针对安全相关新闻的图片
      const securityImages = [
        'https://cdn.pixabay.com/photo/2018/04/15/16/17/cyber-security-3321717_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/05/24/02/29/hacking-2339031_1280.jpg',
        'https://cdn.pixabay.com/photo/2017/11/19/23/54/hacking-2964100_1280.jpg'
      ];
      return selectRandom(securityImages);
    }
    
    // ETF和质押相关
    if ((title.includes('etf') || content.includes('etf')) &&
        (title.includes('staking') || content.includes('staking'))) {
      // 添加专门针对ETF和质押相关新闻的图片
      const stakingImages = [
        'https://cdn.pixabay.com/photo/2021/11/12/13/13/ethereum-6788950_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/01/23/14/56/ethereum-3100862_1280.jpg',
        'https://cdn.pixabay.com/photo/2018/01/23/14/57/ethereum-3100865_1280.jpg'
      ];
      return selectRandom(stakingImages);
    }
    
    // 比特币相关
    if (title.includes('bitcoin') || content.includes('bitcoin') || 
        title.includes('btc') || content.includes('btc')) {
      return selectRandom(contentImages.bitcoin);
    } 
    
    // 以太坊相关
    if (title.includes('ethereum') || content.includes('ethereum') || 
        title.includes('eth') || content.includes('eth')) {
      return selectRandom(contentImages.ethereum);
    } 
    
    // NFT相关
    if (title.includes('nft') || content.includes('nft') ||
        title.includes('non-fungible') || content.includes('non-fungible')) {
      return selectRandom(contentImages.nft);
    } 
    
    // DeFi相关
    if (title.includes('defi') || content.includes('defi') ||
        title.includes('decentralized finance') || content.includes('decentralized finance')) {
      return selectRandom(contentImages.defi);
    }
    
    // Stonks相关
    if (title.includes('stonks') || content.includes('stonks')) {
      return selectRandom(contentImages.stonks);
    }
    
    // 使用AI生成的图片，确保每篇新闻都有一张匹配的图片
    // 首先尝试使用通用加密货币图片
    try {
      if (Math.random() > 0.5) {
        return selectRandom(contentImages.general);
      } else {
        // 否则使用AI生成的图片
        return selectAIImage();
      }
    } catch (error) {
      // 如果上述所有方法都失败，返回默认图片
      console.error("无法生成图片，使用默认图片", error);
      return DEFAULT_IMAGE;
    }
  };

  const formatPublishedDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: language === 'zh' ? zhCN : enUS 
      });
    } catch (e) {
      return language === 'zh' ? '最近' : 'recently';
    }
  };

  // 调试语言状态
  useEffect(() => {
    console.log(`当前语言: ${language}, 支持的键: cryptoNews.title`);
    console.log(`翻译测试: ${t('cryptoNews.title')}`);
  }, [language]);
  
  // 使用硬编码的翻译，而不是 t 函数
  const getLocalTranslation = (key: keyof typeof translations): string => {
    if (translations[key]) {
      const lang = language as 'en' | 'zh';
      return translations[key][lang] || key;
    }
    return key;
  };

  // 处理新闻内容的翻译，对于中文环境，提供标题和内容的翻译
  const getTranslatedNewsTitle = (originalTitle: string): string => {
    // 如果不是中文环境，或者标题已经是中文，则直接返回原标题
    if (language !== 'zh' || /[\u4e00-\u9fa5]/.test(originalTitle)) {
      return originalTitle;
    }

    // 首先尝试匹配完整的标题模板
    const completeTitleTemplates: Record<string, string> = {
      "Former CFTC Chairman Timothy Massad On Bitcoin And Digital Asset Privacy": 
        "前CFTC主席Timothy Massad谈比特币和数字资产隐私",
      "Atomic, Exodus wallets targeted in new cybersecurity exploit": 
        "Atomic和Exodus钱包成为新网络安全漏洞的目标",
      "Ether ETF staking could come as soon as May — Bloomberg analyst": 
        "以太坊ETF质押可能最早在5月推出 — 彭博分析师",
      "How The Psychology Of Money Impacts Bitcoin Users": 
        "金钱心理学如何影响比特币用户",
      "Cosmos launches Eureka to connect Ethereum and IBC networks": 
        "Cosmos推出Eureka连接以太坊和IBC网络",
      "Anti-Elon Musk protests 2025: Everything you need to know": 
        "2025年反马斯克抗议：你需要知道的一切",
      "Top Bitcoin miners produced nearly $800M of BTC in Q1 2025": 
        "顶级比特币矿工在2025年第一季度产出了近8亿美元的BTC",
      "Semler Scientific escapes the Zombie Zone with a Bitcoin Treasury Strategy": 
        "Semler Scientific通过比特币财政战略摆脱僵尸区",
    };

    // 检查是否有完全匹配的标题
    if (completeTitleTemplates[originalTitle]) {
      return completeTitleTemplates[originalTitle];
    }

    // 检查常见的标题短语模板
    const phraseTemplates: Record<string, string> = {
      "could come as soon as": "可能很快就会",
      "everything you need to know": "你需要知道的一切",
      "produced nearly": "产出了近",
      "targeted in": "成为目标于",
      "launches": "推出",
      "to connect": "连接",
      "On Bitcoin": "谈比特币",
      "And Digital Asset": "和数字资产",
      "How The": "如何",
      "Impacts": "影响",
      "Users": "用户",
      "in Q1": "在第一季度",
      "with a": "通过一个",
      "escapes the": "摆脱了",
      "Treasury Strategy": "财政战略"
    };

    // 为常见的加密货币新闻标题提供中文翻译
    const newsTranslations: Record<string, string> = {
      // 常见加密货币相关术语翻译
      "Bitcoin": "比特币",
      "BTC": "BTC",
      "Ethereum": "以太坊",
      "ETH": "ETH",
      "ETF": "ETF",
      "staking": "质押",
      "wallets": "钱包",
      "wallet": "钱包",
      "crypto": "加密货币",
      "cryptocurrency": "加密货币",
      "blockchain": "区块链",
      "miners": "矿工",
      "mining": "挖矿",
      "token": "代币",
      "tokens": "代币",
      "exploit": "漏洞",
      "cybersecurity": "网络安全",
      "hack": "黑客攻击",
      "security": "安全",
      "NFT": "NFT",
      "DeFi": "DeFi",
      "Solana": "索拉纳",
      "Binance": "币安",
      "Coinbase": "比特币基地",
      "exchange": "交易所",
      "trading": "交易",
      "trader": "交易者",
      "investor": "投资者",
      "investment": "投资",
      "regulation": "监管",
      "regulator": "监管机构",
      "SEC": "美国证券交易委员会",
      "government": "政府",
      "adoption": "采用",
      "digital": "数字",
      "asset": "资产",
      "assets": "资产",
      "currency": "货币",
      "rally": "反弹",
      "surge": "暴涨",
      "crash": "暴跌",
      "volatile": "波动",
      "volatility": "波动性",
      "bullish": "看涨",
      "bearish": "看跌",
      "could": "可能",
      "may": "可能",
      "should": "应该",
      "future": "未来",
      "halving": "减半",
      "money": "金钱",
      "psychology": "心理学",
      "network": "网络",
      "networks": "网络",
      "protest": "抗议",
      "protests": "抗议",
      "former": "前",
      "chairman": "主席",
      "privacy": "隐私",
      "new": "新的",
      "Cosmos": "Cosmos",
      "Eureka": "Eureka",
      "Atomic": "Atomic",
      "Exodus": "Exodus",
      "Semler": "Semler",
      "Scientific": "Scientific",
      "Zombie": "僵尸",
      "Zone": "区域",
      "Bloomberg": "彭博",
      "analyst": "分析师",
      "Elon": "埃隆",
      "Musk": "马斯克",
      "CFTC": "CFTC",
      "Timothy": "Timothy",
      "Massad": "Massad",
      // 常见新闻标题模式翻译
      "Analysis": "分析",
      "Report": "报告",
      "Breaking": "重大新闻",
      "Price": "价格",
      "prices": "价格",
      "Market": "市场",
      "Markets": "市场",
      "Research": "研究",
      "Study": "研究",
      "Survey": "调查",
      "Guide": "指南",
      "Explained": "解释",
      "Update": "更新",
      "New": "新的",
      "First": "首个",
      "Latest": "最新",
      "Top": "顶级",
      "Best": "最佳",
      "Worst": "最差",
      "record": "记录",
      "high": "高点",
      "low": "低点",
      "drop": "下跌",
      "rise": "上涨",
      "gain": "上涨",
      "lose": "下跌",
      "loss": "损失",
      "profit": "利润",
    };

    // 先尝试替换短语
    let translatedTitle = originalTitle;
    Object.entries(phraseTemplates).forEach(([en, zh]) => {
      translatedTitle = translatedTitle.replace(new RegExp(en, 'gi'), zh);
    });

    // 再替换常见术语
    Object.entries(newsTranslations).forEach(([en, zh]) => {
      // 使用正则表达式进行替换，保证只替换完整的单词
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translatedTitle = translatedTitle.replace(regex, zh);
    });

    // 如果是美元金额，确保格式正确
    translatedTitle = translatedTitle.replace(/\$(\d+)([MBK])/g, '$1$2美元');

    return translatedTitle;
  };

  // 处理新闻内容的翻译
  const getTranslatedNewsContent = (originalContent: string): string => {
    // 如果不是中文环境，或者内容已经是中文，则直接返回原内容
    if (language !== 'zh' || /[\u4e00-\u9fa5]/.test(originalContent)) {
      return originalContent;
    }

    // 首先尝试匹配完整的内容模板
    const completeContentTemplates: Record<string, string> = {
      "Former CFTC chairman Tim Massad discusses privacy in digital assets and how to build an effective crypto regulatory framework.": 
        "前CFTC主席Tim Massad讨论数字资产的隐私和如何建立有效的加密货币监管框架。",
      "Hardware wallet users report exploit and token theft. Some wallets affected by a similar issue to the previous supply chain attack.": 
        "硬件钱包用户报告漏洞和代币被盗。一些钱包受到类似于之前供应链攻击的问题影响。",
      "Haskel says staking for the spot ETH ETF is months, not years, away as progress continues.": 
        "Haskel表示，随着进展继续，现货ETH ETF的质押将在几个月内而非几年内实现。",
      "How do our attitudes toward money influence our behavior with Bitcoin and cryptocurrency in general?": 
        "我们对金钱的态度如何影响我们对比特币和加密货币的整体行为？",
      "Semler Scientific's Bitcoin treasury strategy has quickly put the company back on the map, with shares up over 100% in 6 months.": 
        "Semler Scientific的比特币财政战略迅速使该公司重回市场关注，股价在6个月内上涨超过100%。"
    };

    // 检查是否有完全匹配的内容
    if (completeContentTemplates[originalContent]) {
      return completeContentTemplates[originalContent];
    }

    // 如果内容太长，返回一个简短的中文说明
    if (originalContent.length > 100) {
      return "此为英文原文新闻内容，点击可查看完整报道。";
    }

    // 常见短语及句型的翻译
    const contentPhraseTemplates: Record<string, string> = {
      "Read more about": "了解更多关于",
      "Learn more about": "了解更多关于",
      "Click here for more": "点击这里了解更多",
      "Latest news on": "关于以下内容的最新消息",
      "Breaking news:": "重大新闻：",
      "How to": "如何",
      "Why this matters:": "为什么这很重要：",
      "According to": "根据",
      "Reports suggest": "报道表明",
      "What you need to know": "你需要知道的事情",
      "This is a developing story": "这是一个正在发展的故事",
      "Key points:": "关键点：",
      "The future of": "未来的",
      "The impact of": "影响",
      "A guide to": "指南",
      "Analysis:": "分析：",
      "Opinion:": "观点：",
      "Review:": "评论：",
      "Interview with": "采访",
      "Explained:": "解释：",
      "The rise of": "兴起",
      "The fall of": "衰落",
      "Questions about": "关于以下问题",
      "Answers to": "关于以下问题的答案",
      "What is": "什么是",
      "Who is": "谁是",
      "When will": "何时会"
    };

    // 常见单词和短语的翻译
    const contentTranslations: Record<string, string> = {
      // 通用短语
      "Read more": "阅读更多",
      "Click to view": "点击查看",
      "View full article": "查看完整文章",
      "Learn more": "了解更多",
      "More details": "更多详情",
      "Find out more": "了解更多",
      "Continue reading": "继续阅读",
      "Full story": "完整报道",
      "Original source": "原始来源",
      "Source": "来源",
      "Read the full article": "阅读完整文章",
      "Click for details": "点击查看详情",
      "See more": "查看更多",
      
      // 加密货币相关
      "Bitcoin": "比特币",
      "Ethereum": "以太坊",
      "cryptocurrency": "加密货币",
      "blockchain": "区块链",
      "digital asset": "数字资产",
      "mining": "挖矿",
      "wallet": "钱包",
      "exchange": "交易所",
      "token": "代币",
      "staking": "质押",
      "DeFi": "去中心化金融",
      "NFT": "非同质化代币",
      "smart contract": "智能合约",
      "regulation": "监管",
      "adoption": "采用",
      "transaction": "交易",
      "security": "安全",
      "privacy": "隐私",
      "market": "市场",
      "investment": "投资",
      "trading": "交易",
      "volatility": "波动性",
      "analysis": "分析"
    };

    // 首先替换较长的短语
    let translatedContent = originalContent;
    Object.entries(contentPhraseTemplates).forEach(([en, zh]) => {
      translatedContent = translatedContent.replace(new RegExp(en, 'gi'), zh);
    });

    // 然后替换单词和较短的短语
    Object.entries(contentTranslations).forEach(([en, zh]) => {
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translatedContent = translatedContent.replace(regex, zh);
    });

    return translatedContent || "点击查看英文原文";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-teal-400">
            {getLocalTranslation('cryptoNews.title')}
          </h1>
          <StonksPriceDisplay />
        </div>
        
        {/* 顶部突出新闻部分 */}
        {isLoadingHighlighted ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Array(3).fill(0).map((_, index) => (
              <LoadingSkeleton key={index} className="h-48" />
            ))}
          </div>
        ) : highlightedNews && highlightedNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {highlightedNews.map((news) => (
              <a 
                key={news.id} 
                href={news.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="overflow-hidden border-teal-500/20 shadow-lg bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer h-full transform hover:scale-[1.02] transition-transform">
                  <div className="w-full h-40 overflow-hidden">
                    <EnhancedNewsImage
                      source={getNewsImage(news)}
                      sourceName={news.source || "News"}
                      fallbackImage="/images/crypto/bitcoin.jpg"
                      className="w-full h-full object-cover"
                      alt={news.title}
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-teal-500 hover:bg-teal-600">
                        {getLocalTranslation('cryptoNews.featured')}
                      </Badge>
                      <Badge variant="outline">{news.source}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">{getTranslatedNewsTitle(news.title)}</CardTitle>
                  </CardHeader>
                  <CardFooter className="pt-0 flex justify-between mt-auto">
                    <span className="text-xs text-gray-400">
                      {formatPublishedDate(news.publishedAt)}
                    </span>
                    <Button variant="link">
                      {getLocalTranslation('cryptoNews.readMore')}
                    </Button>
                  </CardFooter>
                </Card>
              </a>
            ))}
          </div>
        ) : null}
        
        {/* 新闻分类选项卡 */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => handleCategoryChange('all')}>
              {getLocalTranslation('cryptoNews.allNews')}
            </TabsTrigger>
            <TabsTrigger value="bitcoin" onClick={() => handleCategoryChange('bitcoin')}>
              Bitcoin
            </TabsTrigger>
            <TabsTrigger value="ethereum" onClick={() => handleCategoryChange('ethereum')}>
              Ethereum
            </TabsTrigger>
            <TabsTrigger value="defi" onClick={() => handleCategoryChange('defi')}>
              DeFi
            </TabsTrigger>
            <TabsTrigger value="nft" onClick={() => handleCategoryChange('nft')}>
              NFT
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedCategory}>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-32" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-lg text-red-400">
                  {getLocalTranslation('cryptoNews.error')}
                </p>
              </div>
            ) : newsData && newsData.data.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-lg text-gray-400">
                  {getLocalTranslation('cryptoNews.noNews')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsData?.data.map((news) => (
                  <a 
                    key={news.id} 
                    href={news.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="overflow-hidden border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer transform hover:scale-[1.01] transition-transform">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/4 h-40 md:h-auto overflow-hidden">
                          <EnhancedNewsImage
                            source={getNewsImage(news)}
                            sourceName={news.source || "News"}
                            fallbackImage="/images/crypto/bitcoin.jpg"
                            className="w-full h-full object-cover"
                            alt={news.title}
                          />
                        </div>
                        <div className="flex-1 flex flex-col md:w-3/4">
                          <CardHeader>
                            <div className="flex justify-between items-center mb-2">
                              <Badge variant="outline">{news.source}</Badge>
                              <span className="text-xs text-gray-400">
                                {formatPublishedDate(news.publishedAt)}
                              </span>
                            </div>
                            <CardTitle className="text-xl">{getTranslatedNewsTitle(news.title)}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2">
                              {getTranslatedNewsContent(news.content)}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="mt-auto">
                            <Button variant="link" className="ml-auto">
                              {getLocalTranslation('cryptoNews.readMore')}
                            </Button>
                          </CardFooter>
                        </div>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            )}
            
            {/* 分页 */}
            {!isLoading && newsData && totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // 显示当前页附近的页码
                    let pageToShow;
                    if (totalPages <= 5) {
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    } else {
                      pageToShow = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          isActive={pageToShow === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageToShow);
                          }}
                        >
                          {pageToShow}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        </Tabs>
        
        {/* 社交媒体链接 */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4 text-teal-400">
            {getLocalTranslation('cryptoNews.stayUpdated')}
          </h3>
          <div className="flex justify-center space-x-6">
            <a 
              href="https://twitter.com/StonksDEX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-3xl text-gray-400 hover:text-teal-400 transition-colors"
            >
              <FaTwitter />
            </a>
            <a 
              href="https://t.me/StonksDEX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-3xl text-gray-400 hover:text-teal-400 transition-colors"
            >
              <FaTelegram />
            </a>
            <a 
              href="https://discord.gg/StonksDEX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-3xl text-gray-400 hover:text-teal-400 transition-colors"
            >
              <FaDiscord />
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CryptoNews;