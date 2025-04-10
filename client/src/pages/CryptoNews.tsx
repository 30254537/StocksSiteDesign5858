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
  } = useQuery<{ 
    data: CryptoNewsType[], 
    pagination: { 
      total: number, 
      limit: number, 
      offset: number, 
      hasMore: boolean 
    } 
  }>({
    queryKey: ['/api/news', currentPage, PAGE_SIZE],
    queryFn: async () => {
      const res = await fetch(`/api/news?limit=${PAGE_SIZE}&offset=${offset}`);
      return await res.json();
    }
  });
  
  // 获取突出显示的新闻
  const { 
    data: highlightedNews, 
    isLoading: isLoadingHighlighted 
  } = useQuery<CryptoNewsType[]>({
    queryKey: ['/api/news/highlighted'],
    queryFn: async () => {
      const res = await fetch('/api/news/highlighted');
      return await res.json();
    }
  });
  
  // 处理分页变更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // 计算总页数
  const totalPages = newsData 
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
    
    // 使用更多多样化的图片集合 - 按来源和内容匹配
    // 源特定图片
    const sourceImages: Record<string, string[]> = {
      'CoinGecko': [
        'https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca4be1c81f0db30e924154750d208683fad7ae6f2ce06c76d0a56.png',
        'https://cryptologos.cc/logos/coingecko-cg-logo.png'
      ],
      'CoinTelegraph': [
        'https://s2.coinmarketcap.com/static/img/coins/200x200/8996.png',
        'https://cryptologos.cc/logos/cointelegraph-ct-logo.png'
      ],
      'TheBlock': [
        'https://pbs.twimg.com/profile_images/1559173535693926400/BV9v1HDo_400x400.jpg',
        'https://cryptologos.cc/logos/the-block-block-logo.png'
      ],
      'CoinDesk': [
        'https://cryptologos.cc/logos/coindesk-cd-logo.png',
        'https://pbs.twimg.com/profile_images/1599803099607384066/UW4sH2ii_400x400.jpg'
      ],
      '8BTC': [
        'https://pbs.twimg.com/profile_images/1275716146762661890/BP8aHRk2_400x400.jpg',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple114/v4/8a/88/bd/8a88bd76-e81f-87b9-0c24-7a29b9b5d9f5/source/512x512bb.jpg'
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
    
    // 根据内容选择相应类别的图片
    const title = (news.title || '').toLowerCase();
    const content = (news.content || '').toLowerCase();
    
    if (title.includes('bitcoin') || content.includes('bitcoin') || title.includes('btc') || content.includes('btc')) {
      return selectRandom(contentImages.bitcoin);
    } else if (title.includes('ethereum') || content.includes('ethereum') || title.includes('eth') || content.includes('eth')) {
      return selectRandom(contentImages.ethereum);
    } else if (title.includes('nft') || content.includes('nft')) {
      return selectRandom(contentImages.nft);
    } else if (title.includes('defi') || content.includes('defi')) {
      return selectRandom(contentImages.defi);
    } else if (title.includes('stonks') || content.includes('stonks')) {
      return selectRandom(contentImages.stonks);
    }
    
    // 使用通用加密货币图片
    return selectRandom(contentImages.general);
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
                    <img 
                      src={getNewsImage(news)} 
                      alt={news.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-teal-500 hover:bg-teal-600">
                        {getLocalTranslation('cryptoNews.featured')}
                      </Badge>
                      <Badge variant="outline">{news.source}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">{news.title}</CardTitle>
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
                          <img 
                            src={getNewsImage(news)} 
                            alt={news.title} 
                            className="w-full h-full object-cover"
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
                            <CardTitle className="text-xl">{news.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2">
                              {news.content}
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