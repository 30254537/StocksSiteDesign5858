import React, { useState } from 'react';
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import TgLatestMessages from '@/components/TgLatestMessages';
import { FaTelegram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const TelegramMessages: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 同步最新金狗监测消息的mutaiton
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
          ? `已同步 ${data.data.length} 条金狗监测提醒消息` 
          : `Synced ${data.data.length} Golden Dog monitoring alerts`,
        variant: 'default',
      });
      
      // 刷新消息列表
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-messages'] });
    },
    onError: (error) => {
      console.error('同步消息失败:', error);
      toast({
        title: language === 'zh' ? '同步失败' : 'Sync Failed',
        description: language === 'zh' 
          ? '无法同步最新金狗监测提醒消息，请稍后再试' 
          : 'Failed to sync Golden Dog monitoring alerts, please try again later',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });
  
  // 同步最新金狗监测提醒消息
  const handleSyncMessages = () => {
    syncMessagesMutation.mutate();
  };
  
  return (
    <Container className="py-8">
      <PageHeader className="pb-6">
        <div className="flex items-center gap-2">
          <FaTelegram className="text-2xl text-blue-400" />
          <PageHeaderHeading className="text-teal-400">
            {language === 'zh' ? '金狗监测' : 'Golden Dog'}
          </PageHeaderHeading>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-muted-foreground mt-1">
            {language === 'zh' 
              ? '来自GoldDogAlpha频道的最新代币监测信息，每分钟自动同步' 
              : 'Latest token monitoring alerts from GoldDogAlpha channel, auto-synced every minute'}
          </p>
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
              {language === 'zh' ? '立即同步' : 'Sync Now'}
            </Button>
            <Badge className="bg-blue-500 hover:bg-blue-600">
              <a 
                href="https://t.me/GoldDogAlpha" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <FaTelegram />
                {language === 'zh' ? '关注频道' : 'Follow Channel'}
              </a>
            </Badge>
          </div>
        </div>
      </PageHeader>
      
      <div className="mt-4">
        <TgLatestMessages limit={20} showTitle={false} />
      </div>
    </Container>
  );
};

export default TelegramMessages;