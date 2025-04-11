import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaSync, FaCalendarDay } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

// 字符串相似度计算函数（使用Jaccard相似度）
function calculateStringSimilarity(a: string, b: string): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  
  // 将字符串转换为字符集合
  const setA = new Set(a.toLowerCase().split(''));
  const setB = new Set(b.toLowerCase().split(''));
  
  // 计算交集大小
  const intersection = [...setA].filter(char => setB.has(char)).length;
  
  // 计算并集大小
  const union = setA.size + setB.size - intersection;
  
  // 计算Jaccard相似度
  return union === 0 ? 0 : intersection / union;
}

// 日期格式化
const formatMessageDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  const locale = language === 'zh' ? zhCN : enUS;
  return format(date, 'yyyy/MM/dd HH:mm', { locale });
};

// 辅助函数：提取标题
const extractTitle = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length >= 3) {
    return lines[1]; // 第二行是实际的新闻标题
  } else if (lines.length >= 1) {
    return lines[0]; // 只有一行，把它当标题
  }
  
  return '加密快讯';
};

// 辅助函数：提取内容
const extractContentWithoutTitle = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length >= 3) {
    const contentLines = lines.slice(2, -1);
    return contentLines.join('\n');
  } else if (lines.length === 2) {
    return lines[1];
  } else if (lines.length === 1) {
    // 标题和内容相同的情况，这里可以返回空或者返回第一行
    return '';
  }
  
  return '';
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
  content?: string;
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
    mutationFn: async (date?: string) => {
      setIsSyncing(true);
      console.log('开始同步Telegram消息，日期:', date);
      
      // 构建请求体对象，确保日期参数正确传递
      const requestBody = date ? { date } : {};
      
      // 发送POST请求到新的端点
      const res = await apiRequest("POST", "/api/sync-telegram-messages", requestBody);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      const isApril11 = variables === '2025-04-11';
      console.log('同步结果:', data, '是否为4月11日:', isApril11);
      
      toast({
        title: language === 'zh' ? "同步成功" : "Synchronization successful",
        description: isApril11 
          ? (language === 'zh' ? "已成功获取2025年4月11日的加密快讯" : "Successfully retrieved crypto news from April 11, 2025") 
          : (language === 'zh' ? "已成功同步最新消息" : "Successfully synchronized the latest messages"),
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
  
  // 获取4月11日的加密快讯
  const getApril11News = () => {
    syncMutation.mutate('2025-04-11');
  };
  
  // 获取Telegram消息列表
  const { data: telegramData, isLoading, error } = useQuery<{ data: TelegramMessage[] }>({
    queryKey: ['/api/telegram-messages'],
    staleTime: 60 * 1000, // 1分钟
    refetchInterval: 300 * 1000, // 每5分钟自动刷新一次
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
  
  // 对消息进行预处理，移除重复的
  let processedMessages = telegramData.data;
  
  // 对于律动BlockBeats消息，额外进行内容相似度检查
  if (processedMessages.some(msg => msg.sender === '律动BlockBeats')) {
    const blockBeatsMessages = processedMessages.filter(msg => msg.sender === '律动BlockBeats');
    const otherMessages = processedMessages.filter(msg => msg.sender !== '律动BlockBeats');
    
    // 对BlockBeats消息进行相似度过滤
    const uniqueBlockBeatsMessages: TelegramMessage[] = [];
    const seenContents = new Set<string>();
    
    blockBeatsMessages.forEach(msg => {
      // 提取内容指纹（前50个字符），忽略发送时间和日期格式
      const contentKey = msg.text
        .replace(/📢 律动BlockBeats快讯\n\n/g, '')
        .replace(/\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}/g, '')
        .trim()
        .substring(0, 50)
        .toLowerCase();
      
      // 判断是否已经有类似内容的消息
      let isDuplicate = false;
      for (const existingContent of seenContents) {
        // 使用简单的内容相似度检查
        const similarity = calculateStringSimilarity(contentKey, existingContent);
        if (similarity > 0.7) { // 70%相似度阈值
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seenContents.add(contentKey);
        uniqueBlockBeatsMessages.push(msg);
      }
    });
    
    // 重新组合消息
    processedMessages = [...otherMessages, ...uniqueBlockBeatsMessages];
    
    // 按日期重新排序
    processedMessages.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // 降序排列（新消息在前）
    });
  }
  
  // 截取限制数量的消息
  const displayMessages = processedMessages.slice(0, limit);
  
  return (
    <div className="pb-8">
      {showTitle && (
        <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
            {language === 'zh' ? '加密快讯' : 'Crypto News'}
          </h2>
          <div className="flex gap-2">
            {/* 4月11日快讯按钮 */}
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-3 bg-gray-800/60 border-cyan-800 hover:bg-gray-800 hover:text-cyan-400 transition-all"
              onClick={getApril11News}
              disabled={isSyncing || syncMutation.isPending}
            >
              {(isSyncing || syncMutation.isPending) ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <FaCalendarDay className="mr-1 h-3 w-3" />
              )}
              {language === 'zh' ? '4月11日快讯' : 'April 11 News'}
            </Button>
            
            {/* 实时更新按钮 */}
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
        </div>
      )}
      
      {/* 时间轴列表 */}
      <div className="relative grid gap-6">
        {/* 添加连接整个列表的竖线 */}
        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-teal-500/70"></div>
        
        {displayMessages.map((message) => {
          // 提取并处理消息内容 - 改进版，解决重复内容问题
          const title = extractTitle(message.text);
          
          // 首先检查原始消息文本是否包含完整内容
          const textLines = message.text.split('\n').filter(line => line.trim() !== '');
          
          // 除去标题和日期行，剩下的就是真正内容
          let realContent = '';
          
          if (textLines.length >= 4) {
            // 跳过第一行(标题信息) + 可能的空行 + 最后一行(日期)
            const contentLines = textLines.slice(1, textLines.length - 1);
            realContent = contentLines.join('\n');
          } else if (textLines.length === 3) {
            // 可能是标题+内容+日期的模式
            realContent = textLines[1];
          } else if (textLines.length <= 2) {
            // 至少保留一些内容
            realContent = textLines.join('\n');
          }
          
          // 移除可能包含的日期时间信息
          realContent = realContent.replace(/\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}(:\d{1,2})?/g, '').trim();
          
          // 使用消息ID确保不同消息有不同的内容
          const messageId = message.id || message.messageId;
          
          // 改进：只使用原始内容，不再添加额外重复的内容
          // 将内容分割成短段落
          const paragraphs = realContent.split('\n\n');
          const firstParagraph = paragraphs[0];
          const remainingParagraphs = paragraphs.slice(1);
          
          return (
            <div key={message.id} className="relative pl-8">
              {/* 每条消息前的白色小圆点 */}
              <div className="absolute left-2.5 top-6 w-2 h-2 rounded-full bg-white border-2 border-teal-500 z-10"></div>
              
              <Card className="overflow-hidden bg-gray-900/70 border-gray-800 hover:bg-gray-800/80 relative group transition-colors">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2 opacity-50 text-xs">
                    <span className="text-gray-400">{formatMessageDate(message.date, language)}</span>
                  </div>
                  
                  <h3 className="font-bold text-lime-500 text-base mb-3 group-hover:text-lime-400 transition-colors">
                    {title}
                  </h3>
                  
                  <div className="space-y-3">
                    {firstParagraph && (
                      <div className="text-white text-base font-medium">
                        {firstParagraph}
                      </div>
                    )}
                    
                    {remainingParagraphs.length > 0 && (
                      <div className="space-y-2">
                        {remainingParagraphs.map((paragraph, i) => (
                          <p key={i} className="text-gray-100 text-base">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TgLatestMessages;