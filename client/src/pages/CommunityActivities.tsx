import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Clock, ArrowRight, CalendarRange } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const CommunityActivities: React.FC = () => {
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key, language);
  const dateLocale = language === 'zh' ? zhCN : enUS;
  
  // 获取社区活动数据
  const { data: activities, isLoading, error } = useQuery<CommunityActivity[]>({
    queryKey: ['/api/community'],
  });
  
  // 格式化日期函数
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return format(date, language === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy', { locale: dateLocale });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateStr;
    }
  };
  
  // 计算活动状态
  const getActivityStatus = (activity: CommunityActivity) => {
    const now = new Date();
    const start = activity.startDate ? new Date(activity.startDate) : null;
    const end = activity.endDate ? new Date(activity.endDate) : null;
    
    if (!activity.isActive) {
      return {
        label: language === 'zh' ? '未激活' : 'Inactive',
        variant: 'secondary' as const
      };
    }
    
    if (start && start > now) {
      return {
        label: language === 'zh' ? '即将开始' : 'Upcoming',
        variant: 'outline' as const
      };
    }
    
    if (!end || (end && end >= now)) {
      return {
        label: language === 'zh' ? '进行中' : 'Ongoing',
        variant: 'success' as const
      };
    }
    
    return {
      label: language === 'zh' ? '已结束' : 'Completed',
      variant: 'secondary' as const
    };
  };
  
  return (
    <Container className="py-8">
      <PageHeader className="pb-6">
        <div className="flex items-center gap-2">
          <Users className="text-2xl text-teal-400" />
          <PageHeaderHeading className="text-teal-400">
            {language === 'zh' ? '社区活动' : 'Community Activities'}
          </PageHeaderHeading>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground mt-1">
            {language === 'zh' 
              ? '参与STONKS DEX社区活动，与志同道合的加密爱好者共同交流和学习' 
              : 'Join STONKS DEX community activities to connect with like-minded crypto enthusiasts'}
          </p>
        </div>
      </PageHeader>
      
      {/* 社区活动列表 */}
      <div className="mt-8">
        {isLoading ? (
          // 加载状态，显示骨架屏
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-primary/50 border-accent/20 overflow-hidden">
                <div className="h-40 bg-primary/70">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="text-center p-8 border border-red-400 rounded-lg bg-red-50/10">
            <p className="text-red-400 mb-2">{language === 'zh' ? '获取社区活动时出错' : 'Error loading community activities'}</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        ) : activities && activities.length > 0 ? (
          // 显示社区活动列表
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => {
              const status = getActivityStatus(activity);
              
              return (
                <Card key={activity.id} className="flex flex-col h-full bg-primary/50 border-accent/20 overflow-hidden hover:border-accent/50 transition-all duration-300">
                  {activity.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={activity.imageUrl} 
                        alt={activity.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-bold text-accent">{activity.title}</CardTitle>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    {activity.startDate && (
                      <CardDescription className="flex items-center mt-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(activity.startDate)}</span>
                        {activity.endDate && (
                          <>
                            <span className="mx-1">-</span>
                            <span>{formatDate(activity.endDate)}</span>
                          </>
                        )}
                      </CardDescription>
                    )}
                    {activity.location && (
                      <CardDescription className="flex items-center mt-1 text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{activity.location}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-foreground/80 line-clamp-3">
                      {activity.content}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link to={`/community/${activity.id}`}>
                      <Button 
                        variant="outline" 
                        className="w-full border-accent/30 hover:bg-accent/10 hover:text-accent"
                      >
                        {language === 'zh' ? '查看详情' : 'View Details'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          // 无活动状态
          <div className="text-center p-12 border border-accent/20 rounded-lg bg-primary/30">
            <CalendarRange className="h-12 w-12 mx-auto mb-4 text-accent/50" />
            <h3 className="text-xl font-medium text-accent mb-2">
              {language === 'zh' ? '暂无社区活动' : 'No Community Activities'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'zh' 
                ? '目前没有任何社区活动信息，请稍后再来查看' 
                : 'There are no community activities at the moment. Please check back later.'}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default CommunityActivities;