import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTelegram, FaBell, FaMoneyBillWave, FaFileContract, FaChartBar, FaClock, FaUsers, FaExchangeAlt, FaSearchDollar } from "react-icons/fa";
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// 日期格式化
const formatMessageDate = (dateString: string, language: string) => {
  const date = new Date(dateString);
  const locale = language === 'zh' ? zhCN : enUS;
  return format(date, 'yyyy/MM/dd HH:mm:ss', { locale });
};

// 使用正则表达式识别金狗监测格式数据
const parseGoldenDogMessage = (text: string) => {
  // 基础解析 - 提取常见字段
  const tokenNameMatch = text.match(/💰\s*代币名称:(.+?)(\n|$)/);
  const contractMatch = text.match(/📝\s*合约地址:\s*(.+?)(\n|$)/);
  const marketCapMatch = text.match(/👺市值:(.+?)(\n|$)/);
  const top10HoldingMatch = text.match(/⏳前十持仓:(.+?)(\n|$)/);
  const holdersMatch = text.match(/👥持有者数量:\s*(.+?)(\n|$)/);
  const volumeMatch = text.match(/📊24h交易量:\s*(.+?)(\n|$)/);
  const priceChangeMatch = text.match(/📈.+价格变化:\s*(.+?)(\n|$)/);
  const creationTimeMatch = text.match(/🕒创建时间:\s*(.+?)(\n|$)/);
  const bundleAnalysisMatch = text.match(/🔍捆绑分析:\s*(.+?)(\n|$)/);
  const tweetAuthorsMatch = text.match(/📬有关推文作者数量:\s*(.+?)(\n|$)/);
  const blueVerifiedMatch = text.match(/🛜蓝V用户:\s*(.+?)(\n|$)/);

  // 是否为金狗监测格式
  const isGoldenDogFormat = text.includes("🔔 金狗监测提醒") || 
                            (tokenNameMatch && contractMatch);

  if (!isGoldenDogFormat) {
    return null;
  }

  return {
    tokenName: tokenNameMatch?.[1]?.trim() || "",
    contractAddress: contractMatch?.[1]?.trim() || "",
    marketCap: marketCapMatch?.[1]?.trim() || "",
    top10Holding: top10HoldingMatch?.[1]?.trim() || "",
    holders: holdersMatch?.[1]?.trim() || "",
    volume24h: volumeMatch?.[1]?.trim() || "",
    priceChange: priceChangeMatch?.[1]?.trim() || "",
    creationTime: creationTimeMatch?.[1]?.trim() || "",
    bundleAnalysis: bundleAnalysisMatch?.[1]?.trim() || "",
    tweetAuthors: tweetAuthorsMatch?.[1]?.trim() || "",
    blueVerified: blueVerifiedMatch?.[1]?.trim() || "",
    rawText: text,
    isGoldenDogFormat: true
  };
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
  limit = 5, 
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
  
  // 只显示金狗监测格式的消息
  const goldenDogMessages = telegramData.data
    .filter(message => {
      const parsed = parseGoldenDogMessage(message.text);
      return parsed && parsed.isGoldenDogFormat;
    })
    .slice(0, limit);
  
  // 如果没有金狗监测消息，显示特定的空状态
  if (goldenDogMessages.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-4">
          <div className="text-center text-gray-400">
            <FaBell className="mx-auto text-2xl mb-2 text-yellow-400" />
            <p className="mb-2">{language === 'zh' ? '暂无金狗监测提醒消息' : 'No Golden Dog monitoring alerts'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-5">
      {showTitle && (
        <div className="flex items-center space-x-2 mb-2">
          <FaBell className="text-yellow-400 text-xl" />
          <h3 className="text-lg font-medium text-teal-400">
            {language === 'zh' ? '金狗监测提醒' : 'Golden Dog Monitoring Alerts'}
          </h3>
        </div>
      )}
      
      {goldenDogMessages.map((message) => {
        const parsed = parseGoldenDogMessage(message.text);
        
        return (
          <Card key={message.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors shadow-lg shadow-teal-800/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <FaBell className="text-yellow-400" />
                  <span className="font-bold text-yellow-400">🔔 金狗监测提醒</span>
                </div>
                <span className="text-xs text-gray-400">{formatMessageDate(message.date, language)}</span>
              </div>
              
              {/* 代币名称 */}
              {parsed.tokenName && (
                <div className="flex items-start mb-2">
                  <FaMoneyBillWave className="text-green-400 mt-1 mr-2 w-4 h-4 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="text-white whitespace-pre-wrap break-all">
                      <span className="text-gray-400">💰 代币名称: </span>
                      <span className="text-green-400 font-medium">{parsed.tokenName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 合约地址 */}
              {parsed.contractAddress && (
                <div className="flex items-start mb-2">
                  <FaFileContract className="text-blue-400 mt-1 mr-2 w-4 h-4 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="text-white whitespace-pre-wrap break-all">
                      <span className="text-gray-400">📝 合约地址: </span>
                      <code className="font-mono text-blue-300 bg-blue-900/20 px-1 rounded text-xs">{parsed.contractAddress}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* 数据统计部分 */}
              <div className="grid grid-cols-2 gap-2 my-3">
                {parsed.marketCap && (
                  <div className="flex items-center">
                    <FaSearchDollar className="text-purple-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">👺市值: </span>
                    <span className="text-xs text-purple-400 ml-1">{parsed.marketCap}</span>
                  </div>
                )}
                
                {parsed.top10Holding && (
                  <div className="flex items-center">
                    <FaChartBar className="text-teal-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">⏳前十持仓: </span>
                    <span className="text-xs text-teal-400 ml-1">{parsed.top10Holding}</span>
                  </div>
                )}
                
                {parsed.holders && (
                  <div className="flex items-center">
                    <FaUsers className="text-orange-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">👥持有者数量: </span>
                    <span className="text-xs text-orange-400 ml-1">{parsed.holders}</span>
                  </div>
                )}
                
                {parsed.volume24h && (
                  <div className="flex items-center">
                    <FaExchangeAlt className="text-blue-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📊24h交易量: </span>
                    <span className="text-xs text-blue-400 ml-1">{parsed.volume24h}</span>
                  </div>
                )}
                
                {parsed.priceChange && (
                  <div className="flex items-center">
                    <FaChartBar className="text-green-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📈6小时价格变化: </span>
                    <span className="text-xs text-green-400 ml-1">{parsed.priceChange}</span>
                  </div>
                )}
                
                {parsed.creationTime && (
                  <div className="flex items-center">
                    <FaClock className="text-gray-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">🕒创建时间: </span>
                    <span className="text-xs text-gray-400 ml-1">{parsed.creationTime}</span>
                  </div>
                )}
              </div>

              {/* 其他信息 */}
              <div className="mt-3 text-xs text-gray-400">
                {parsed.bundleAnalysis && (
                  <div className="flex items-center mb-1">
                    <span>🔍捆绑分析: </span>
                    <span className={`ml-1 ${
                      parsed.bundleAnalysis.includes("🟢") ? "text-green-400" : 
                      parsed.bundleAnalysis.includes("🟠") ? "text-amber-400" : 
                      parsed.bundleAnalysis.includes("🔴") ? "text-red-400" : "text-gray-400"
                    }`}>{parsed.bundleAnalysis}</span>
                  </div>
                )}
                
                {parsed.tweetAuthors && (
                  <div className="mb-1">
                    <span>📬有关推文作者数量: </span>
                    <span className="text-blue-400">{parsed.tweetAuthors}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2">
                <span className="text-xs text-gray-500">金狗监测频道</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TgLatestMessages;