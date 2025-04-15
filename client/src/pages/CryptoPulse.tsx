import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { FaTwitter, FaTelegram, FaDiscord, FaFilter, FaStar, FaEye, FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiSolana } from 'react-icons/si';
import { PiTrendUp } from "react-icons/pi";
import { HiOutlineNewspaper } from "react-icons/hi";
import { GoArrowUp, GoArrowDown } from "react-icons/go";
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
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Layout from '../components/layout/Layout';
import { StonksPriceDisplay } from '../components/ui/stonks-price-display';
import LoadingSkeleton from '../components/ui/loading-skeleton';
import { CryptoNewsType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';

// 定义硬编码的翻译
type TranslationLanguage = 'en' | 'zh';
type TranslationEntry = {
  [key in TranslationLanguage]: string;
};

const translations: Record<string, TranslationEntry> = {
  "cryptoPulse.title": {
    en: "Crypto Pulse",
    zh: "加密脉搏"
  },
  "cryptoPulse.trending": {
    en: "Trending",
    zh: "热门趋势"
  },
  "cryptoPulse.latest": {
    en: "Latest",
    zh: "最新动态"
  },
  "cryptoPulse.news": {
    en: "News",
    zh: "新闻"
  },
  "cryptoPulse.tweets": {
    en: "Tweets",
    zh: "推文"
  },
  "cryptoPulse.markets": {
    en: "Markets",
    zh: "市场"
  },
  "cryptoPulse.filter": {
    en: "Filter",
    zh: "筛选"
  },
  "cryptoPulse.sort": {
    en: "Sort",
    zh: "排序"
  },
  "cryptoPulse.sortByTime": {
    en: "Sort by time",
    zh: "按时间排序"
  },
  "cryptoPulse.sortByPopularity": {
    en: "Sort by popularity",
    zh: "按热度排序"
  },
  "cryptoPulse.noContent": {
    en: "No content available",
    zh: "暂无可用内容"
  },
  "cryptoPulse.error": {
    en: "Error loading content",
    zh: "加载内容失败"
  },
  "cryptoPulse.minutes": {
    en: "m",
    zh: "分钟"
  },
  "cryptoPulse.hours": {
    en: "h",
    zh: "小时"
  },
  "cryptoPulse.days": {
    en: "d",
    zh: "天"
  },
  "cryptoPulse.allTopics": {
    en: "All Topics",
    zh: "所有主题"
  },
  "cryptoPulse.bitcoin": {
    en: "Bitcoin",
    zh: "比特币"
  },
  "cryptoPulse.ethereum": {
    en: "Ethereum",
    zh: "以太坊"
  },
  "cryptoPulse.solana": {
    en: "Solana",
    zh: "索拉纳"
  },
  "cryptoPulse.defi": {
    en: "DeFi",
    zh: "去中心化金融"
  },
  "cryptoPulse.nft": {
    en: "NFT",
    zh: "非同质化代币"
  },
  "cryptoPulse.stonks": {
    en: "STONKS",
    zh: "STONKS"
  }
};

// 社交媒体帖子类型（统一接口）
type SocialPost = {
  id: string | number;
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  source: 'twitter' | 'telegram' | 'news';
  url?: string;
  imageUrl?: string;
  tags?: string[];
  isVerified?: boolean;
};

// 价格统计数据类型
type PriceStats = {
  name: string;
  symbol: string;
  logo: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
};

// 自定义样式
const styles = {
  pulseContainer: "min-h-screen bg-gradient-to-b from-gray-900 to-black text-white",
  header: "sticky top-0 z-50 backdrop-blur-md bg-black/60 border-b border-gray-800",
  mainContent: "container mx-auto px-4 py-8 max-w-7xl",
  trendingHeader: "flex items-center gap-2 mb-4",
  trendingIcon: "text-accent text-xl",
  tabsList: "border-b border-gray-800 mb-6",
  tabsTrigger: "px-4 py-2 text-gray-400 hover:text-white transition-colors",
  tabsTriggerActive: "text-accent border-b-2 border-accent",
  filterSection: "flex flex-wrap justify-between items-center gap-4 mb-6",
  topicSelect: "bg-gray-800 rounded-full text-sm",
  sortSelect: "bg-gray-800 rounded-full text-sm",
  gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6",
  postCard: "bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden transition-all hover:border-accent/50 hover:bg-gray-800/80",
  postCardHeader: "flex items-start justify-between p-4",
  authorInfo: "flex items-center gap-3",
  authorAvatar: "rounded-full border-2 border-accent",
  authorName: "font-medium",
  authorUsername: "text-gray-400 text-sm",
  postTimestamp: "text-gray-500 text-xs",
  postContent: "p-4 pt-0 text-sm leading-relaxed border-b border-gray-700/50",
  postImage: "w-full h-48 object-cover",
  postFooter: "flex items-center justify-between p-3 text-gray-400 text-sm",
  postStats: "flex items-center gap-3",
  statItem: "flex items-center gap-1",
  trendingTag: "bg-accent/20 text-accent text-xs px-2 py-1 rounded-full"
};

// 格式化时间
const formatTime = (dateString: string, language: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}${language === 'zh' ? '分钟前' : 'm'}`;
    } else if (hours < 24) {
      return `${hours}${language === 'zh' ? '小时前' : 'h'}`;
    } else {
      return `${days}${language === 'zh' ? '天前' : 'd'}`;
    }
  } catch (e) {
    return language === 'zh' ? '未知时间' : 'unknown time';
  }
};

// 获取用户头像或生成默认头像
const getAvatarUrl = (author: string, username: string): string => {
  const defaultAvatars: Record<string, string> = {
    'CoinDesk': 'https://cryptologos.cc/logos/coindesk-cd-logo.png',
    'CoinGecko': 'https://cryptologos.cc/logos/coingecko-cg-logo.png',
    'CoinTelegraph': 'https://cryptologos.cc/logos/cointelegraph-ct-logo.png',
    'TheBlock': 'https://pbs.twimg.com/profile_images/1559173535693926400/BV9v1HDo_400x400.jpg',
    'Binance': 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
    'Bitcoin Magazine': 'https://pbs.twimg.com/profile_images/1444022922377576453/AzvXYXGr_400x400.jpg'
  };
  
  if (defaultAvatars[author]) {
    return defaultAvatars[author];
  }
  
  // 尝试使用Twitter API头像URL格式（仅用于示例）
  return `https://unavatar.io/${username}`;
};

