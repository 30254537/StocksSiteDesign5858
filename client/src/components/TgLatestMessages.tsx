import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaTelegram, FaBell, FaSync, FaNewspaper, FaExternalLinkAlt } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 日期格式化
const formatMessageDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  const locale = language === 'zh' ? zhCN : enUS;
  return format(date, 'yyyy/MM/dd HH:mm:ss', { locale });
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
        <Skeleton className="h-32 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-32 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-32 w-full bg-gray-700 rounded-md" />
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
            <FaNewspaper className="mx-auto text-2xl mb-2 text-blue-400" />
            <p className="mb-2">{language === 'zh' ? '暂无加密快讯' : 'No crypto news'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 截取限制数量的消息
  const messagesWithLimit = telegramData.data.slice(0, limit);
  
  // 打印原始消息以便调试
  console.log('原始消息列表:', telegramData?.data);
  
  return (
    <div className="space-y-5">
      {showTitle && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FaNewspaper className="text-yellow-400 text-xl" />
            <h3 className="text-lg font-medium text-teal-400">
              {language === 'zh' ? '加密快讯' : 'Crypto News'}
            </h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8 px-3 bg-gray-800/60 border-teal-800 hover:bg-gray-800 hover:text-teal-400"
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
                {language === 'zh' ? '刷新消息' : 'Refresh'}
              </>
            )}
          </Button>
        </div>
      )}
      
      {messagesWithLimit.map((message: TelegramMessage) => {
        // 提取标题和内容（通常标题在第一行，内容在第二行之后）
        const lines = message.text.split('\n');
        const title = lines.length > 1 ? lines[0] : '';
        const content = lines.length > 1 ? lines.slice(1).join('\n') : message.text;
        
        return (
          <Card 
            key={message.id} 
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors shadow-lg shadow-teal-800/10 cursor-pointer"
            onClick={() => {
              if (message.sourceUrl) {
                window.open(message.sourceUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <FaNewspaper className="text-yellow-400" />
                  <span className="font-bold text-yellow-400">
                    {message.channelTitle || "🟢 加密快讯"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatMessageDate(message.date, language)}
                </span>
              </div>
              
              {/* 消息内容 */}
              <div className="mt-2 whitespace-pre-wrap break-all text-white">
                {message.text}
              </div>
              
              <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2">
                <span className="text-xs text-gray-500">
                  {message.sender ? `来源: ${message.sender}` : "加密资讯频道"}
                </span>
                {message.sourceUrl && (
                  <a 
                    href={message.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止冒泡，避免触发Card的点击事件
                    }}
                  >
                    {language === 'zh' ? '阅读全文' : 'Read more'} 
                    <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TgLatestMessages;