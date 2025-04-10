import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Repeat2, Heart, Copy, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// 推文接口
interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
}

interface Tweet {
  id: number;
  tweetId: string;
  text: string;
  translatedText?: string;
  authorName: string;
  authorUsername: string;
  authorProfileImage: string | null;
  metrics: TweetMetrics;
  url: string;
  createdAt: string;
  isTranslated: boolean;
  category?: string;
  contractAddress?: string;
}

interface TweetsResponse {
  data: Tweet[];
}

const CryptoTweets: React.FC = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('trending');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // 获取推文数据
  const { data: tweetsData, isLoading, error } = useQuery<TweetsResponse>({
    queryKey: ['/api/crypto-tweets', { lang: language }],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
  
  // 获取合约地址推文数据
  const { data: contractTweetsData, isLoading: isContractLoading } = useQuery<TweetsResponse>({
    queryKey: ['/api/contract-tweets', { lang: language }],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
  
  // 复制合约地址到剪贴板
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: language === 'zh' ? "已复制合约地址" : "Contract address copied",
        description: address,
        duration: 2000,
      });
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      toast({
        title: language === 'zh' ? "复制失败" : "Copy failed",
        description: language === 'zh' ? "请手动复制地址" : "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: language === 'zh' ? zhCN : enUS 
      });
    } catch (e) {
      return '';
    }
  };

  // 处理数字格式化 (1.2K, 3.5M等)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (isLoading && isContractLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">{t('cryptoTweets.title')}</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('获取推文失败:', error);
    return (
      <div className="text-center p-6">
        <p className="text-red-500">{t('cryptoTweets.error')}</p>
      </div>
    );
  }

  const tweets = tweetsData?.data || [];
  const contractTweets = contractTweetsData?.data || [];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t('cryptoTweets.title')}</h2>
      </div>

      <Tabs defaultValue="trending" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="trending">{t('cryptoTweets.trending')}</TabsTrigger>
          <TabsTrigger value="popular">{t('cryptoTweets.popular')}</TabsTrigger>
          <TabsTrigger value="contracts">{t('cryptoTweets.contracts')}</TabsTrigger>
        </TabsList>

        {/* 最新推文标签页 */}
        <TabsContent value="trending" className="space-y-4">
          {tweets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>{t('cryptoTweets.noTweets')}</p>
              </CardContent>
            </Card>
          ) : (
            tweets.map((tweet) => (
              <Card key={tweet.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <Avatar className="h-10 w-10">
                      {tweet.authorProfileImage ? (
                        <AvatarImage src={tweet.authorProfileImage} alt={tweet.authorName} />
                      ) : (
                        <AvatarFallback>{tweet.authorName.substring(0, 2)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{tweet.authorName}</p>
                          <p className="text-xs text-muted-foreground">@{tweet.authorUsername}</p>
                        </div>
                        <a 
                          href={tweet.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          X
                        </a>
                      </div>
                      <p className="text-sm mt-2">
                        {language === 'zh' && tweet.translatedText 
                          ? tweet.translatedText 
                          : tweet.text}
                      </p>
                      {language === 'zh' && tweet.translatedText && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {t('cryptoTweets.translated')}
                        </p>
                      )}
                      <div className="flex space-x-4 mt-3">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.replies)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Repeat2 className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.retweets)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.likes)}</span>
                        </div>
                        <div className="flex-grow text-right">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(tweet.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 热门推文标签页 */}
        <TabsContent value="popular" className="space-y-4">
          {tweets
            .sort((a, b) => b.metrics.likes - a.metrics.likes)
            .slice(0, 5)
            .map((tweet) => (
              <Card key={tweet.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <Avatar className="h-10 w-10">
                      {tweet.authorProfileImage ? (
                        <AvatarImage src={tweet.authorProfileImage} alt={tweet.authorName} />
                      ) : (
                        <AvatarFallback>{tweet.authorName.substring(0, 2)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{tweet.authorName}</p>
                          <p className="text-xs text-muted-foreground">@{tweet.authorUsername}</p>
                        </div>
                        <a
                          href={tweet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          X
                        </a>
                      </div>
                      <p className="text-sm mt-2">
                        {language === 'zh' && tweet.translatedText 
                          ? tweet.translatedText 
                          : tweet.text}
                      </p>
                      {language === 'zh' && tweet.translatedText && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {t('cryptoTweets.translated')}
                        </p>
                      )}
                      <div className="flex space-x-4 mt-3">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.replies)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Repeat2 className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.retweets)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span>{formatNumber(tweet.metrics.likes)}</span>
                        </div>
                        <div className="flex-grow text-right">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(tweet.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
        
        {/* 合约地址推文标签页 */}
        <TabsContent value="contracts" className="space-y-4">
          {isContractLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <LoadingSkeleton key={i} className="h-32" />
              ))}
            </div>
          ) : contractTweets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>{t('cryptoTweets.noContractTweets')}</p>
              </CardContent>
            </Card>
          ) : (
            contractTweets
              .sort((a, b) => b.metrics.retweets - a.metrics.retweets)
              .map((tweet) => (
                <Card key={tweet.id} className="overflow-hidden hover:shadow-md transition-shadow border-primary-darker">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <Avatar className="h-10 w-10">
                        {tweet.authorProfileImage ? (
                          <AvatarImage src={tweet.authorProfileImage} alt={tweet.authorName} />
                        ) : (
                          <AvatarFallback>{tweet.authorName.substring(0, 2)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{tweet.authorName}</p>
                            <p className="text-xs text-muted-foreground">@{tweet.authorUsername}</p>
                          </div>
                          <a
                            href={tweet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            X
                          </a>
                        </div>
                        {tweet.contractAddress ? (
                          <div className="mt-2">
                            <p className="text-sm whitespace-pre-wrap">
                              {language === 'zh' && tweet.translatedText 
                                ? tweet.translatedText.replace(tweet.contractAddress, '') 
                                : tweet.text.replace(tweet.contractAddress, '')}
                            </p>
                            
                            <div className="flex items-center mt-2 bg-primary/10 p-2 rounded-md">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex-1 font-mono text-xs text-accent break-all select-all">
                                      {tweet.contractAddress}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{language === 'zh' ? '点击复制' : 'Click to copy'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-1 h-6 w-6 p-0" 
                                onClick={() => copyToClipboard(tweet.contractAddress || '')}
                              >
                                {copiedAddress === tweet.contractAddress ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            
                            {language === 'zh' && tweet.translatedText && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {t('cryptoTweets.translated')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm mt-2 whitespace-pre-wrap">
                              {language === 'zh' && tweet.translatedText 
                                ? tweet.translatedText 
                                : tweet.text}
                            </p>
                            {language === 'zh' && tweet.translatedText && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {t('cryptoTweets.translated')}
                              </p>
                            )}
                          </>
                        )}
                        <div className="flex space-x-4 mt-3">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MessageCircle className="h-3 w-3" />
                            <span>{formatNumber(tweet.metrics.replies)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Repeat2 className="h-3 w-3" />
                            <span>{formatNumber(tweet.metrics.retweets)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            <span>{formatNumber(tweet.metrics.likes)}</span>
                          </div>
                          <div className="flex-grow text-right">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(tweet.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
      
      <div className="text-right mt-4">
        <Link 
          to="/crypto-tweets" 
          className="text-sm text-primary hover:underline"
        >
          {t('cryptoTweets.viewAll')} &rarr;
        </Link>
      </div>
    </div>
  );
};

export default CryptoTweets;