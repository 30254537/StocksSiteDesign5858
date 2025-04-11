import React, { useState, useEffect } from 'react';
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import TgLatestMessages from '@/components/TgLatestMessages';
import { FaTelegram, FaNewspaper } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Clock } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const TelegramMessages: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 使用useQuery获取最新消息，自动每分钟刷新一次
  const { data: messagesData } = useQuery({
    queryKey: ['/api/telegram-messages'],
    refetchInterval: 60000, // 每60秒自动刷新一次
  });
  
  // 记录上次更新时间
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // 当消息数据更新时，更新上次更新时间
  useEffect(() => {
    if (messagesData) {
      setLastUpdateTime(new Date());
    }
  }, [messagesData]);
  
  // 同步最新加密快讯消息的mutation
  const syncMessagesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync-telegram-messages');
      return await response.json();
    },
    onMutate: () => {
      setIsSyncing(true);
    },
    onSuccess: (data) => {
      // 显示成功消息
      toast({
        title: language === 'zh' ? '同步成功' : 'Sync Successful',
        description: language === 'zh' 
          ? `已同步 ${data.data.length} 条加密快讯资讯` 
          : `Synced ${data.data.length} crypto news items`,
        variant: 'default',
      });
      
      // 刷新消息列表
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-messages'] });
      // 更新上次更新时间
      setLastUpdateTime(new Date());
    },
    onError: (error) => {
      console.error('同步消息失败:', error);
      toast({
        title: language === 'zh' ? '同步失败' : 'Sync Failed',
        description: language === 'zh' 
          ? '无法同步最新加密快讯资讯，请稍后再试' 
          : 'Failed to sync crypto news, please try again later',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });
  
  // 同步最新加密快讯资讯
  const handleSyncMessages = () => {
    syncMessagesMutation.mutate();
  };
  
  return (
    <Container className="py-8">
      <PageHeader className="pb-6">
        <div className="flex items-center gap-2">
          <FaNewspaper className="text-2xl text-teal-400" />
          <PageHeaderHeading className="text-teal-400">
            {language === 'zh' ? '加密快讯' : 'Crypto News'}
          </PageHeaderHeading>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <p className="text-muted-foreground mt-1">
              {language === 'zh' 
                ? '来自金色财经与火星财经的7x24小时实时资讯，每分钟自动更新' 
                : 'Real-time 7x24h news from JinSe Finance and Mars Finance, auto-synced every minute'}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {language === 'zh'
                  ? `上次更新: ${lastUpdateTime.toLocaleTimeString('zh-CN')}`
                  : `Last update: ${lastUpdateTime.toLocaleTimeString('en-US')}`}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 border-accent/30 hover:bg-accent/10"
              onClick={handleSyncMessages}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {language === 'zh' ? '立即更新' : 'Update Now'}
            </Button>
            <div className="flex gap-2">
              <Badge className="bg-amber-500 hover:bg-amber-600">
                <a 
                  href="https://www.jinse.cn/lives" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <FaNewspaper className="h-3 w-3" />
                  {language === 'zh' ? '金色财经' : 'JinSe Finance'}
                </a>
              </Badge>
              <Badge className="bg-red-500 hover:bg-red-600">
                <a 
                  href="https://news.marsbit.cc/flash" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <FaNewspaper className="h-3 w-3" />
                  {language === 'zh' ? '火星财经' : 'Mars Finance'}
                </a>
              </Badge>
            </div>
          </div>
        </div>
      </PageHeader>
      
      <div className="mt-4">
        <TgLatestMessages limit={30} showTitle={false} />
      </div>
    </Container>
  );
};

export default TelegramMessages;