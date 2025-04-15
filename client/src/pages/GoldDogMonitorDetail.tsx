import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Calendar, Clock, Eye, ChevronLeft, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoldDogMonitor {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  coinName: string | null;
  network: string | null;
  contractAddress: string | null;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function GoldDogMonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  // 获取单个金狗监测详情
  const { data: monitor, isLoading, error } = useQuery<GoldDogMonitor>({
    queryKey: ['/api/gold-dog-monitors', id],
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });
  
  // 复制合约地址到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: language === 'zh' ? '已复制' : 'Copied',
        description: language === 'zh' ? '合约地址已复制到剪贴板' : 'Contract address copied to clipboard',
      });
      
      // 3秒后重置状态
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: language === 'zh' ? '复制失败' : 'Copy Failed',
        description: language === 'zh' ? '无法复制到剪贴板' : 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };
  
  // 处理加载错误
  useEffect(() => {
    if (error) {
      toast({
        title: language === 'zh' ? '加载失败' : 'Loading Failed',
        description: language === 'zh' 
          ? '无法加载金狗监测数据，请稍后再试' 
          : 'Failed to load Gold Dog Monitor data, please try again later',
        variant: 'destructive',
      });
    }
  }, [error, toast, language]);

  // 文本翻译
  const backText = language === 'zh' ? '返回列表' : 'Back to List';
  const dateLabel = language === 'zh' ? '发布时间' : 'Published';
  const viewsLabel = language === 'zh' ? '浏览量' : 'Views';
  const coinLabel = language === 'zh' ? '代币名称' : 'Token Name';
  const networkLabel = language === 'zh' ? '网络' : 'Network';
  const contractLabel = language === 'zh' ? '合约地址' : 'Contract Address';
  const loadingText = language === 'zh' ? '加载中...' : 'Loading...';
  const copyText = language === 'zh' ? '复制' : 'Copy';
  const copiedText = language === 'zh' ? '已复制' : 'Copied';
  const viewOnBlockExplorerText = language === 'zh' ? '在区块浏览器中查看' : 'View on Block Explorer';
  
  // 根据网络获取区块浏览器URL
  const getBlockExplorerUrl = (network: string, address: string): string => {
    switch (network?.toLowerCase()) {
      case 'ethereum':
      case 'eth':
        return `https://etherscan.io/address/${address}`;
      case 'binance smart chain':
      case 'bsc':
        return `https://bscscan.com/address/${address}`;
      case 'solana':
      case 'sol':
        return `https://solscan.io/account/${address}`;
      case 'polygon':
      case 'matic':
        return `https://polygonscan.com/address/${address}`;
      case 'avalanche':
      case 'avax':
        return `https://snowtrace.io/address/${address}`;
      default:
        return '';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-1" 
        onClick={() => setLocation('/gold-dog-monitor')}
      >
        <ChevronLeft className="h-4 w-4" />
        {backText}
      </Button>
      
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4 max-w-[600px]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-[300px] w-full max-w-3xl" />
          <Skeleton className="h-32 w-full max-w-3xl" />
          <Skeleton className="h-24 w-full max-w-md" />
        </div>
      ) : !monitor ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">
            {error ? (language === 'zh' ? '加载失败' : 'Failed to load data') : loadingText}
          </p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-[#00ffcc]">{monitor.title}</h1>
          
          <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{dateLabel}: {formatDate(new Date(monitor.createdAt))}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{viewsLabel}: {monitor.views}</span>
            </div>
          </div>
          
          {monitor.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img 
                src={monitor.imageUrl} 
                alt={monitor.title} 
                className="w-full h-auto max-h-[500px] object-contain bg-card border" 
              />
            </div>
          )}
          
          <div className="prose prose-invert max-w-none mb-8">
            {/* 分段显示内容，处理换行 */}
            {monitor.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          
          {/* 合约信息卡片 */}
          {monitor.contractAddress && (
            <Card className="bg-card mb-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-[#00ffcc]">
                  {language === 'zh' ? '合约信息' : 'Contract Information'}
                </h3>
                
                <div className="space-y-4">
                  {monitor.coinName && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium min-w-32">{coinLabel}:</span>
                      <span>{monitor.coinName}</span>
                    </div>
                  )}
                  
                  {monitor.network && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium min-w-32">{networkLabel}:</span>
                      <span>{monitor.network}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">{contractLabel}:</span>
                    <div className="flex items-center gap-2 bg-background p-3 rounded-md break-all">
                      <code className="text-sm">{monitor.contractAddress}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto shrink-0"
                        onClick={() => copyToClipboard(monitor.contractAddress || '')}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">
                          {copied ? copiedText : copyText}
                        </span>
                      </Button>
                    </div>
                    
                    {/* 区块浏览器链接 */}
                    {monitor.network && monitor.contractAddress && (
                      <div className="mt-2">
                        <a 
                          href={getBlockExplorerUrl(monitor.network, monitor.contractAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm flex items-center gap-1 text-[#00ffcc] hover:underline"
                        >
                          {viewOnBlockExplorerText}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Separator className="my-8" />
          
          <div className="text-sm text-muted-foreground italic">
            {language === 'zh' 
              ? '免责声明：本监测内容仅供参考，不构成投资建议。数字货币投资存在高风险，请谨慎决策。'
              : 'Disclaimer: This monitoring content is for reference only and does not constitute investment advice. Cryptocurrency investments are high-risk, please make decisions carefully.'}
          </div>
        </div>
      )}
    </div>
  );
}