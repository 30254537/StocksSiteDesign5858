import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTelegram } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// 日期格式化
const formatMessageDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  const locale = language === 'zh' ? zhCN : enUS;
  return format(date, 'yyyy-MM-dd HH:mm', { locale });
};

// 定义 Telegram 消息接口
interface TelegramMessage {
  id: number;
  messageId: number;
  text: string;
  sender: string;
  channelTitle: string;
  date: string;
}

interface TgLatestMessagesProps {
  limit?: number;
  showTitle?: boolean;
}

const TgLatestMessages: React.FC<TgLatestMessagesProps> = ({ 
  limit = 3, 
  showTitle = true 
}) => {
  const { language } = useLanguage();
  
  const { data: telegramData, isLoading, error } = useQuery<{ data: TelegramMessage[] }>({
    queryKey: ['/api/telegram-messages'],
    staleTime: 60 * 1000, // 1分钟
  });
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-20 w-full bg-gray-700 rounded-md" />
        <Skeleton className="h-20 w-full bg-gray-700 rounded-md" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-4">
          <div className="text-center text-red-400">
            <p className="mb-2">{language === 'zh' ? '获取 TG 消息失败' : 'Failed to fetch TG messages'}</p>
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
            <FaTelegram className="mx-auto text-2xl mb-2 text-blue-400" />
            <p className="mb-2">{language === 'zh' ? '暂无 TG 消息' : 'No TG messages'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 只显示指定数量的消息
  const messages = telegramData.data.slice(0, limit);
  
  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center space-x-2 mb-2">
          <FaTelegram className="text-blue-400 text-xl" />
          <h3 className="text-lg font-medium text-teal-400">
            {language === 'zh' ? 'TG最新推送' : 'Latest TG Posts'}
          </h3>
        </div>
      )}
      
      {messages.map((message) => (
        <Card key={message.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <CardContent className="pt-4 pb-3">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm text-blue-400">{message.sender}</span>
              <span className="text-xs text-gray-400">{formatMessageDate(message.date, language)}</span>
            </div>
            <p className="text-sm text-gray-200">{message.text}</p>
            <div className="mt-2">
              <a 
                href={`https://t.me/chengzi_golden/${message.messageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                {language === 'zh' ? '查看原文' : 'View original'}
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TgLatestMessages;