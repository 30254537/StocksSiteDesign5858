import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { BsArrowClockwise } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type FinanceNewsProps = {
  limit?: number;
  showRefresh?: boolean;
  showTitle?: boolean;
};

const FinanceNews: React.FC<FinanceNewsProps> = ({ 
  limit = 5, 
  showRefresh = false,
  showTitle = true
}) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);

  // 从API获取财经快讯
  const { data, isLoading, isError, error } = useQuery<{ data: any[] }>({
    queryKey: ['/api/finance-news', limit],
    queryFn: () => apiRequest('GET', `/api/finance-news?limit=${limit}`).then(res => res.json()),
  });

  // 同步财经快讯的Mutation
  const syncFinanceNewsMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      return await apiRequest('POST', '/api/finance-news/sync').then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: language === 'zh' ? '同步成功' : 'Sync Successful',
        description: language === 'zh' 
          ? `成功同步 ${data.message ? data.message : '财经快讯'}` 
          : `Successfully synced ${data.message ? data.message : 'finance news'}`,
      });
      // 更新查询缓存，刷新财经快讯数据
      queryClient.invalidateQueries({ queryKey: ['/api/finance-news'] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'zh' ? '同步失败' : 'Sync Failed',
        description: error.message || (language === 'zh' ? '无法同步财经快讯' : 'Failed to sync finance news'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // 处理手动同步
  const handleSync = () => {
    syncFinanceNewsMutation.mutate();
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  // 渲染错误状态
  if (isError) {
    return (
      <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg">
        <p className="text-center text-red-300">
          {language === 'zh' ? '获取财经快讯失败' : 'Failed to load finance news'}: 
          {(error as Error)?.message || ''}
        </p>
        {showRefresh && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleSync} variant="outline" className="flex items-center">
              <BsArrowClockwise className="mr-2" />
              {language === 'zh' ? '重试' : 'Retry'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 渲染没有数据的状态
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
        <p className="text-center text-gray-400">
          {language === 'zh' ? '暂无财经快讯' : 'No finance news available'}
        </p>
        {showRefresh && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleSync} variant="outline" className="flex items-center">
              <BsArrowClockwise className="mr-2" />
              {language === 'zh' ? '同步快讯' : 'Sync News'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-teal-400">
            {language === 'zh' ? '实时财经快讯' : 'Real-time Financial News'}
          </h3>
          {showRefresh && (
            <Button 
              onClick={handleSync} 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BsArrowClockwise className="mr-2" />
              )}
              {language === 'zh' ? '同步快讯' : 'Sync News'}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {data.data.map((news) => (
          <div 
            key={news.id} 
            className="bg-gray-800/50 border border-gray-700 hover:border-teal-400 transition-colors p-4 rounded-lg"
          >
            <div className="flex flex-col">
              <p className="text-sm font-medium mb-2 text-white whitespace-pre-line">{news.text}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {new Date(news.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-teal-400">
                  {news.sender}
                </span>
              </div>
              {news.sourceUrl && (
                <a 
                  href={news.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {language === 'zh' ? '查看原文' : 'Read more'} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceNews;