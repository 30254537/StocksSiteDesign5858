import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/ui/product-grid";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonText } from "@/components/ui/neon-text";

export default function Home() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 增强版滚动功能 - 支持URL哈希和会话存储标记
  useEffect(() => {
    // 检查URL哈希或会话存储中的标记
    const shouldScrollToProducts = 
      window.location.hash === '#products' || 
      sessionStorage.getItem('scrollToProducts') === 'true';
    
    if (shouldScrollToProducts) {
      // 清除会话存储中的标记
      if (sessionStorage.getItem('scrollToProducts')) {
        sessionStorage.removeItem('scrollToProducts');
      }
      
      // 稍微延迟以确保DOM完全加载
      setTimeout(() => {
        const productsSection = document.getElementById('products');
        if (productsSection) {
          // 获取header高度，确保滚动位置正确
          const headerHeight = document.querySelector('header')?.offsetHeight || 0;
          
          // 计算正确的滚动位置，减去header高度并额外偏移确保标题完全可见
          const scrollPosition = productsSection.offsetTop - headerHeight - 5;
          
          // 使用平滑滚动
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="pt-16">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 grid-bg opacity-20 z-0"></div>
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none z-50 opacity-30"></div>
      
      {/* Hero Section */}
      <section className="hero relative min-h-screen pt-20 pb-12 flex flex-col justify-center z-10 overflow-hidden">
        {/* Background with deep blue color */}
        <div className="absolute inset-0 bg-primary z-0"></div>
        
        {/* Animated Circuit Lines */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L20,40 L40,20 L60,60 L80,40 L100,100" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
            <path d="M0,20 L20,60 L40,40 L60,80 L80,60 L100,80" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
            <path d="M0,40 L20,80 L40,60 L60,100 L80,80 L100,60" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
          </svg>
        </div>
        
        {/* Hero Content - Centered */}
        <div className="container mx-auto px-4 relative z-10">
          {/* Centered Content */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-3xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 font-orbitron leading-tight">
                <span className="block">Trade</span>
                <span className="block">Decentralized,</span>
                <span className="text-accent animate-glow block">Wear the</span>
                <span className="text-accent animate-glow block">Future</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-300">{t("hero.subtitle")}</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="#products" 
                  className="inline-block cta-button bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-primary transition-all duration-300 font-medium py-3 px-6 rounded-lg text-lg text-center w-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                      const scrollPosition = productsSection.offsetTop - headerHeight - 5;
                      window.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  {t("hero.cta")}
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Down Arrow */}
        <a 
          href="#products" 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-accent animate-bounce"
          onClick={(e) => {
            e.preventDefault();
            const productsSection = document.getElementById('products');
            if (productsSection) {
              const headerHeight = document.querySelector('header')?.offsetHeight || 0;
              const scrollPosition = productsSection.offsetTop - headerHeight - 5;
              window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
              });
            }
          }}
        >
          <i className="fas fa-chevron-down text-2xl"></i>
        </a>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 pt-16 relative z-20">
        {/* Background with deep blue color */}
        <div className="absolute inset-0 bg-primary z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12" style={{ paddingTop: '10px' }}>
            {/* Product Filter Banner */}
            <div className="mb-6 mx-auto text-center">
              <div className="inline-block border-2 border-accent rounded-lg px-10 py-3 text-xl font-bold">
                <NeonText>{language === 'en' ? "STONKS DEX Merchandise" : "STONKS DEX 周边产品"}</NeonText>
              </div>
            </div>
            
            {/* Product Filter Tabs - Hidden by user request */}
            <div className="hidden">
              <Button onClick={() => handleCategoryChange("all")}>{t("products.all")}</Button>
              <Button onClick={() => handleCategoryChange("clothing")}>{t("products.clothing")}</Button>
              <Button onClick={() => handleCategoryChange("digital")}>{t("products.digital")}</Button>
              <Button onClick={() => handleCategoryChange("accessories")}>{t("products.accessories")}</Button>
            </div>
          </div>
          
          {/* Product Grid - 调整边距确保显示完整 */}
          <div className="px-0 py-2">
            <ProductGrid category={selectedCategory === "all" ? undefined : selectedCategory} />
          </div>
        </div>
      </section>
      
      {/* About Us Section */}
      <section id="about" className="py-20 relative z-20">
        {/* Deep blue background */}
        <div className="absolute inset-0 bg-primary z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-8 text-accent animate-glow-soft">
              {t("about.title")}
            </h2>
            
            {/* 使用直接硬编码内容代替翻译，保持与About页面内容一致 */}
            <div className="text-lg leading-relaxed text-center text-gray-200">
              <div className="border border-[#00ffcc]/30 p-8 rounded-lg flex flex-col items-center">
                <p className="max-w-3xl text-center">STONKS DEX SHOP是MY STONKS去中心化交易所的文化延伸，我们以创新与社区为核心，打造连接区块链技术与现实世界的桥梁。这里不仅是生态周边的展示平台，更是全球区块链爱好者共同参与、共同成长的协作网络。通过独特的设计与互动体验，我们致力于让每个人都能成为生态共建者，见证去中心化未来的无限可能。</p>
                
                <p className="mt-6"></p>
                
                <p className="text-[#00ffcc] font-bold text-center">1.社区共治 权力共享</p>
                <p className="max-w-3xl text-center">持有MY STONKS平台代币即拥有生态话语权，同时皆为股东，共同治理，共享成果，彰显协作力量。<br/>无论是交易平台的升级方向，还是周边产品的设计理念，每位成员都能通过透明机制参与决策。我们相信，真正的创新源于集体智慧，而非单一中心。</p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">2.文化连接 打破边界</p>
                <p className="max-w-3xl text-center">从限量周边到线下活动，每一件产品、每一次互动都是传递区块链精神的载体。我们通过精心设计的文化符号，将技术理念转化为可感知的体验，让去中心化思想突破屏幕的界限，融入日常生活。</p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">3.价值循环 消费共建</p>
                <p className="max-w-3xl text-center">周边产品的部分收益将直接注入MY STONKS流动性池或反哺MY STONKS生态建设，形成"消费-共建-增值"的闭环。购买一件周边，不仅是支持理念，更是推动整个社区向前的动力。</p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">4.实体链接 数字精神</p>
                <p className="max-w-3xl text-center">每款周边产品都承载着MY STONKS的核心理念。无论是印有DEX的LOGO还是社区宣言的潮品，还是融合平台数据的艺术装置，它们既是收藏品，也是参与生态的"钥匙"——持有者将以周边为媒介，互动为桥梁，构建全球区块链爱好者的协作生态。</p>
                
                <p className="mt-6"></p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">5.线上线下 互动共振</p>
                <p className="max-w-3xl text-center">我们定期举办全球协作线下聚会活动：从设计众创周、MY STONKS文化沙龙，到用户提案落地计划，让线上讨论变为现实成果。在这里，灵感与行动从未如此接近。</p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">6.透明机制 信任为基</p>
                <p className="max-w-3xl text-center">所有生态决策、资金流向均通过公开渠道可查，社区成员可实时追踪每一份贡献如何转化为平台土壤。这种开放性，正是我们对"去中心化"的真诚诠释。</p>
                
                <p className="text-[#00ffcc] font-bold mt-6 text-center">加入这场革新运动</p>
                <p className="max-w-3xl text-center">STONKS DEX SHOP不属于某个团队，而是属于所有相信去中心化未来的人。无论你是开发者、设计师，还是区块链文化的传播者，这里都有属于你的角色：</p>
                
                <div className="flex flex-col items-center mt-2">
                  <p className="text-center">加入Telegram社区，获取MY STONKS代币，成为生态共建股东。</p>
                  <p className="text-center">参与周边共创计划，让你的设计成为社区文化符号。</p>
                  <p className="text-center">出席全球线下活动，与志同道合者探索区块链的更多可能。</p>
                
                  <p className="mt-6 text-center">我们正在书写一个新时代的故事——技术属于大众，价值回归社区，创新没有边界。</p>
                  <p className="mt-4 font-bold text-[#00ffcc] text-center">STONKS TO THE MOON，未来由你定义！</p>
                  <p className="mt-2 text-center">→ <a href="https://t.me/STONKSOPEN" target="_blank" className="text-[#00ffcc]">立即加入社区</a> | <a href="/products" className="text-[#00ffcc]">探索周边系列</a></p>
                  <p className="mt-4 italic text-center">MY STONKS生态：因为相信，所以看见！</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
