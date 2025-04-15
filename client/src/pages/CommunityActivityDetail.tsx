import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { useParams, Link } from 'wouter';
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 定义社区活动类型
interface CommunityActivity {
  id: number;
  title: string;
  content: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CommunityActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key, language);
  const dateLocale = language === 'zh' ? zhCN : enUS;
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // 获取社区活动数据
  const { data: activity, isLoading, error } = useQuery<CommunityActivity>({
    queryKey: ['/api/community', parseInt(id)],
    refetchOnWindowFocus: false,
  });
  
  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return format(date, language === 'zh' ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm', { locale: dateLocale });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateStr;
    }
  };
  
  // 计算活动状态
  const getActivityStatus = (activity: CommunityActivity) => {
    const now = new Date();
    // 确保日期字符串正确解析为日期对象
    const start = activity.startDate ? new Date(activity.startDate) : null;
    const end = activity.endDate ? new Date(activity.endDate) : null;
    
    // 即将开始状态: 开始日期存在且在未来
    if (start && start.getTime() > now.getTime()) {
      return {
        label: language === 'zh' ? '即将开始' : 'Upcoming',
        variant: 'outline' as const
      };
    }
    
    // 已结束状态: 结束日期存在且在过去
    if (end && end.getTime() < now.getTime()) {
      return {
        label: language === 'zh' ? '已结束' : 'Completed',
        variant: 'secondary' as const
      };
    }
    
    // 正在进行状态: 所有其他情况
    return {
      label: language === 'zh' ? '进行中' : 'Ongoing',
      variant: 'default' as const
    };
  };
  
  // 分享功能
  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: activity?.title || 'STONKS DEX 社区活动',
        text: activity?.content?.substring(0, 100) + '...',
        url: window.location.href,
      })
      .then(() => console.log('活动分享成功'))
      .catch((error) => console.log('分享失败:', error));
    } else {
      setIsShareOpen(true);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert(language === 'zh' ? '链接已复制到剪贴板' : 'Link copied to clipboard');
        setIsShareOpen(false);
      })
      .catch((err) => {
        console.error('无法复制:', err);
      });
  };
  
  if (isLoading) {
    return (
      <Container className="py-8">
        <PageHeader className="pb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
        </PageHeader>
        
        <div className="my-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-36" />
          </div>
          
          {/* Image skeleton */}
          <Skeleton className="h-80 w-full mb-8" />
          
          {/* Content skeleton */}
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-3/4" />
          
          <div className="mt-8">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-8">
        <PageHeader className="pb-6">
          <div className="flex items-center gap-2">
            <Users className="text-2xl text-teal-400" />
            <PageHeaderHeading className="text-teal-400">
              {language === 'zh' ? '社区活动详情' : 'Community Activity Detail'}
            </PageHeaderHeading>
          </div>
        </PageHeader>
        
        <Alert variant="destructive" className="my-8">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>
            {language === 'zh' ? '加载错误' : 'Error Loading Activity'}
          </AlertTitle>
          <AlertDescription>
            {(error as Error).message}
          </AlertDescription>
        </Alert>
        
        <Link to="/community">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回活动列表' : 'Back to Activities'}
          </Button>
        </Link>
      </Container>
    );
  }
  
  if (!activity) {
    return (
      <Container className="py-8">
        <PageHeader className="pb-6">
          <div className="flex items-center gap-2">
            <Users className="text-2xl text-teal-400" />
            <PageHeaderHeading className="text-teal-400">
              {language === 'zh' ? '社区活动详情' : 'Community Activity Detail'}
            </PageHeaderHeading>
          </div>
        </PageHeader>
        
        <Alert className="my-8 border-amber-400/50 text-amber-400">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>
            {language === 'zh' ? '未找到活动' : 'Activity Not Found'}
          </AlertTitle>
          <AlertDescription>
            {language === 'zh' 
              ? '无法找到此社区活动，可能已被删除或不存在' 
              : 'This community activity could not be found. It may have been removed or does not exist.'}
          </AlertDescription>
        </Alert>
        
        <Link to="/community">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回活动列表' : 'Back to Activities'}
          </Button>
        </Link>
      </Container>
    );
  }
  
  const status = getActivityStatus(activity);
  
  return (
    <Container className="py-8">
      <PageHeader className="pb-6">
        <div className="flex items-center gap-2">
          <Users className="text-2xl text-teal-400" />
          <PageHeaderHeading className="text-teal-400">
            {language === 'zh' ? '社区活动详情' : 'Community Activity Detail'}
          </PageHeaderHeading>
        </div>
      </PageHeader>
      
      <div className="mb-6">
        <Link to="/community">
          <Button variant="outline" size="sm" className="border-accent/30 hover:bg-accent/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回活动列表' : 'Back to Activities'}
          </Button>
        </Link>
      </div>
      
      <div className="bg-primary/50 border border-accent/20 rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-accent">{activity.title}</h1>
            <Badge variant={status.variant} className="text-sm py-1 px-3">
              {status.label}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 text-muted-foreground">
            {activity.startDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {formatDate(activity.startDate)}
                  {activity.endDate && (
                    <span> - {formatDate(activity.endDate)}</span>
                  )}
                </span>
              </div>
            )}
            
            {activity.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{activity.location}</span>
              </div>
            )}
          </div>
          
          {/* 图片显示区 - 支持多图片轮播 */}
          {(activity.imageUrls && Array.isArray(activity.imageUrls) && activity.imageUrls.length > 0) ? (
            <div className="mb-6 space-y-4">
              {/* 主图 - 使用第一张图片 */}
              <div className="overflow-hidden rounded-lg">
                <img 
                  src={activity.imageUrls[0]} 
                  alt={`${activity.title} - 主图`} 
                  className="w-full max-h-[500px] object-cover"
                />
              </div>
              
              {/* 额外图片 - 使用水平滚动容器 */}
              {activity.imageUrls.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 pb-2">
                  {activity.imageUrls.map((imgUrl: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex-shrink-0"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${activity.title} - 图片 ${index + 1}`} 
                        className="h-24 w-auto rounded-md border border-accent/20 hover:border-accent cursor-pointer"
                        onClick={() => window.open(imgUrl, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activity.imageUrl ? (
            <div className="mb-6">
              <img 
                src={activity.imageUrl} 
                alt={activity.title} 
                className="w-full rounded-lg max-h-[500px] object-cover"
              />
            </div>
          ) : null}
          
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground/90">
              {activity.content}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Link to="/community">
          <Button variant="outline" className="border-accent/30 hover:bg-accent/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'zh' ? '返回活动列表' : 'Back to Activities'}
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          className="border-accent/30 hover:bg-accent/10" 
          onClick={shareActivity}
        >
          <Share2 className="mr-2 h-4 w-4" />
          {language === 'zh' ? '分享活动' : 'Share'}
        </Button>
      </div>
      
      {/* Share Dialog for browsers that don't support Web Share API */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'zh' ? '分享活动' : 'Share Activity'}
            </DialogTitle>
            <DialogDescription>
              {language === 'zh' ? '复制链接分享给好友' : 'Copy the link to share with friends'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 p-2 border rounded bg-background text-foreground"
            />
            <Button
              onClick={() => copyToClipboard(window.location.href)}
              variant="secondary"
            >
              {language === 'zh' ? '复制' : 'Copy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CommunityActivityDetail;