import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaSync } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

// 日期格式化
const formatMessageDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  const locale = language === 'zh' ? zhCN : enUS;
  return format(date, 'yyyy/MM/dd HH:mm', { locale });
};

// 定义 Telegram 消息接口
interface TelegramMessage {
  id: number;
  messageId: number;
  text: string;
  sender: string;
  channelTitle: string;
  date: string;
  sourceUrl?: string;
}

interface TgLatestMessagesProps {
  limit?: number;
  showTitle?: boolean;
}

const TgLatestMessages: React.FC<TgLatestMessagesProps> = ({ 
  limit = 5, 
  showTitle = true 
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setLocation] = useLocation();
  
  // 用于手动同步Telegram消息的mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const res = await apiRequest("POST", "/api/sync-telegram-messages");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'zh' ? "同步成功" : "Synchronization successful",
        description: language === 'zh' ? "已成功同步最新消息" : "Successfully synchronized the latest messages",
        variant: "default",
      });
      // 刷新消息数据
      queryClient.invalidateQueries({ queryKey: ['/api/telegram-messages'] });
      setIsSyncing(false);
    },
    onError: (error) => {
      toast({
        title: language === 'zh' ? "同步失败" : "Synchronization failed", 
        description: (error as Error).message || (language === 'zh' ? "请稍后再试" : "Please try again later"),
        variant: "destructive",
      });
      setIsSyncing(false);
    }
  });
  
  // 获取Telegram消息列表
  const { data: telegramData, isLoading, error } = useQuery<{ data: TelegramMessage[] }>({
    queryKey: ['/api/telegram-messages'],
    staleTime: 60 * 1000, // 1分钟
  });
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-24 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-24 w-full bg-gray-700 rounded-md" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-4">
          <div className="text-center text-red-400">
            <p className="mb-2">{language === 'zh' ? '获取加密快讯失败' : 'Failed to fetch crypto news'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 如果没有消息，显示空状态
  if (!telegramData || telegramData.data.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-4">
          <div className="text-center text-gray-400">
            <p className="mb-2">{language === 'zh' ? '暂无加密快讯' : 'No crypto news'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 截取限制数量的消息
  const messagesWithLimit = telegramData.data.slice(0, limit);
  
  return (
    <div className="pb-8">
      {showTitle && (
        <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
            {language === 'zh' ? '加密快讯' : 'Crypto News'}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full px-3 bg-gray-800/60 border-teal-800 hover:bg-gray-800 hover:text-teal-400 transition-all"
            onClick={() => syncMutation.mutate()}
            disabled={isSyncing || syncMutation.isPending}
          >
            {(isSyncing || syncMutation.isPending) ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {language === 'zh' ? '同步中...' : 'Syncing...'}
              </>
            ) : (
              <>
                <FaSync className="mr-1 h-3 w-3" />
                {language === 'zh' ? '实时更新' : 'Update'}
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="grid gap-4">
        {messagesWithLimit.map((message: TelegramMessage, index) => {
          // 提取标题和内容
          const lines = message.text.split('\n').filter(line => line.trim() !== '');
          
          let title = '';
          let content = '';
          
          if (lines.length >= 3) {
            title = lines[1]; // 第二行是实际的新闻标题
            const contentLines = lines.slice(2, -1);
            content = contentLines.join('\n');
          } else if (lines.length === 2) {
            title = lines[0];
            content = lines[1];
          } else if (lines.length === 1) {
            title = '加密快讯';
            content = lines[0];
          } else {
            title = '加密快讯';
            content = '';
          }
          
          // 移除可能包含的日期时间信息
          content = content.replace(/\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}(:\d{1,2})?/g, '').trim();
          
          // 确保内容不为空
          if (!content) {
            content = '';
          }
          
          return (
            <Card 
              key={message.id} 
              className="overflow-hidden bg-gray-900/70 border-gray-800 hover:bg-gray-800 cursor-pointer relative group transition-colors"
              onClick={() => setLocation(`/news/${message.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2 opacity-50 text-xs">
                  <span className="text-gray-400">{formatMessageDate(message.date, language)}</span>
                </div>
                
                <h3 className="font-bold text-teal-400 text-lg mb-2 hover:translate-x-1 transition-transform group-hover:text-teal-300">
                  {title}
                </h3>
                
                {content && (
                  <div className="text-gray-300 text-sm">
                    {content}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TgLatestMessages;