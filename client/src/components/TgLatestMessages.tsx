import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaTelegram, FaBell, FaMoneyBillWave, FaFileContract, FaChartBar, FaClock, FaUsers, FaExchangeAlt, FaSearchDollar, FaExclamationTriangle, FaChartLine, FaSync } from "react-icons/fa";
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

// 使用正则表达式识别金狗监测格式数据 - 简化版本
const parseGoldenDogMessage = (text: string) => {
  console.log("正在解析消息:", text.substring(0, 50) + "...");
  
  // 更简单的解析逻辑，只提取代币名称和合约地址
  
  // 尝试提取代币名称
  let tokenName = "";
  const tokenNameMatch = text.match(/代币名称[:：]\s*(.+?)(?:\n|$)/i) ||
                         text.match(/代币[:：]\s*(.+?)(?:\n|$)/i) ||
                         text.match(/\$([A-Za-z0-9_]+)/);
  
  if (tokenNameMatch) {
    tokenName = tokenNameMatch[1] ? tokenNameMatch[1].trim() : tokenNameMatch[0].trim();
  }
  
  if (text.includes("$STONKS")) {
    tokenName = "STONKS";
  }
  
  if (text.includes("$TrashCoin")) {
    tokenName = "TrashCoin";
  }
  
  // 尝试提取合约地址
  let contractAddress = "";
  const contractMatch = text.match(/合约地址[:：]\s*(.+?)(?:\n|$)/i) ||
                        text.match(/合约[:：]\s*(.+?)(?:\n|$)/i) ||
                        text.match(/CA[:：]?\s*(.+?)(?:\n|$)/i);
  
  if (contractMatch && contractMatch[1]) {
    contractAddress = contractMatch[1].trim();
  }
  
  // 判断是否找到了有效信息
  const isValid = tokenName || contractAddress;
  
  if (!isValid) {
    console.log("无法从消息中提取代币名称或合约地址");
    return null;
  }
  
  console.log(`已提取信息 - 代币名称: ${tokenName}, 合约地址: ${contractAddress}`);
  
  return {
    tokenName: tokenName,
    contractAddress: contractAddress,
    rawText: text,
    isGoldenDogFormat: true,
    // 下面是为了兼容旧代码，但我们不会使用这些字段
    isNewFormat: true,
    price: "",
    marketCap: "",
    top10Holding: "",
    holders: "",
    volume24h: "",
    priceChange: "",
    creationTime: "",
    bundleAnalysis: "",
    tweetAuthors: "",
    blueVerified: "",
    liquidity: "",
    buyTax: "",
    sellTax: "",
    telegram: "",
    riskLevel: "",
    currentAction: ""
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
  
  // 打印原始消息以便调试
  console.log('原始消息列表:', telegramData?.data);
  console.log('解析后消息列表:', goldenDogMessages);
  
  return (
    <div className="space-y-5">
      {showTitle && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FaBell className="text-yellow-400 text-xl" />
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
      
      {goldenDogMessages.map((message) => {
        const parsed = parseGoldenDogMessage(message.text);
        
        // 确保我们能正确解析每个消息，总是显示合法数据
        if (!parsed) {
          console.log("无法解析消息:", message);
          return null;
        }

        return (
          <Card key={message.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors shadow-lg shadow-teal-800/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <FaBell className="text-yellow-400" />
                  <span className="font-bold text-yellow-400">{parsed.isNewFormat ? "🟢 加密快讯" : "🔔 加密资讯"}</span>
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

              {/* 价格信息（新格式） */}
              {parsed.isNewFormat && parsed.price && (
                <div className="flex items-start mb-2">
                  <FaMoneyBillWave className="text-green-400 mt-1 mr-2 w-4 h-4 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="text-white whitespace-pre-wrap break-all">
                      <span className="text-gray-400">💲 价格: </span>
                      <span className="text-green-400 font-medium">{parsed.price}</span>
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
                
                {/* 流动性（新格式） */}
                {parsed.isNewFormat && parsed.liquidity && (
                  <div className="flex items-center">
                    <FaExchangeAlt className="text-blue-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">💧流动性: </span>
                    <span className="text-xs text-blue-400 ml-1">{parsed.liquidity}</span>
                  </div>
                )}

                {/* 买入税（新格式） */}
                {parsed.isNewFormat && parsed.buyTax && (
                  <div className="flex items-center">
                    <FaChartBar className="text-green-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">🔼买入税: </span>
                    <span className="text-xs text-green-400 ml-1">{parsed.buyTax}</span>
                  </div>
                )}

                {/* 卖出税（新格式） */}
                {parsed.isNewFormat && parsed.sellTax && (
                  <div className="flex items-center">
                    <FaChartBar className="text-red-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">🔽卖出税: </span>
                    <span className="text-xs text-red-400 ml-1">{parsed.sellTax}</span>
                  </div>
                )}

                {/* 风险等级 */}
                {parsed.isNewFormat && parsed.riskLevel && (
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-yellow-500 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">⚠️ 风险等级: </span>
                    <span className={`text-xs ml-1 ${
                      parsed.riskLevel.includes("低") ? "text-green-400" : 
                      parsed.riskLevel.includes("中") ? "text-yellow-400" : 
                      "text-red-400"
                    }`}>{parsed.riskLevel}</span>
                  </div>
                )}
                
                {/* 当前动作 */}
                {parsed.isNewFormat && parsed.currentAction && (
                  <div className="flex items-center">
                    <FaExchangeAlt className="text-blue-500 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">🔄 当前动作: </span>
                    <span className="text-xs text-blue-400 ml-1">{parsed.currentAction}</span>
                  </div>
                )}
                
                {/* 持有者 */}
                {parsed.isNewFormat && parsed.holders && (
                  <div className="flex items-center">
                    <FaUsers className="text-orange-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">👥 持有者: </span>
                    <span className="text-xs text-orange-400 ml-1">{parsed.holders}</span>
                  </div>
                )}
                
                {/* 价格变化（新格式） */}
                {parsed.isNewFormat && parsed.priceChange && (
                  <div className="flex items-center">
                    <FaChartLine className="text-green-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📈 涨幅: </span>
                    <span className={`text-xs ml-1 ${parsed.priceChange.includes("+") ? "text-green-400" : "text-red-400"}`}>{parsed.priceChange}</span>
                  </div>
                )}
                
                {/* Telegram链接（新格式） */}
                {parsed.isNewFormat && parsed.telegram && (
                  <div className="flex items-center">
                    <FaTelegram className="text-blue-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📣 TG: </span>
                    <span className="text-xs text-blue-400 ml-1">
                      <a href={parsed.telegram.includes("http") ? parsed.telegram : `https://${parsed.telegram}`} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="hover:underline">
                        {parsed.telegram}
                      </a>
                    </span>
                  </div>
                )}
                
                {/* 旧格式字段 */}
                {!parsed.isNewFormat && parsed.top10Holding && (
                  <div className="flex items-center">
                    <FaChartBar className="text-teal-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">⏳前十持仓: </span>
                    <span className="text-xs text-teal-400 ml-1">{parsed.top10Holding}</span>
                  </div>
                )}
                
                {!parsed.isNewFormat && parsed.holders && (
                  <div className="flex items-center">
                    <FaUsers className="text-orange-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">👥持有者数量: </span>
                    <span className="text-xs text-orange-400 ml-1">{parsed.holders}</span>
                  </div>
                )}
                
                {!parsed.isNewFormat && parsed.volume24h && (
                  <div className="flex items-center">
                    <FaExchangeAlt className="text-blue-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📊24h交易量: </span>
                    <span className="text-xs text-blue-400 ml-1">{parsed.volume24h}</span>
                  </div>
                )}
                
                {!parsed.isNewFormat && parsed.priceChange && (
                  <div className="flex items-center">
                    <FaChartBar className="text-green-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">📈6小时价格变化: </span>
                    <span className="text-xs text-green-400 ml-1">{parsed.priceChange}</span>
                  </div>
                )}
                
                {!parsed.isNewFormat && parsed.creationTime && (
                  <div className="flex items-center">
                    <FaClock className="text-gray-400 mr-1.5 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-300">🕒创建时间: </span>
                    <span className="text-xs text-gray-400 ml-1">{parsed.creationTime}</span>
                  </div>
                )}
              </div>

              {/* 其他信息 */}
              {!parsed.isNewFormat && (
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
              )}

              <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2">
                <span className="text-xs text-gray-500">加密资讯频道</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TgLatestMessages;