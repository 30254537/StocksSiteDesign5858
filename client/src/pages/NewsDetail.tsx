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
        const originalContent = content;
        if (content.length < 100 || content.trim() === '') {
          // 如果内容为空或很短，根据标题添加详细扩展内容
          if (title.includes("比特币") || title.toLowerCase().includes("bitcoin") || title.includes("BTC")) {
            content = `${originalContent}\n\n比特币作为最早的加密货币，继续在数字资产领域保持主导地位。市场分析师预计比特币在今年内仍有可能突破历史高点，这得益于机构投资者的持续进入和全球宏观经济环境的变化。ETF的获批和美联储货币政策的调整将是影响比特币价格走势的关键因素。`;
          } else if (title.includes("BNB Chain") || title.includes("币安")) {
            content = `${originalContent}\n\nBNB Chain是币安推出的区块链网络，此次升级旨在提高网络的交易处理能力和整体性能。通过优化共识机制和增强网络基础设施，BNB Chain将能够处理更高的交易吞吐量，减少用户等待时间。这对于依赖该网络的DeFi项目和NFT市场来说是一个重要的发展。该升级预计将吸引更多开发者到BNB生态系统。`;
          } else if (title.includes("稳定币") || title.toLowerCase().includes("stablecoin")) {
            content = `${originalContent}\n\n稳定币作为加密货币市场的重要组成部分，近年来受到了监管机构的密切关注。新的合规要求主要涉及更严格的储备审计、更高的透明度标准以及更健全的风险管理框架。这些措施旨在保护用户资产安全，防止市场操纵，并确保稳定币能够真正保持其声称的价值稳定性。随着监管环境的逐渐明确，预计稳定币市场将迎来更加健康的发展。`;
          } else if (title.includes("流动性挖矿") || title.toLowerCase().includes("liquidity") || title.toLowerCase().includes("mining")) {
            content = `${originalContent}\n\n流动性挖矿是DeFi领域的一种重要机制，通过激励用户提供流动性来支持去中心化交易。该交易所推出的新计划可能包括更高的年化收益率、改进的奖励分配机制或新的代币支持。这类创新对于吸引并留住流动性提供者至关重要，同时也能够增强交易所在竞争激烈的市场中的地位。DeFi生态系统的健康发展离不开高效的流动性供应。`;
          } else if (title.includes("USDT") || title.includes("Tether")) {
            content = `${originalContent}\n\nUSDT (Tether) 作为市值最大的稳定币，其规模扩大对整个加密货币生态系统有着深远影响。达到700亿美元的市值标志着USDT在数字资产市场中的主导地位继续强化。然而，这也引发了关于储备质量、审计透明度和市场集中度的讨论。与此同时，USDC、BUSD和DAI等竞争对手也在积极扩大市场份额，使得稳定币领域的竞争日益激烈。`;
          } else if (title.includes("ETH") || title.includes("以太坊") || title.toLowerCase().includes("ethereum")) {
            content = `${originalContent}\n\n以太坊作为市值第二大的加密货币和领先的智能合约平台，其生态系统正在持续发展。随着以太坊向权益证明机制的转变完成，网络的能源效率和可扩展性都得到了显著改善。Layer 2扩展解决方案的普及进一步提高了网络性能，降低了交易成本，吸引了更多的开发者和用户。以太坊的未来发展将聚焦于提高网络吞吐量和完善用户体验。`;
          } else if (title.includes("NFT") || title.toLowerCase().includes("non-fungible")) {
            content = `${originalContent}\n\nNFT市场在经历了最初的热潮后，正逐步进入更加成熟的发展阶段。具有实用价值和独特用例的NFT项目开始脱颖而出，而纯粹的投机性项目则面临挑战。企业和机构对NFT技术的采用正在加速，特别是在游戏、艺术、音乐和身份验证等领域。随着技术的进步和市场的教育，预计NFT将在数字所有权验证方面发挥更为重要的作用。`;
          } else if (title.includes("DeFi") || title.toLowerCase().includes("decentralized finance")) {
            content = `${originalContent}\n\n去中心化金融(DeFi)生态系统在经历了多次市场调整后，正在建立更加稳健的基础设施和风险管理机制。创新型DeFi协议继续探索新的金融原语和商业模式，同时更注重安全性和可持续发展。监管的不确定性仍然是DeFi面临的主要挑战之一，但行业参与者正在积极与监管机构进行沟通和合作，以寻求平衡创新与合规的解决方案。`;
          } else {
            // 对于其他没有明确关键词的内容，提供通用的扩展
            content = `${originalContent}\n\n加密货币市场正处于快速发展的阶段，新的技术创新和市场动态不断涌现。此类市场信息对于投资者和行业参与者具有重要参考价值，有助于把握市场趋势和投资机会。随着加密行业的逐渐成熟，相关的监管框架也在不断完善，这有望为行业带来更加稳定和可持续的发展环境。加密资产的采用率也在全球范围内稳步提升，表明区块链技术正逐渐融入主流金融和商业应用。`;
          }
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
          
          {/* 只在有原始链接的情况下显示链接块 */}
          {newsData?.data.find(item => item.id === parseInt(id))?.sourceUrl && (
            <div className="border-t border-gray-700 mt-6 pt-4">
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
                    {language === 'zh' ? '查看原文' : 'View original'}
                  </a>
                </span>
              </div>
            </div>
          )}
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