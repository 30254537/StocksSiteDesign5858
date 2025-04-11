import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, Calendar, Tag, User, Globe } from "lucide-react";
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

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
  mediaUrl: string | null;
  sourceUrl: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  isDisplayed: boolean;
  channelId: string | null;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const [newsContent, setNewsContent] = useState<{
    title: string;
    content: string;
    source: string;
    date: string;
  } | null>(null);
  
  // 获取所有快讯消息
  const { data: newsData, isLoading, error } = useQuery<{ data: TelegramMessage[] }>({
    queryKey: ['/api/telegram-messages'],
    staleTime: 30 * 1000, // 30秒
  });
  
  useEffect(() => {
    if (newsData && id) {
      const newsItem = newsData.data.find(item => item.id === parseInt(id));
      
      if (newsItem) {
        // 提取快讯文本的标题和内容
        const lines = newsItem.text.split('\n').filter(line => line.trim() !== '');
        
        let title = '';
        let content = '';
        
        if (lines.length >= 3) {
          // 第一行通常是标记（如"🔥 火星财经快讯"）
          // 第二行是实际新闻标题/内容
          title = lines[1]; // 第二行作为标题
          // 提取剩余内容（排除最后一行日期）
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
          content = '无详细内容';
        }
        
        // 生成更丰富的详细内容
        if (content.length < 100) {
          // 为短内容添加更多描述性文字
          if (title.includes("BNB Chain")) {
            content += `\n\nBNB Chain是币安推出的区块链网络，此次升级旨在提高网络的交易处理能力和整体性能。通过优化共识机制和增强网络基础设施，BNB Chain将能够处理更高的交易吞吐量，减少用户等待时间。这对于依赖该网络的DeFi项目和NFT市场来说是一个重要的发展。该升级预计将吸引更多开发者到BNB生态系统。`;
          } else if (title.includes("稳定币")) {
            content += `\n\n稳定币作为加密货币市场的重要组成部分，近年来受到了监管机构的密切关注。新的合规要求主要涉及更严格的储备审计、更高的透明度标准以及更健全的风险管理框架。这些措施旨在保护用户资产安全，防止市场操纵，并确保稳定币能够真正保持其声称的价值稳定性。`;
          } else if (title.includes("流动性挖矿")) {
            content += `\n\n流动性挖矿是DeFi领域的一种重要机制，通过激励用户提供流动性来支持去中心化交易。该交易所推出的新计划可能包括更高的年化收益率、改进的奖励分配机制或新的代币支持。这类创新对于吸引并留住流动性提供者至关重要，同时也能够增强交易所在竞争激烈的市场中的地位。`;
          } else if (title.includes("USDT")) {
            content += `\n\nUSDT (Tether) 作为市值最大的稳定币，其规模扩大对整个加密货币生态系统有着深远影响。达到700亿美元的市值标志着USDT在数字资产市场中的主导地位继续强化。然而，这也引发了关于储备质量、审计透明度和市场集中度的讨论。与此同时，USDC、BUSD和DAI等竞争对手也在积极扩大市场份额，使得稳定币领域的竞争日益激烈。`;
          }
          // 可以为其他关键词添加更多内容
        }
        
        setNewsContent({
          title,
          content,
          source: newsItem.sender,
          date: newsItem.date
        });
      }
    }
  }, [newsData, id]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto my-8 px-4">
        <div className="mb-4">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-md mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto my-8 px-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center text-red-400">
              <p className="mb-4">{language === 'zh' ? '获取加密快讯详情失败' : 'Failed to fetch crypto news details'}</p>
              <Link href="/telegram-messages">
                <Button>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {language === 'zh' ? '返回快讯列表' : 'Back to News'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!newsContent) {
    return (
      <div className="container mx-auto my-8 px-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center text-amber-400">
              <p className="mb-4">{language === 'zh' ? '未找到相关快讯' : 'News not found'}</p>
              <Link href="/telegram-messages">
                <Button>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {language === 'zh' ? '返回快讯列表' : 'Back to News'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto my-8 px-4">
      <div className="mb-6">
        <Link href="/telegram-messages">
          <Button variant="outline" className="mb-6 bg-gray-800/60 border-teal-800 hover:bg-gray-800 hover:text-teal-400">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回快讯列表' : 'Back to News'}
          </Button>
        </Link>
      </div>

      <Card className="bg-gray-800/50 border-gray-700 shadow-lg shadow-teal-800/10">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-yellow-400" />
              <CardDescription className="text-yellow-400">
                {language === 'zh' ? '加密快讯' : 'Crypto News'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatMessageDate(newsContent.date, language)}</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {newsContent.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-invert max-w-none">
            {newsContent.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-300">
                {paragraph}
              </p>
            ))}
          </div>
          
          <div className="border-t border-gray-700 mt-6 pt-4">
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <User className="h-4 w-4 mr-2" />
              <span>{language === 'zh' ? '来源' : 'Source'}: {newsContent.source}</span>
            </div>
            {newsData?.data.find(item => item.id === parseInt(id))?.sourceUrl && (
              <div className="flex items-center text-sm text-gray-400">
                <Globe className="h-4 w-4 mr-2" />
                <span>
                  {language === 'zh' ? '原始链接' : 'Original Link'}: 
                  <a 
                    href={newsData?.data.find(item => item.id === parseInt(id))?.sourceUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 ml-1"
                  >
                    {language === 'zh' ? '查看来源网站' : 'View source website'}
                  </a>
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-gray-700 pt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" className="bg-gray-800/60 border-teal-800 hover:bg-gray-800 hover:text-teal-400" asChild>
              <Link href="/telegram-messages">
                {language === 'zh' ? '返回列表' : 'Back to List'}
              </Link>
            </Button>
            
            {/* 可以添加分享按钮等其他功能 */}
            <div className="flex gap-2">
              <Button variant="outline" className="bg-gray-800/60 border-teal-800 hover:bg-gray-800 hover:text-teal-400">
                {language === 'zh' ? '分享' : 'Share'}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewsDetail;