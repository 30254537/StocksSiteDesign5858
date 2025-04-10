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

const PAGE_SIZE = 10;

const CryptoNews: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
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
  
  // 格式化发布日期
  const formatPublishedDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: language === 'zh' ? zhCN : enUS 
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-teal-400">
            {t('cryptoNews.title')}
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
              <Card key={news.id} className="overflow-hidden border-teal-500/20 shadow-lg bg-gray-900">
                {news.imageUrl && (
                  <div className="w-full h-40 overflow-hidden">
                    <img 
                      src={news.imageUrl} 
                      alt={news.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-teal-500 hover:bg-teal-600">
                      {t('cryptoNews.featured')}
                    </Badge>
                    <Badge variant="outline">{news.source}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2 line-clamp-2">{news.title}</CardTitle>
                </CardHeader>
                <CardFooter className="pt-0 flex justify-between">
                  <span className="text-xs text-gray-400">
                    {formatPublishedDate(news.publishedAt)}
                  </span>
                  <Button variant="link" asChild>
                    <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {t('cryptoNews.readMore')}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}
        
        {/* 新闻分类选项卡 */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => handleCategoryChange('all')}>
              {t('cryptoNews.allNews')}
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
                  {t('cryptoNews.error')}
                </p>
              </div>
            ) : newsData && newsData.data.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-lg text-gray-400">
                  {t('cryptoNews.noNews')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsData?.data.map((news) => (
                  <Card key={news.id} className="overflow-hidden border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col md:flex-row">
                      {news.imageUrl && (
                        <div className="w-full md:w-1/4 h-40 md:h-auto overflow-hidden">
                          <img 
                            src={news.imageUrl} 
                            alt={news.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`flex-1 flex flex-col ${news.imageUrl ? 'md:w-3/4' : 'w-full'}`}>
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
                          <Button variant="link" asChild className="ml-auto">
                            <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                              {t('cryptoNews.readMore')}
                            </a>
                          </Button>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
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
            {t('cryptoNews.stayUpdated')}
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