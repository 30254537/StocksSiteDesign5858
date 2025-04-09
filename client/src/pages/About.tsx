import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="py-20 px-4 md:px-8 lg:px-16 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#00ffcc]">{t("about.title")}</h1>
        
        <div className="prose prose-sm md:prose-base lg:prose-lg prose-invert prose-headings:text-[#00ffcc] prose-a:text-[#00ffcc] hover:prose-a:text-[#00ffcc]/70">
          <div dangerouslySetInnerHTML={{ __html: t("about.content") }} />
        </div>
        
        {/* Team Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#00ffcc]">团队成员</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">DEV 001</h3>
              <p className="text-gray-300 mb-4">首席开发官</p>
              <p className="text-sm">STONKS DEX核心开发者，负责去中心化STONKS DEX的智能合约和区块链交互。</p>
            </div>
            
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">TRADER 025</h3>
              <p className="text-gray-300 mb-4">交易策略师</p>
              <p className="text-sm">资深交易员和DEX流动性提供者，为STONKS DEX设计最佳交易路径和策略。</p>
            </div>
            
            <div className="bg-primary/30 border border-accent/20 p-6 rounded-lg hover:bg-accent/5 transition-colors">
              <h3 className="text-xl font-semibold mb-2">ARTIST 108</h3>
              <p className="text-gray-300 mb-4">创意总监</p>
              <p className="text-sm">负责所有STONKS DEX周边的设计创意，打造独特的去中心化品牌形象。</p>
            </div>
          </div>
        </div>
        
        {/* Community Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#00ffcc]">社区</h2>
          
          <div className="bg-primary/30 border border-accent/20 p-8 rounded-lg">
            <p className="mb-6">STONKS DEX由社区驱动，社区成员在平台发展中扮演着重要角色。</p>
            
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>通过持有$STONKS代币参与平台治理</li>
              <li>获取独家周边商品的折扣和早期访问权限</li>
              <li>参与社区活动，包括空投、挖矿挑战和周边设计比赛</li>
              <li>为去中心化 STONKS DEX 的改进提供反馈和建议</li>
            </ul>
            
            <div className="mt-8">
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="bg-accent text-primary px-6 py-3 rounded-md font-medium hover:bg-white transition-colors"
              >
                加入我们的Telegram社区
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}