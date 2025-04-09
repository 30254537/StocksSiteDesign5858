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
      
      {/* Hero Section - Simplified layout like reference */}
      <section className="hero relative h-auto min-h-[380px] pt-0 pb-4 flex flex-col z-10 overflow-hidden">
        {/* Dark blue background */}
        <div className="absolute inset-0 bg-[#0a1528] z-0"></div>
        
        {/* Hero Content - Center layout */}
        <div className="container mx-auto px-4 relative z-10 mt-0 flex flex-col items-center justify-center h-full">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
              Gear Up with <span className="text-accent">$STONKS</span>
            </h1>
            <p className="text-lg mb-8 text-gray-300">用 $STONKS 代币购买独家周边</p>
            <div className="flex justify-center">
              <a 
                href="#products" 
                className="inline-block bg-accent hover:bg-accent/90 text-primary font-medium py-3 px-8 rounded-md text-lg"
                onClick={(e) => {
                  e.preventDefault();
                  const productsSection = document.getElementById('products');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'instant' });
                  }
                }}
              >
                用 $STONKS 购物
              </a>
            </div>
          </div>
        </div>
        
        {/* Down Arrow - Hidden since products are already visible */}
        <a 
          href="#products" 
          className="hidden absolute bottom-8 left-1/2 transform -translate-x-1/2 text-accent animate-bounce"
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
      <section id="products" className="pt-0 mt-0 -translate-y-80 pb-20 relative z-20">
        {/* White background */}
        <div className="absolute inset-0 -top-10 bg-white z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 pt-10">
            {/* <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6">{t("products.title")}</h2> */}
            
            {/* Product Filter Banner */}
            <div className="mb-6 mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                STONKS DEX 周边产品
              </h2>
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
