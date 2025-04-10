import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Repeat2, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

interface TweetsResponse {
  data: Tweet[];
}

const CryptoTweets: React.FC = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('tweets');
  
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

  if (isLoading) {
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

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t('cryptoTweets.title')}</h2>
      </div>

      <Tabs defaultValue="tweets" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="tweets">{t('cryptoTweets.trending')}</TabsTrigger>
          <TabsTrigger value="news">{t('cryptoTweets.popular')}</TabsTrigger>
        </TabsList>

        <TabsContent value="tweets" className="space-y-4">
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

        <TabsContent value="news" className="space-y-4">
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