import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Calendar, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function GoldDogMonitor() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // 获取金狗监测列表
  const { data: monitors, isLoading, error } = useQuery<GoldDogMonitor[]>({
    queryKey: ['/api/gold-dog-monitors'],
    // 使用默认的staleTime配置，允许数据自动刷新
  });
  
  // 获取热门金狗监测
  const { data: topMonitors, isLoading: isLoadingTop } = useQuery<GoldDogMonitor[]>({
    queryKey: ['/api/gold-dog-monitors/top'],
    // 使用默认的staleTime配置，允许数据自动刷新
  });
  
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
  
  // 标题文本
  const pageTitle = language === 'zh' ? '金狗监测' : 'Gold Dog Monitor';
  const latestTitle = language === 'zh' ? '最新监测' : 'Latest Monitors';
  const topTitle = language === 'zh' ? '热门监测' : 'Top Monitors';
  const readMoreText = language === 'zh' ? '查看详情' : 'Read More';
  const viewsText = language === 'zh' ? '浏览' : 'views';
  const noDataText = language === 'zh' ? '暂无数据' : 'No data available';
  
  return (
    <div className="container mx-auto py-24 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-10 text-[#00ffcc]">{pageTitle}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 主要内容区域 - 占据2/3宽度 */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">{latestTitle}</h2>
          
          {isLoading ? (
            // 加载中骨架屏
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card hover:bg-card/80 transition-colors">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !monitors || monitors.length === 0 ? (
            // 无数据状态
            <Card className="bg-card p-8 text-center">
              <p className="text-lg text-muted-foreground">{noDataText}</p>
            </Card>
          ) : (
            // 数据展示
            <div className="space-y-6">
              {monitors.map((monitor) => (
                <Card key={monitor.id} className="bg-card hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#00ffcc]">{monitor.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(new Date(monitor.createdAt))}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{monitor.views} {viewsText}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {monitor.imageUrl && (
                      <div className="mb-4 overflow-hidden rounded-md">
                        <img 
                          src={monitor.imageUrl} 
                          alt={monitor.title} 
                          className="w-full h-auto object-cover" 
                        />
                      </div>
                    )}
                    <p className="text-sm line-clamp-3">{monitor.content}</p>
                    
                    {/* 显示合约信息 */}
                    {monitor.contractAddress && (
                      <div className="mt-4 p-3 bg-muted rounded-md text-xs break-all">
                        <div><span className="font-semibold">{language === 'zh' ? '代币名称:' : 'Token:'}</span> {monitor.coinName}</div>
                        <div><span className="font-semibold">{language === 'zh' ? '网络:' : 'Network:'}</span> {monitor.network}</div>
                        <div><span className="font-semibold">{language === 'zh' ? '合约地址:' : 'Contract:'}</span> {monitor.contractAddress}</div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/20"
                      onClick={() => setLocation(`/gold-dog-monitor/${monitor.id}`)}
                    >
                      {readMoreText}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* 侧边栏区域 - 占据1/3宽度 */}
        <div className="md:col-span-1">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-xl">{topTitle}</CardTitle>
              <CardDescription>
                {language === 'zh' ? '最受欢迎的金狗监测' : 'Most popular monitors'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTop ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !topMonitors || topMonitors.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">{noDataText}</p>
              ) : (
                <div className="space-y-4">
                  {topMonitors.map((monitor, index) => (
                    <div key={monitor.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <Link href={`/gold-dog-monitor/${monitor.id}`}>
                        <a className="flex items-start gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors">
                          {monitor.imageUrl ? (
                            <img 
                              src={monitor.imageUrl} 
                              alt={monitor.title}
                              className="w-12 h-12 object-cover rounded-md" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                              {index + 1}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2">{monitor.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Eye className="h-3 w-3" />
                              <span>{monitor.views} {viewsText}</span>
                            </div>
                          </div>
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}