// 从文本中提取标签
const extractTags = (text: string): string[] => {
  const hashtags = text.match(/#[a-zA-Z0-9_]+/g) || [];
  return hashtags.map(tag => tag.substring(1)); // 移除#符号
};

// 社交媒体帖子组件
const SocialPostCard: React.FC<{ post: SocialPost }> = ({ post }) => {
  const { language } = useLanguage();
  
  // 计算时间标签
  const timeLabel = formatTime(post.timestamp, language);
  
  // 提取标签
  const tags = post.tags || extractTags(post.content);
  
  // 根据来源为帖子添加不同图标和样式
  const getSourceIcon = () => {
    switch (post.source) {
      case 'twitter':
        return <FaTwitter className="text-blue-400" />;
      case 'telegram':
        return <FaTelegram className="text-sky-400" />;
      case 'news':
        return <HiOutlineNewspaper className="text-green-400" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className={styles.postCard}>
      <CardHeader className={styles.postCardHeader}>
        <div className={styles.authorInfo}>
          <Avatar className={styles.authorAvatar}>
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <h3 className={styles.authorName}>{post.author.name}</h3>
              {post.isVerified && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 h-4 px-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M9 14.25l6-6m-6 6l-6-6m12 0l6 6m-6-6v10.5" clipRule="evenodd" />
                  </svg>
                </Badge>
              )}
            </div>
            <p className={styles.authorUsername}>@{post.author.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={styles.postTimestamp}>{timeLabel}</span>
          {getSourceIcon()}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={styles.postContent}>
          {post.content}
        </div>
        
        {post.imageUrl && (
          <div className="aspect-video">
            <img 
              src={post.imageUrl} 
              alt="Post media" 
              className={styles.postImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://cdn.pixabay.com/photo/2018/01/18/07/31/bitcoin-3089728_1280.jpg";
              }}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className={styles.postFooter}>
        <div className={styles.postStats}>
          <div className={styles.statItem}>
            <FaEye className="text-gray-500" /> 
            <span>{(post.likes * 4).toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-400">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>{post.likes.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
            </svg>
            <span>{post.comments.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400 transform rotate-45">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v5.69a.75.75 0 001.5 0v-5.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
            </svg>
            <span>{post.shares.toLocaleString()}</span>
          </div>
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className={styles.trendingTag}>
                #{tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="bg-gray-700/50 text-gray-400 text-xs px-2 py-1 rounded-full">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// 价格统计卡片组件
const PriceStatsCard: React.FC<{ stats: PriceStats }> = ({ stats }) => {
  const priceChangeColor = stats.change24h >= 0 ? 'text-green-500' : 'text-red-500';
  const priceChangeIcon = stats.change24h >= 0 ? <GoArrowUp /> : <GoArrowDown />;
  
  return (
    <Card className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-accent/50 hover:bg-gray-800/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src={stats.logo} alt={stats.name} className="w-6 h-6 rounded-full" />
            <h3 className="font-medium">{stats.name}</h3>
            <span className="text-gray-400 text-sm">{stats.symbol}</span>
          </div>
          <div className={`flex items-center gap-1 ${priceChangeColor}`}>
            {priceChangeIcon}
            <span>{Math.abs(stats.change24h).toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="text-xl font-semibold mb-2">
          ${stats.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
        
        <div className="flex justify-between text-gray-400 text-xs">
          <div>
            <div className="text-gray-500">24h Vol</div>
            <div>${stats.volume24h.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Market Cap</div>
            <div>${stats.marketCap.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 将新闻转换为社交媒体帖子格式
const convertNewsToSocialPost = (news: CryptoNewsType): SocialPost => {
  return {
    id: news.id,
    content: news.title, // 仅使用标题作为内容
    author: {
      name: news.source,
      username: news.source.toLowerCase().replace(/\s+/g, '_'),
      avatar: getAvatarUrl(news.source, news.source.toLowerCase().replace(/\s+/g, '_'))
    },
    timestamp: news.publishedAt,
    likes: Math.floor(Math.random() * 50) + 5, // 模拟点赞数据
    comments: Math.floor(Math.random() * 20), // 模拟评论数据
    shares: Math.floor(Math.random() * 10), // 模拟分享数据
    source: 'news',
    url: news.sourceUrl,
    imageUrl: news.imageUrl || undefined,
    isVerified: true // 新闻源通常是已验证的
  };
};

// 示例价格数据
const dummyPriceStats: PriceStats[] = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    price: 53841.23,
    change24h: 1.25,
    volume24h: 32659000000,
    marketCap: 1049000000000
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 2592.16,
    change24h: -0.74,
    volume24h: 14237000000,
    marketCap: 311400000000
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    price: 138.62,
    change24h: 3.42,
    volume24h: 2835000000,
    marketCap: 60200000000
  },
  {
    name: 'STONKS',
    symbol: 'STONKS',
    logo: 'https://i.imgur.com/0YEzUGn.png',
    price: 0.042,
    change24h: 5.12,
    volume24h: 18200000,
    marketCap: 42000000
  }
];

const CryptoPulse: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentTab, setCurrentTab] = useState('trending');
  const [topic, setTopic] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  
  // 抓取加密货币新闻
  const { 
    data: newsData, 
    isLoading: isLoadingNews, 
    error: newsError 
  } = useQuery({
    queryKey: ['/api/crypto-news'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/crypto-news?limit=20');
        if (!res.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await res.json() as CryptoNewsType[];
        return data;
      } catch (error) {
        console.error('Error fetching crypto news:', error);
        return [];
      }
    }
  });
  
  // 抓取X推文数据
  const { 
    data: tweetsData, 
    isLoading: isLoadingTweets, 
    error: tweetsError 
  } = useQuery({
    queryKey: ['/api/crypto-tweets'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/crypto-tweets?limit=20');
        if (!res.ok) {
          // 失败时返回空数组，这样不会阻止整个组件渲染
          console.error('Failed to fetch tweets, API may not be available');
          return [];
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching crypto tweets:', error);
        return [];
      }
    }
  });
  
  // 将所有内容转换为统一的社交帖子格式
  const combinedPosts = React.useMemo(() => {
    let posts: SocialPost[] = [];
    
    // 添加新闻
    if (newsData && newsData.length > 0) {
      const newsPosts = newsData.map(convertNewsToSocialPost);
      posts = [...posts, ...newsPosts];
    }
    
    // 添加推文（如果有）
    if (tweetsData && tweetsData.length > 0) {
      const tweetPosts = tweetsData.map(tweet => ({
        id: tweet.tweetId || tweet.id,
        content: tweet.text,
        author: {
          name: tweet.authorName || 'Twitter User',
          username: tweet.authorUsername || 'user',
          avatar: tweet.authorProfileImage || getAvatarUrl('', tweet.authorUsername || 'user')
        },
        timestamp: tweet.createdAt,
        likes: tweet.likeCount || 0,
        comments: tweet.replyCount || 0,
        shares: tweet.retweetCount || 0,
        source: 'twitter' as const,
        url: tweet.url,
        tags: extractTags(tweet.text),
        isVerified: Math.random() > 0.5 // 随机设置验证状态
      }));
      posts = [...posts, ...tweetPosts];
    }
    
    // 应用过滤器
    if (topic !== 'all') {
      posts = posts.filter(post => {
        const content = post.content.toLowerCase();
        const topicKeywords: Record<string, string[]> = {
          'bitcoin': ['bitcoin', 'btc', '#bitcoin', '#btc'],
          'ethereum': ['ethereum', 'eth', '#ethereum', '#eth'],
          'solana': ['solana', 'sol', '#solana', '#sol'],
          'defi': ['defi', 'finance', 'yield', 'liquidity', '#defi'],
          'nft': ['nft', 'nfts', '#nft', '#nfts'],
          'stonks': ['stonks', '#stonks']
        };
        
        return topicKeywords[topic]?.some(keyword => content.includes(keyword));
      });
    }
    
    // 应用排序
    if (sortBy === 'trending') {
      posts.sort((a, b) => (b.likes + b.comments * 2 + b.shares * 3) - (a.likes + a.comments * 2 + a.shares * 3));
    } else if (sortBy === 'latest') {
      posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    return posts;
  }, [newsData, tweetsData, topic, sortBy]);
  
  // 是否加载中
  const isLoading = isLoadingNews || isLoadingTweets;
  
  // 是否有错误
  const hasError = newsError || tweetsError;
  
  // 根据当前标签筛选匹配的帖子
  const currentPosts = React.useMemo(() => {
    if (currentTab === 'trending') {
      // 热门标签显示所有内容但按参与度排序
      return combinedPosts.slice(0, 30);
    } else if (currentTab === 'latest') {
      // 最新标签按时间排序
      return [...combinedPosts].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 30);
    } else if (currentTab === 'news') {
      // 新闻标签只显示新闻来源
      return combinedPosts.filter(post => post.source === 'news').slice(0, 30);
    } else if (currentTab === 'tweets') {
      // 推文标签只显示推文
      return combinedPosts.filter(post => post.source === 'twitter').slice(0, 30);
    } else {
      return combinedPosts.slice(0, 30);
    }
  }, [currentTab, combinedPosts]);
  
  return (
    <Layout>
      <div className={styles.pulseContainer}>
        <header className={styles.header}>
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
              <PiTrendUp className="text-accent" />
              {language === 'zh' ? '加密脉搏' : 'Crypto Pulse'}
            </h1>
            <StonksPriceDisplay />
          </div>
        </header>
        
        <main className={styles.mainContent}>
          <div className={styles.trendingHeader}>
            <PiTrendUp className={styles.trendingIcon} />
            <h2 className="text-xl font-semibold">{language === 'zh' ? '最热讨论' : 'Trending Topics'}</h2>
          </div>
          
          {/* 价格卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dummyPriceStats.map((stats, index) => (
              <PriceStatsCard key={index} stats={stats} />
            ))}
          </div>
          
          {/* 标签页 */}
          <Tabs defaultValue="trending" onValueChange={setCurrentTab} className="mb-8">
            <TabsList className={styles.tabsList}>
              <TabsTrigger 
                value="trending" 
                className={currentTab === 'trending' ? styles.tabsTriggerActive : styles.tabsTrigger}
              >
                <PiTrendUp className="mr-1" />
                {language === 'zh' ? '热门趋势' : 'Trending'}
              </TabsTrigger>
              <TabsTrigger 
                value="latest" 
                className={currentTab === 'latest' ? styles.tabsTriggerActive : styles.tabsTrigger}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {language === 'zh' ? '最新动态' : 'Latest'}
              </TabsTrigger>
              <TabsTrigger 
                value="news" 
                className={currentTab === 'news' ? styles.tabsTriggerActive : styles.tabsTrigger}
              >
                <HiOutlineNewspaper className="mr-1" />
                {language === 'zh' ? '新闻' : 'News'}
              </TabsTrigger>
              <TabsTrigger 
                value="tweets" 
                className={currentTab === 'tweets' ? styles.tabsTriggerActive : styles.tabsTrigger}
              >
                <FaTwitter className="mr-1" />
                {language === 'zh' ? '推文' : 'Tweets'}
              </TabsTrigger>
            </TabsList>
            
            {/* 筛选器和排序选项 */}
            <div className={styles.filterSection}>
              <Select
                value={topic}
                onValueChange={setTopic}
              >
                <SelectTrigger className={styles.topicSelect}>
                  <SelectValue placeholder={language === 'zh' ? '所有主题' : 'All Topics'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'zh' ? '所有主题' : 'All Topics'}</SelectItem>
                  <SelectItem value="bitcoin" className="flex items-center">
                    <FaBitcoin className="mr-2 text-orange-500" />
                    {language === 'zh' ? '比特币 (BTC)' : 'Bitcoin (BTC)'}
                  </SelectItem>
                  <SelectItem value="ethereum">
                    <div className="flex items-center">
                      <FaEthereum className="mr-2 text-blue-400" />
                      {language === 'zh' ? '以太坊 (ETH)' : 'Ethereum (ETH)'}
                    </div>
                  </SelectItem>
                  <SelectItem value="solana">
                    <div className="flex items-center">
                      <SiSolana className="mr-2 text-purple-500" />
                      {language === 'zh' ? '索拉纳 (SOL)' : 'Solana (SOL)'}
                    </div>
                  </SelectItem>
                  <SelectItem value="defi">
                    {language === 'zh' ? '去中心化金融 (DeFi)' : 'DeFi'}
                  </SelectItem>
                  <SelectItem value="nft">
                    {language === 'zh' ? '非同质化代币 (NFT)' : 'NFTs'}
                  </SelectItem>
                  <SelectItem value="stonks">STONKS</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className={styles.sortSelect}>
                  <SelectValue placeholder={language === 'zh' ? '排序方式' : 'Sort by'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">
                    <div className="flex items-center">
                      <PiTrendUp className="mr-2" />
                      {language === 'zh' ? '按热度排序' : 'Sort by trending'}
                    </div>
                  </SelectItem>
                  <SelectItem value="latest">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {language === 'zh' ? '按时间排序' : 'Sort by time'}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 加载状态 */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-3 w-16 bg-gray-700/50 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-5/6 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-2/3 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="mt-4 h-40 bg-gray-700/50 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 错误状态 */}
            {hasError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">{language === 'zh' ? '加载内容失败' : 'Error loading content'}</h3>
                <p className="text-gray-400 mb-4">{language === 'zh' ? '请稍后再试' : 'Please try again later'}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {language === 'zh' ? '刷新' : 'Refresh'}
                </Button>
              </div>
            )}

            {/* 内容列表 */}
            {!isLoading && !hasError && currentPosts.length > 0 && (
              <div className={styles.gridContainer}>
                {currentPosts.map(post => (
                  <SocialPostCard key={`${post.source}-${post.id}`} post={post} />
                ))}
              </div>
            )}

            {/* 无内容状态 */}
            {!isLoading && !hasError && currentPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">{language === 'zh' ? '暂无可用内容' : 'No content available'}</h3>
                <p className="text-gray-400 mb-4">
                  {language === 'zh' 
                    ? '当前没有符合筛选条件的内容' 
                    : 'There is no content matching your filter criteria'}
                </p>
                <Button 
                  onClick={() => {
                    setTopic('all');
                    setCurrentTab('trending');
                  }}
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  {language === 'zh' ? '清除筛选条件' : 'Clear filters'}
                </Button>
              </div>
            )}
          </Tabs>
        </main>
      </div>
    </Layout>
  );
};

export default CryptoPulse;