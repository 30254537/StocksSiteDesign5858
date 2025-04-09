import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/ui/product-grid";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonText } from "@/components/ui/neon-text";

export default function Home() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Scroll to products section when URL has #products
  useEffect(() => {
    if (window.location.hash === '#products') {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'instant' }); // 使用立即滚动而不是平滑滚动
      }
    }
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="pt-12">
      {/* Background Grid Effect - 已移除 */}
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none z-50 opacity-30"></div>
      
      {/* Hero Section */}
      <section className="hero relative min-h-80vh pt-0 pb-0 flex flex-col z-10 overflow-hidden">
        {/* Background with deep blue color */}
        <div className="absolute inset-0 bg-primary z-0"></div>
        
        {/* Animated Circuit Lines */}
        <div className="absolute inset-0 z-1">
          <div className="circuit-pattern h-full w-full opacity-20"></div>
        </div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10 mt-0">
          {/* Top Content */}
          <div className="flex flex-col items-center justify-start text-center pt-24">
            <div className="w-full max-w-3xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-orbitron leading-tight">
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
                      productsSection.scrollIntoView({ behavior: 'instant' });
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
              productsSection.scrollIntoView({ behavior: 'instant' });
            }
          }}
        >
          <i className="fas fa-chevron-down text-2xl"></i>
        </a>
      </section>

      {/* Products Section */}
      <section id="products" className="pt-0 mt-0 -translate-y-64 pb-20 relative z-20">
        {/* Background with deep blue color */}
        <div className="absolute inset-0 -top-10 bg-primary z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-5">
            {/* <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6">{t("products.title")}</h2> */}
            
            {/* Product Filter Banner */}
            <div className="mb-6 mx-auto text-center">
              <div className="inline-block border-2 border-accent rounded-lg px-10 py-3 text-xl font-bold">
                <NeonText>STONKS DEX 周边产品</NeonText>
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
          
          {/* Product Grid */}
          <ProductGrid category={selectedCategory === "all" ? undefined : selectedCategory} />
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
            <div 
              className="text-lg leading-relaxed space-y-4 text-gray-200"
              dangerouslySetInnerHTML={{ __html: t("about.content") }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
