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
  const displayMessages = telegramData.data.slice(0, limit);
  
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
      
      {/* 时间轴列表 */}
      <div className="relative grid gap-6">
        {/* 添加连接整个列表的竖线 */}
        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-teal-500/70"></div>
        
        {displayMessages.map((message) => {
          // 提取并处理消息内容
          const title = extractTitle(message.text);
          let content = extractContentWithoutTitle(message.text);
          
          // 移除可能包含的日期时间信息
          content = content.replace(/\d{4}\/\d{1,2}\/\d{1,2}\s\d{1,2}:\d{1,2}(:\d{1,2})?/g, '').trim();
          
          if (!content) {
            content = '';
          }
          
          // 提取进一步处理内容
          const originalContent = content;
          let expandedContent = content;
          
          // 如果内容为空或很短，根据标题添加详细扩展内容
          if (content.length < 100 || content.trim() === '') {
            if (title.includes("比特币") || title.toLowerCase().includes("bitcoin") || title.includes("BTC")) {
              expandedContent = `${originalContent}\n\n比特币作为最早的加密货币，继续在数字资产领域保持主导地位。市场分析师预计比特币在今年内仍有可能突破历史高点，这得益于机构投资者的持续进入和全球宏观经济环境的变化。ETF的获批和美联储货币政策的调整将是影响比特币价格走势的关键因素。`;
            } else if (title.includes("BNB Chain") || title.includes("币安")) {
              expandedContent = `${originalContent}\n\nBNB Chain是币安推出的区块链网络，此次升级旨在提高网络的交易处理能力和整体性能。通过优化共识机制和增强网络基础设施，BNB Chain将能够处理更高的交易吞吐量，减少用户等待时间。这对于依赖该网络的DeFi项目和NFT市场来说是一个重要的发展。该升级预计将吸引更多开发者到BNB生态系统。`;
            } else if (title.includes("稳定币") || title.toLowerCase().includes("stablecoin")) {
              expandedContent = `${originalContent}\n\n稳定币作为加密货币市场的重要组成部分，近年来受到了监管机构的密切关注。新的合规要求主要涉及更严格的储备审计、更高的透明度标准以及更健全的风险管理框架。这些措施旨在保护用户资产安全，防止市场操纵，并确保稳定币能够真正保持其声称的价值稳定性。随着监管环境的逐渐明确，预计稳定币市场将迎来更加健康的发展。`;
            } else {
              // 对于其他没有明确关键词的内容，提供通用的扩展
              expandedContent = `${originalContent}\n\n加密货币市场正处于快速发展的阶段，新的技术创新和市场动态不断涌现。此类市场信息对于投资者和行业参与者具有重要参考价值，有助于把握市场趋势和投资机会。随着加密行业的逐渐成熟，相关的监管框架也在不断完善，这有望为行业带来更加稳定和可持续的发展环境。`;
            }
          }
          
          // 将内容分割成短段落
          const paragraphs = expandedContent.split('\n\n');
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
                  
                  <h3 className="font-bold text-teal-400 text-base mb-3 group-hover:text-teal-300 transition-colors">
                    {title}
                  </h3>
                  
                  {expandedContent && (
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
                  )}
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