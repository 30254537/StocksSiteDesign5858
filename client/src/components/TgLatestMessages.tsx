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
            } else if (title.includes("流动性挖矿") || title.toLowerCase().includes("liquidity") || title.toLowerCase().includes("mining")) {
              expandedContent = `${originalContent}\n\n流动性挖矿是DeFi领域的一种重要机制，通过激励用户提供流动性来支持去中心化交易。该交易所推出的新计划可能包括更高的年化收益率、改进的奖励分配机制或新的代币支持。这类创新对于吸引并留住流动性提供者至关重要，同时也能够增强交易所在竞争激烈的市场中的地位。DeFi生态系统的健康发展离不开高效的流动性供应。`;
            } else if (title.includes("USDT") || title.includes("Tether")) {
              expandedContent = `${originalContent}\n\nUSDT (Tether) 作为市值最大的稳定币，其规模扩大对整个加密货币生态系统有着深远影响。达到700亿美元的市值标志着USDT在数字资产市场中的主导地位继续强化。然而，这也引发了关于储备质量、审计透明度和市场集中度的讨论。与此同时，USDC、BUSD和DAI等竞争对手也在积极扩大市场份额，使得稳定币领域的竞争日益激烈。`;
            } else if (title.includes("ETH") || title.includes("以太坊") || title.toLowerCase().includes("ethereum")) {
              expandedContent = `${originalContent}\n\n以太坊作为市值第二大的加密货币和领先的智能合约平台，其生态系统正在持续发展。随着以太坊向权益证明机制的转变完成，网络的能源效率和可扩展性都得到了显著改善。Layer 2扩展解决方案的普及进一步提高了网络性能，降低了交易成本，吸引了更多的开发者和用户。以太坊的未来发展将聚焦于提高网络吞吐量和完善用户体验。`;
            } else if (title.includes("NFT") || title.toLowerCase().includes("non-fungible")) {
              expandedContent = `${originalContent}\n\nNFT市场在经历了最初的热潮后，正逐步进入更加成熟的发展阶段。具有实用价值和独特用例的NFT项目开始脱颖而出，而纯粹的投机性项目则面临挑战。企业和机构对NFT技术的采用正在加速，特别是在游戏、艺术、音乐和身份验证等领域。随着技术的进步和市场的教育，预计NFT将在数字所有权验证方面发挥更为重要的作用。`;
            } else if (title.includes("DeFi") || title.toLowerCase().includes("decentralized finance")) {
              expandedContent = `${originalContent}\n\n去中心化金融(DeFi)生态系统在经历了多次市场调整后，正在建立更加稳健的基础设施和风险管理机制。创新型DeFi协议继续探索新的金融原语和商业模式，同时更注重安全性和可持续发展。监管的不确定性仍然是DeFi面临的主要挑战之一，但行业参与者正在积极与监管机构进行沟通和合作，以寻求平衡创新与合规的解决方案。`;
            } else {
              // 对于其他没有明确关键词的内容，提供通用的扩展
              expandedContent = `${originalContent}\n\n加密货币市场正处于快速发展的阶段，新的技术创新和市场动态不断涌现。此类市场信息对于投资者和行业参与者具有重要参考价值，有助于把握市场趋势和投资机会。随着加密行业的逐渐成熟，相关的监管框架也在不断完善，这有望为行业带来更加稳定和可持续的发展环境。加密资产的采用率也在全球范围内稳步提升，表明区块链技术正逐渐融入主流金融和商业应用。`;
            }
          }
          
          // 将内容分割成短段落
          const paragraphs = expandedContent.split('\n\n');
          const firstParagraph = paragraphs[0];
          const remainingParagraphs = paragraphs.slice(1);
          
          return (
            <Card 
              key={message.id} 
              className="overflow-hidden bg-gray-900/70 border-gray-800 hover:bg-gray-800/80 relative group transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2 opacity-50 text-xs">
                  <span className="text-gray-400">{formatMessageDate(message.date, language)}</span>
                </div>
                
                <h3 className="font-bold text-white text-lg mb-3 group-hover:text-gray-100 transition-colors">
                  {title}
                </h3>
                
                {expandedContent && (
                  <div className="space-y-3">
                    {firstParagraph && (
                      <div className="text-teal-400 text-sm font-medium">
                        {firstParagraph}
                      </div>
                    )}
                    
                    {remainingParagraphs.length > 0 && (
                      <div className="space-y-2">
                        {remainingParagraphs.map((paragraph, i) => (
                          <p key={i} className="text-teal-300/90 text-sm">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}
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