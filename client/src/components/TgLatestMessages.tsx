import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaTelegram, FaBell, FaMoneyBillWave, FaFileContract, FaChartBar, FaClock, FaUsers, FaExchangeAlt, FaSearchDollar, FaExclamationTriangle, FaChartLine } from "react-icons/fa";
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
  console.log("正在解析消息:", text.substring(0, 50) + "...");
  
  // 检查消息类型 - 增强匹配能力
  const isOldFormat = text.includes("🔔 金狗监测提醒") || 
                      text.includes("金狗监测提醒") || 
                      (text.includes("代币名称") && text.includes("合约地址")) ||
                      (text.includes("市值") && text.includes("合约地址"));
  
  // 特殊处理 STONKS 代币信息
  const isStonksFormat = text.includes("$STONKS") && 
                        (text.includes("价格:") || text.includes("市值:") || 
                         text.includes("合约:"));
                         
  const isNewFormat = ((text.includes("🚀 金狗监测") || text.includes("金狗监测")) && 
                      (text.includes("代币:") || text.includes("代币：") || 
                       text.includes("价格:") || text.includes("价格：") ||
                       text.includes("合约:") || text.includes("合约："))) ||
                      (text.includes("🟢") && (text.includes("CA:") || text.includes("建仓"))) ||
                      (text.includes("Ghibli") && text.includes("价格")) ||
                      isStonksFormat;
  
  // 如果既不是旧格式也不是新格式，返回null
  if (!isOldFormat && !isNewFormat) {
    console.log("消息不符合任何已知格式");
    return null;
  }
  
  console.log("消息类型:", isOldFormat ? "旧格式" : "新格式");

  // 根据不同格式进行解析
  if (isNewFormat) {
    // 解析新格式
    // 尝试提取代币名称 (新格式可能在 🟢 后面或有单独的名称标记)
    let tokenName = "";
    
    // 特别处理STONKS代币格式
    if (text.includes("$STONKS")) {
      tokenName = "STONKS";
    } else {
      const nameMatch = text.match(/\🟢\s*(.+?)(?:\s*\n|\s*价格|\s*CA:)/i) || 
                        text.match(/代币名称[:：]\s*(.+?)(?:\s*\n|$)/i) ||
                        text.match(/代币[:：]\s*(.+?)(?:\s*\n|$)/i) ||
                        text.match(/\$([A-Za-z0-9_]+)/) ||
                        text.match(/\s*(.+?)(?:\s*价格|\s*CA:)/i);
      if (nameMatch) {
        tokenName = nameMatch[1].trim();
      }
    }
    
    // 提取合约地址
    const contractMatch = text.match(/CA:\s*(.+?)(?:\n|$)/i) || 
                         text.match(/合约[地址]*[:：]\s*(.+?)(?:\n|$)/i);
    
    // 提取价格信息
    const priceMatch = text.match(/价格[:：]?\s*(.+?)(?:\n|$)/i) ||
                      text.match(/(\$[\d\.]+)/) ||
                      text.match(/([\d\.]+\s*usdt)/i);
    
    // 提取市值
    const marketCapMatch = text.match(/市值[:：]?\s*(.+?)(?:\n|$)/i) ||
                           text.match(/mcap[:：]?\s*(.+?)(?:\n|$)/i);
    
    // 提取持有者信息
    let holders = "";
    const holdersMatch = text.match(/持有者[:：]?\s*(.+?)(?:\n|$)/i) ||
                         text.match(/holders[:：]?\s*(.+?)(?:\n|$)/i); 
    if (holdersMatch) {
      holders = holdersMatch[1].trim();
    }
                           
    // 提取24h涨幅
    let priceChange = "";
    const priceChangeMatch = text.match(/24h涨幅[:：]?\s*(.+?)(?:\n|$)/i) ||
                             text.match(/涨幅[:：]?\s*(.+?)(?:\n|$)/i);
    if (priceChangeMatch) {
      priceChange = priceChangeMatch[1].trim();
    }
    
    // 提取其他可能有的信息
    const liquidityMatch = text.match(/流动性[:：]?\s*(.+?)(?:\n|$)/i) ||
                           text.match(/lp[:：]?\s*(.+?)(?:\n|$)/i);
    
    const buyTaxMatch = text.match(/买入税[:：]?\s*(.+?)(?:\n|$)/i) ||
                        text.match(/buy\s*tax[:：]?\s*(.+?)(?:\n|$)/i);
    
    const sellTaxMatch = text.match(/卖出税[:：]?\s*(.+?)(?:\n|$)/i) ||
                         text.match(/sell\s*tax[:：]?\s*(.+?)(?:\n|$)/i);
    
    const telegramMatch = text.match(/TG[:：]?\s*(.+?)(?:\n|$)/i) ||
                          text.match(/telegram[:：]?\s*(.+?)(?:\n|$)/i) ||
                          text.match(/查看更多[:：]?\s*(.+?)(?:\n|$)/i);

    // 提取风险等级
    let riskLevel = "";
    const riskLevelMatch = text.match(/风险等级[:：]?\s*(.+?)(?:\n|$)/i);
    if (riskLevelMatch) {
      riskLevel = riskLevelMatch[1].trim();
    }
    
    // 提取当前动作
    let currentAction = "";
    const currentActionMatch = text.match(/当前动作[:：]?\s*(.+?)(?:\n|$)/i);
    if (currentActionMatch) {
      currentAction = currentActionMatch[1].trim();
    }
                           
    return {
      tokenName: tokenName || "",
      contractAddress: contractMatch?.[1]?.trim() || "",
      price: priceMatch?.[1]?.trim() || "",
      marketCap: marketCapMatch?.[1]?.trim() || "",
      liquidity: liquidityMatch?.[1]?.trim() || "",
      buyTax: buyTaxMatch?.[1]?.trim() || "",
      sellTax: sellTaxMatch?.[1]?.trim() || "",
      telegram: telegramMatch?.[1]?.trim() || "",
      // 更新一些旧字段以支持STONKS代币格式
      top10Holding: "",
      holders: holders,
      volume24h: "",
      priceChange: priceChange,
      creationTime: "",
      bundleAnalysis: "",
      tweetAuthors: "",
      blueVerified: "",
      riskLevel: riskLevel,
      currentAction: currentAction,
      rawText: text,
      isGoldenDogFormat: true,
      isNewFormat: true
    };
  } else {
    // 旧格式解析 - 支持不同的表达方式和标点符号，增强解析能力
    const tokenNameMatch = text.match(/💰?\s*代币名称[:：](.+?)(\n|$)/) || 
                         text.match(/代币名称[:：]\s*(.+?)(\n|$)/) ||
                         text.match(/\$([A-Za-z0-9_]+)/);
                         
    const contractMatch = text.match(/📝?\s*合约地址[:：]\s*(.+?)(\n|$)/) ||
                         text.match(/合约地址[:：]\s*(.+?)(\n|$)/) ||
                         text.match(/合约[:：]\s*(.+?)(\n|$)/);
                         
    const marketCapMatch = text.match(/👺?市值[:：](.+?)(\n|$)/) ||
                         text.match(/市值[:：]\s*(.+?)(\n|$)/);
                         
    const top10HoldingMatch = text.match(/⏳?前十持仓[:：](.+?)(\n|$)/);
    
    const holdersMatch = text.match(/👥?持有者数量[:：]\s*(.+?)(\n|$)/) ||
                        text.match(/持有者[:：]\s*(.+?)(\n|$)/);
                        
    const volumeMatch = text.match(/📊?24h交易量[:：]\s*(.+?)(\n|$)/) ||
                       text.match(/交易量[:：]\s*(.+?)(\n|$)/);
                       
    const priceChangeMatch = text.match(/📈?.+价格变化[:：]\s*(.+?)(\n|$)/) ||
                            text.match(/(?:前1小时|24h|6小时)?涨幅[:：]?\s*(.+?)(\n|$)/);
                            
    const creationTimeMatch = text.match(/🕒?创建时间[:：]\s*(.+?)(\n|$)/);
    
    const bundleAnalysisMatch = text.match(/🔍?捆绑分析[:：]\s*(.+?)(\n|$)/) ||
                               text.match(/市场分析[:：]\s*(.+?)(\n|$)/);
                               
    const tweetAuthorsMatch = text.match(/📬?有关推文作者数量[:：]\s*(.+?)(\n|$)/) ||
                              text.match(/有关此文件查看数量[:：]?\s*(.+?)(\n|$)/);
                              
    const blueVerifiedMatch = text.match(/🛜?蓝V用户[:：]\s*(.+?)(\n|$)/);

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
      price: "",
      liquidity: "",
      buyTax: "",
      sellTax: "",
      telegram: "",
      rawText: text,
      isGoldenDogFormat: true,
      isNewFormat: false
    };
  }
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
  
  // 打印原始消息以便调试
  console.log('原始消息列表:', telegramData?.data);
  console.log('解析后消息列表:', goldenDogMessages);
  
  return (
    <div className="space-y-5">
      {showTitle && (
        <div className="flex items-center space-x-2 mb-2">
          <FaBell className="text-yellow-400 text-xl" />
          <h3 className="text-lg font-medium text-teal-400">
            {language === 'zh' ? '金狗监测' : 'Golden Dog'}
          </h3>
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
                  <span className="font-bold text-yellow-400">{parsed.isNewFormat ? "🟢 金狗监测" : "🔔 金狗监测提醒"}</span>
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