import React from 'react';
import Layout from '@/components/Layout';
import CryptoTweets from '@/components/CryptoTweets';
import TelegramFeed from '@/components/TelegramFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiDiscord, SiTwitter, SiTelegram } from "react-icons/si";
import { useLanguage } from '@/contexts/LanguageContext';

const CommunityPage: React.FC = () => {
  const { language, getLocalTranslation } = useLanguage();
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-teal-400">
          {language === 'zh' ? 'STONKS DEX 社区' : 'STONKS DEX Community'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-center border border-gray-700 hover:border-teal-400 transition-colors">
            <SiTwitter className="text-4xl text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Twitter</h3>
            <p className="text-gray-300 text-center mb-4">
              {language === 'zh' 
                ? '关注我们的 Twitter 获取最新资讯和更新' 
                : 'Follow us on Twitter for the latest news and updates'}
            </p>
            <a 
              href="https://twitter.com/StonksDEX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-auto py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {language === 'zh' ? '关注' : 'Follow'}
            </a>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-center border border-gray-700 hover:border-teal-400 transition-colors">
            <SiTelegram className="text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Telegram</h3>
            <p className="text-gray-300 text-center mb-4">
              {language === 'zh' 
                ? '加入我们的 Telegram 频道，与社区成员实时互动' 
                : 'Join our Telegram channel for real-time community interaction'}
            </p>
            <a 
              href="https://t.me/chengzi_golden" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-auto py-2 px-4 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            >
              {language === 'zh' ? '加入' : 'Join'}
            </a>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-center border border-gray-700 hover:border-teal-400 transition-colors">
            <SiDiscord className="text-4xl text-indigo-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discord</h3>
            <p className="text-gray-300 text-center mb-4">
              {language === 'zh' 
                ? '加入我们的 Discord 服务器，参与社区讨论' 
                : 'Join our Discord server for community discussions'}
            </p>
            <a 
              href="https://discord.gg/stonksdex" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-auto py-2 px-4 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {language === 'zh' ? '加入' : 'Join'}
            </a>
          </div>
        </div>
        
        <Tabs defaultValue="tweets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="tweets" className="text-base">
              {language === 'zh' ? '热门推文' : 'Trending Tweets'}
            </TabsTrigger>
            <TabsTrigger value="telegram" className="text-base">
              {language === 'zh' ? 'Telegram 频道' : 'Telegram Channel'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tweets">
            <CryptoTweets />
          </TabsContent>
          
          <TabsContent value="telegram">
            <TelegramFeed />
          </TabsContent>
        </Tabs>
        
        <div className="mt-16 bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">
            {language === 'zh' ? '加入 STONKS DEX 社区' : 'Join the STONKS DEX Community'}
          </h2>
          
          <p className="text-gray-300 text-center mb-8 max-w-3xl mx-auto">
            {language === 'zh' 
              ? 'STONKS DEX 是一个由社区驱动的 DeFi 平台。通过加入我们的社区，您可以参与治理决策、获取早期项目信息、参与社区活动，并与其他加密货币爱好者交流。' 
              : 'STONKS DEX is a community-driven DeFi platform. By joining our community, you can participate in governance decisions, get early access to project information, join community events, and connect with other crypto enthusiasts.'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://twitter.com/StonksDEX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <SiTwitter className="mr-2" />
              Twitter
            </a>
            
            <a 
              href="https://t.me/chengzi_golden" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-2 px-6 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors flex items-center"
            >
              <SiTelegram className="mr-2" />
              Telegram
            </a>
            
            <a 
              href="https://discord.gg/stonksdex" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-2 px-6 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <SiDiscord className="mr-2" />
              Discord
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityPage;