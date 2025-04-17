import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="py-20 px-4 md:px-8 lg:px-16 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#00ffcc]">{t("about.title")}</h1>
        
        {/* 使用硬编码的内容而不是从translations获取，以避免语法错误 */}
        <div className="prose prose-sm md:prose-base lg:prose-lg prose-invert prose-headings:text-[#00ffcc] prose-a:text-[#00ffcc] hover:prose-a:text-[#00ffcc]/70">
          {/* 所有内容放在一个大框中 */}
          <div className="border border-[#00ffcc]/30 p-8 rounded-lg">
            <p>STONKS DEX SHOP是MY STONKS去中心化交易所的文化延伸，我们以创新与社区为核心，打造连接区块链技术与现实世界的桥梁。这里不仅是生态周边的展示平台，更是全球区块链爱好者共同参与、共同成长的协作网络。通过独特的设计与互动体验，我们致力于让每个人都能成为生态共建者，见证去中心化未来的无限可能。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">1.社区共治 权力共享</p>
            <p>持有MY STONKS平台代币即拥有生态话语权，同时皆为股东，共同治理，共享成果，彰显协作力量。<br/>无论是交易平台的升级方向，还是周边产品的设计理念，每位成员都能通过透明机制参与决策。我们相信，真正的创新源于集体智慧，而非单一中心。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">2.文化连接 打破边界</p>
            <p>从限量周边到线下活动，每一件产品、每一次互动都是传递区块链精神的载体。我们通过精心设计的文化符号，将技术理念转化为可感知的体验，让去中心化思想突破屏幕的界限，融入日常生活。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">3.价值循环 共享成长</p>
            <p>周边产品的收益将直接反哺MY STONKS生态建设，形成共建共享的良性循环。购买一件周边，不仅是支持理念，更是推动整个社区向前的动力。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">4.实体化数字精神</p>
            <p>每款周边产品都承载着MY STONKS的核心理念。无论是印有社区宣言的潮品，还是融合平台数据的艺术装置，它们既是收藏品，也是参与生态的钥匙——持有者将解锁专属活动资格与社区荣誉身份。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">5.线上线下共振</p>
            <p>我们定期举办全球协作活动：从设计众创周、区块链文化沙龙，到用户提案落地计划，让线上讨论变为现实成果。在这里，灵感与行动从未如此接近。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">6.价值层共识</p>
            <p>周边销售额的30%自动注入MY STONKS流动性池，形成文化消费→资本增值→治理优化的飞轮效应。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">7.透明机制 信任为基</p>
            <p>所有生态决策、资金流向均通过公开渠道可查，社区成员可实时追踪每一份贡献如何转化为平台进展。这种开放性，正是我们对去中心化的真诚诠释。</p>
            
            <p className="text-[#00ffcc] font-bold mt-6">加入这场革新运动</p>
            <p>STONKS DEX SHOP不属于某个团队，而是属于所有相信去中心化未来的人。无论你是开发者、设计师，还是区块链文化的传播者，这里都有属于你的角色：</p>
            <ul className="list-disc ml-5 mt-2 space-y-2">
              <li>加入<a href="https://t.me/STONKSOPEN" target="_blank" className="text-[#00ffcc]">Telegram社区</a>，获取MY STONKS代币，成为生态共建股东；</li>
              <li>参与周边共创计划，让你的设计成为社区文化符号；</li>
              <li>出席全球线下活动，与志同道合者探索区块链的更多可能。</li>
            </ul>
            
            <p className="mt-6">我们正在书写一个新时代的故事——技术属于大众，价值回归社区，创新没有边界。</p>
            <p className="mt-4 font-bold text-[#00ffcc]">STONKS TO THE MOON，未来由你定义！</p>
            <p className="mt-2">→ <a href="https://t.me/STONKSOPEN" target="_blank" className="text-[#00ffcc]">立即加入社区</a> | <a href="/products" className="text-[#00ffcc]">探索周边系列</a></p>
            <p className="mt-4 italic">MY STONKS生态：因为相信，所以看见</p>
          </div>
        </div>
        
        {/* Community Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[#00ffcc]">{t("about.communityTitle")}</h2>
          
          <div className="bg-primary/30 border border-accent/20 p-8 rounded-lg">
            <p className="mb-6">{t("about.communityDescription")}</p>
            
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>{t("about.communityPoint1")}</li>
              <li>{t("about.communityPoint2")}</li>
              <li>{t("about.communityPoint3")}</li>
              <li>{t("about.communityPoint4")}</li>
            </ul>
            
            <div className="mt-8">
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="bg-accent text-primary px-6 py-3 rounded-md font-medium hover:bg-white transition-colors"
              >
                {t("about.joinTelegram")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}