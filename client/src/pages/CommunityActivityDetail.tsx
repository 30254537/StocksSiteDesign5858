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
import { ArrowLeft, Calendar, MapPin, Users, Share2, X, Maximize2, ZoomIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommunityActivity } from '@shared/schema';

export default function CommunityActivityDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key, language);
  const dateLocale = language === 'zh' ? zhCN : enUS;
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  
  // 获取社区活动数据
  const { data, isLoading, error } = useQuery<CommunityActivity>({
    queryKey: [`/api/cms/community/${id}`],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // 不缓存数据，每次都重新获取
    retry: 3 // 出错时重试3次
  });
  
  // 在数据加载成功后进行日志输出
  React.useEffect(() => {
    if (data) {
      console.log("活动数据获取成功:", {
        id: data.id,
        title: data.title,
        content: data.content,
        contentLength: data.content?.length,
        imageUrls: data.imageUrls,
        imageCount: data.imageUrls?.length,
        startDate: data.startDate,
        endDate: data.endDate
      });
    }
  }, [data]);
  
  // 添加键盘导航功能
  React.useEffect(() => {
    if (!data?.imageUrls || data.imageUrls.length <= 1) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev: number) => 
          prev <= 0 ? (data.imageUrls?.length || 1) - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev: number) => 
          prev >= (data.imageUrls?.length || 1) - 1 ? 0 : prev + 1
        );
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data?.imageUrls]);
  
  // 格式化日期 - 只显示日期，不显示时间
  const formatDate = (dateStr: string | null | Date) => {
    if (!dateStr) return '';
    
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      return format(date, language === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy', { locale: dateLocale });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return typeof dateStr === 'string' ? dateStr : '';
    }
  };
  
  // 计算活动状态
  const getActivityStatus = (activity: CommunityActivity) => {
    const now = new Date();
    
    // 确保日期字符串正确解析为日期对象
    const start = activity.startDate ? new Date(activity.startDate) : null;
    const end = activity.endDate ? new Date(activity.endDate) : null;
    
    // 已结束状态: 结束日期存在且在过去
    if (end && now.getTime() > end.getTime()) {
      return {
        label: language === 'zh' ? '已结束' : 'Completed',
        variant: 'secondary' as const
      };
    }
    
    // 即将开始状态: 开始日期存在且在未来
    if (start && now.getTime() < start.getTime()) {
      return {
        label: language === 'zh' ? '即将开始' : 'Upcoming',
        variant: 'outline' as const
      };
    }
    
    // 正在进行状态: 如果当前时间在开始和结束之间，或没有明确的开始/结束时间
    return {
      label: language === 'zh' ? '进行中' : 'Ongoing',
      variant: 'default' as const
    };
  };
  
  // 分享功能
  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.title || 'STONKS DEX 社区活动',
        text: data?.content ? data.content.substring(0, 100) + '...' : '',
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
  
  if (!data) {
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
  
  const status = getActivityStatus(data);
  
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
          {/* 居中显示绿色标题 */}
          <div className="flex flex-col items-center justify-center text-center gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-accent">{data.title}</h1>
          </div>
          
          {/* 活动基本信息（以指定顺序排列）*/}
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p className="mb-2">活动ID: {data.id}</p>
              <p className="mb-2">
                <span className="inline-flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-accent" /> 
                  {formatDate(data.startDate)} - {formatDate(data.endDate)}
                </span>
              </p>
              <p className="mb-2">
                <span className="inline-flex items-center">
                  <Users className="h-4 w-4 mr-1 text-accent" /> 
                  活动主题: {data.title}
                </span>
              </p>
              <p className="mb-2">
                <span className="inline-flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-accent" /> 
                  {data.location || '济州岛万豪度假酒店'}
                </span>
              </p>
            </div>
            
            <div className="flex justify-end">
              <Badge variant={status.variant} className="text-sm py-1 px-3">
                {status.label}
              </Badge>
            </div>
          </div>
          
          {/* 图片显示区 - 支持多图片轮播 */}
          {data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0 ? (
            <div className="mb-6 space-y-4">
              {/* 主图轮播 - 带左右切换箭头 */}
              <div className="relative overflow-hidden rounded-lg group">
                {/* 左侧切换按钮 */}
                <button 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 z-10 hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setCurrentImageIndex((prev: number) => 
                      prev <= 0 ? (data.imageUrls?.length || 1) - 1 : prev - 1
                    );
                  }}
                >
                  <span className="text-xl font-bold px-2">&lt;</span>
                </button>

                {/* 主图 - 带放大功能 */}
                <div className="relative cursor-pointer">
                  <img 
                    src={data.imageUrls?.[currentImageIndex] || ''} 
                    alt={`${data.title} - 主图 ${currentImageIndex + 1}`} 
                    className="w-full object-contain h-[400px]"
                    onClick={() => {
                      if (data.imageUrls?.[currentImageIndex]) {
                        setEnlargedImageUrl(data.imageUrls[currentImageIndex]);
                        setIsImageModalOpen(true);
                      }
                    }}
                  />
                  <button 
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-10 hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      if (data.imageUrls?.[currentImageIndex]) {
                        setEnlargedImageUrl(data.imageUrls[currentImageIndex]);
                        setIsImageModalOpen(true);
                      }
                    }}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </div>

                {/* 右侧切换按钮 */}
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 z-10 hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setCurrentImageIndex((prev: number) => 
                      prev >= (data.imageUrls?.length || 1) - 1 ? 0 : prev + 1
                    );
                  }}
                >
                  <span className="text-xl font-bold px-2">&gt;</span>
                </button>

                {/* 图片计数指示器 */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {data.imageUrls?.length || 1}
                </div>
              </div>
              
              {/* 缩略图导航 */}
              {data.imageUrls && data.imageUrls.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 pb-2">
                  {data.imageUrls.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      className={`flex-shrink-0 cursor-pointer ${index === currentImageIndex ? 'ring-2 ring-accent' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${data.title} - 图片 ${index + 1}`} 
                        className="h-24 w-auto rounded-md border border-accent/20 hover:border-accent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : data.imageUrl ? (
            <div className="mb-6 relative cursor-pointer">
              <img 
                src={data.imageUrl} 
                alt={data.title} 
                className="w-full rounded-lg object-contain h-[400px]"
                onClick={() => {
                  setEnlargedImageUrl(data.imageUrl);
                  setIsImageModalOpen(true);
                }}
              />
              <button 
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-10 hover:bg-black/70 transition-opacity opacity-0 hover:opacity-100"
                onClick={() => {
                  setEnlargedImageUrl(data.imageUrl);
                  setIsImageModalOpen(true);
                }}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>
          ) : null}
          
          {/* 活动内容展示区 */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-accent mb-3">
              {language === 'zh' ? '活动详情' : 'Event Details'}
            </h2>
            <div className="whitespace-pre-wrap text-foreground/90 mt-2 border border-accent/20 p-4 rounded-md">
              {data.content 
                ? data.content 
                : <span className="text-amber-400 italic">（未提供活动内容）</span>}
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

      {/* 图片放大模态框 */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen} modal>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-accent">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 关闭按钮 */}
            <button 
              className="absolute top-2 right-2 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* 放大的图片 */}
            {enlargedImageUrl && (
              <img 
                src={enlargedImageUrl} 
                alt="Enlarged view" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}