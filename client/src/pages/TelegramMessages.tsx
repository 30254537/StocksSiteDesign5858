import React from 'react';
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import TgLatestMessages from '@/components/TgLatestMessages';
import { FaTelegram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';

const TelegramMessages: React.FC = () => {
  const { language } = useLanguage();
  
  return (
    <Container className="py-8">
      <PageHeader className="pb-6">
        <div className="flex items-center gap-2">
          <FaTelegram className="text-2xl text-blue-400" />
          <PageHeaderHeading className="text-teal-400">
            {language === 'zh' ? 'TG最新推送' : 'Latest TG Posts'}
          </PageHeaderHeading>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground mt-1">
            {language === 'zh' 
              ? '来自STONKS DEX官方电报频道的最新消息' 
              : 'Latest messages from STONKS DEX official Telegram channel'}
          </p>
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <a 
              href="https://t.me/chengzi_golden/6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <FaTelegram />
              {language === 'zh' ? '关注频道' : 'Follow Channel'}
            </a>
          </Badge>
        </div>
      </PageHeader>
      
      <div className="mt-4">
        <TgLatestMessages limit={10} showTitle={false} />
      </div>
    </Container>
  );
};

export default TelegramMessages;