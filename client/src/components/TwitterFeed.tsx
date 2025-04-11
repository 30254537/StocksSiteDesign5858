import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tweet } from '@shared/schema';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { FaTwitter, FaExternalLinkAlt } from 'react-icons/fa';

interface TwitterFeedProps {
  limit?: number;
  showRefresh?: boolean;
  minimal?: boolean;
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ 
  limit = 3, 
  showRefresh = true,
  minimal = false
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 获取推文列表
  const { 
    data: tweetsData, 
    isLoading, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['/api/tweets'],
    queryFn: async () => {
      const response = await fetch(`/api/tweets?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('获取推文失败');
      }
      
      const data = await response.json();
      return data.data as Tweet[];
    },
    staleTime: 60000, // 一分钟内不重新获取
  });
  
  // 刷新推文数据
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync-tweets");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tweets'] });
      toast({
        title: language === 'zh' ? "刷新成功" : "Refresh successful",
        description: language === 'zh' ? "已获取最新推文" : "Latest tweets have been fetched",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'zh' ? "刷新失败" : "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleRefresh = () => {
    syncMutation.mutate();
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // 解析推特链接
  const getTweetUrl = (tweet: Tweet) => {
    return `https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`;
  };
  
  // 获取用户个人资料链接
  const getUserProfileUrl = (username: string) => {
    return `https://twitter.com/${username}`;
  };
  
  if (error) {
    return (
      <Card className="bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8 text-gray-400 flex-col gap-2">
            <FaTwitter className="text-2xl text-blue-400 mb-2" />
            <p>{language === 'zh' ? '获取推文失败' : 'Failed to fetch tweets'}</p>
            {showRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={syncMutation.isPending}
                className="mt-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {language === 'zh' ? '重试' : 'Retry'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!tweetsData || tweetsData.length === 0) {
    return (
      <Card className="bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-center p-8 text-gray-400 flex-col gap-2">
            <FaTwitter className="text-2xl text-blue-400 mb-2" />
            <p>{language === 'zh' ? '暂无推文数据' : 'No tweets available'}</p>
            {showRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={syncMutation.isPending}
                className="mt-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {language === 'zh' ? '获取推文' : 'Fetch Tweets'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (minimal) {
    return (
      <div className="space-y-2 relative">
        {isFetching && (
          <div className="absolute right-0 top-0">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          </div>
        )}
        
        {tweetsData.map((tweet) => (
          <div key={tweet.id} className="p-3 bg-gray-800/30 rounded-md border border-gray-700 hover:border-blue-700 transition-colors">
            <div className="text-sm text-gray-300">
              {tweet.text.length > 100 
                ? `${tweet.text.substring(0, 100)}...` 
                : tweet.text}
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {formatDate(tweet.createdAt.toString())}
              </div>
              <a 
                href={getTweetUrl(tweet)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              >
                <FaExternalLinkAlt className="mr-1 h-2 w-2" />
                {language === 'zh' ? '查看' : 'View'}
              </a>
            </div>
          </div>
        ))}
        
        {showRefresh && (
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={syncMutation.isPending || isFetching}
              className="w-full text-xs h-8 bg-blue-900/30 border-blue-700 hover:bg-blue-900/50 hover:text-blue-300"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              {language === 'zh' ? '刷新推文' : 'Refresh Tweets'}
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {showRefresh && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={syncMutation.isPending || isFetching}
            className="flex items-center gap-1"
          >
            {(syncMutation.isPending || isFetching) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {language === 'zh' ? '刷新' : 'Refresh'}
          </Button>
        </div>
      )}
      
      {tweetsData.map((tweet) => (
        <Card 
          key={tweet.id} 
          className="bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {tweet.profileImageUrl ? (
                <img 
                  src={tweet.profileImageUrl} 
                  alt={tweet.authorName} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
                  <FaTwitter className="text-blue-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <a 
                    href={getUserProfileUrl(tweet.authorUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:underline truncate"
                  >
                    {tweet.authorName}
                  </a>
                  <span className="text-gray-500 text-sm">@{tweet.authorUsername}</span>
                </div>
                
                <p className="mt-1 text-gray-300">{tweet.text}</p>
                
                {tweet.mediaUrl && (
                  <div className="mt-2 rounded-md overflow-hidden">
                    <img 
                      src={tweet.mediaUrl} 
                      alt="Tweet media" 
                      className="w-full h-auto max-h-56 object-cover"
                    />
                  </div>
                )}
                
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {formatDate(tweet.createdAt.toString())}
                  </span>
                  
                  <a 
                    href={getTweetUrl(tweet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <FaExternalLinkAlt className="h-3 w-3" />
                    {language === 'zh' ? '查看推文' : 'View Tweet'}
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TwitterFeed;