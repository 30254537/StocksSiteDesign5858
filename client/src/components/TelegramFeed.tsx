import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// 用正确的 Telegram 图标替换
import { MessageCircle } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";

// 日期格式化
const formatTelegramDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} 小时前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} 天前`;
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString(undefined, options);
};

// 定义 Telegram 消息接口
interface TelegramMessage {
  id: number;
  messageId: number;
  text: string;
  sender: string;
  channelTitle: string;
  mediaUrl: string | null;
  date: string;
}

const TelegramFeed: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('latest');
  
  const { data: telegramData, isLoading, error } = useQuery<{ data: TelegramMessage[] }>({
    queryKey: ['/api/telegram-messages'],
    staleTime: 60 * 1000, // 1分钟
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Skeleton className="h-4 w-1/3 bg-gray-700" />
            <Skeleton className="h-8 w-3/4 bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full bg-gray-700" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-1/4 bg-gray-700" />
          </CardFooter>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Skeleton className="h-4 w-1/3 bg-gray-700" />
            <Skeleton className="h-8 w-3/4 bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full bg-gray-700" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-1/4 bg-gray-700" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <p className="mb-2">获取 Telegram 消息失败</p>
            <p className="text-sm text-gray-400">请稍后重试</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 如果没有消息，显示空状态
  if (!telegramData || telegramData.data.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            <FaTelegram className="mx-auto text-4xl mb-2 text-blue-400" />
            <p className="mb-2">暂无 Telegram 消息</p>
            <p className="text-sm">
              <a 
                href="https://t.me/chengzi_golden" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                关注我们的 Telegram 频道
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center text-teal-400">
        <FaTelegram className="mr-2" />
        {language === 'zh' ? '橙子Telegram频道' : 'Chengzi Telegram Channel'}
      </h3>
      
      {telegramData.data.map((message) => (
        <Card key={message.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Avatar className="mr-2 h-8 w-8 bg-blue-500">
                <AvatarImage src="/images/telegram-logo.png" alt="Telegram" />
                <AvatarFallback className="bg-blue-500">
                  <FaTelegram className="text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {message.channelTitle || "橙子频道"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {formatTelegramDate(message.date)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {message.text}
            </p>
            
            {message.mediaUrl && (
              <div className="mt-3">
                <img 
                  src={message.mediaUrl} 
                  alt="Telegram 图片" 
                  className="rounded-md max-h-60 w-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0">
            <a 
              href={`https://t.me/chengzi_golden/${message.messageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              在 Telegram 中查看
            </a>
          </CardFooter>
        </Card>
      ))}
      
      <div className="text-center mt-6">
        <a 
          href="https://t.me/chengzi_golden"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center py-2 px-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors text-white"
        >
          <FaTelegram className="mr-2" />
          {language === 'zh' ? '加入频道' : 'Join Channel'}
        </a>
      </div>
    </div>
  );
};

export default TelegramFeed;