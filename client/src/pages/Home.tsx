import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/ui/product-grid";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { NLogo } from "@/components/ui/n-logo";

export default function Home() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Scroll to products section when URL has #products
  useEffect(() => {
    if (window.location.hash === '#products') {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
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
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-secondary to-darkblue z-0"></div>
        
        {/* Animated Circuit Lines */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L20,40 L40,20 L60,60 L80,40 L100,100" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
            <path d="M0,20 L20,60 L40,40 L60,80 L80,60 L100,80" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
            <path d="M0,40 L20,80 L40,60 L60,100 L80,80 L100,60" stroke="#00ffcc" strokeWidth="0.2" fill="none" />
          </svg>
        </div>
        
        {/* Hero Content - Two Columns */}
        <div className="container mx-auto px-4 relative z-10 flex flex-col-reverse md:flex-row items-center justify-between">
          {/* Left Column - Text */}
          <div className="md:w-1/2 text-left md:pr-12 mt-12 md:mt-0">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 font-orbitron leading-tight">
              <span className="block">{t("hero.title").split(',')[0]},</span> 
              <span className="text-accent animate-glow">{t("hero.title").split(',')[1]}</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-300">{t("hero.subtitle")}</p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#products" 
                className="inline-block cta-button bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-primary transition-all duration-300 font-medium py-3 px-8 rounded-lg text-lg"
              >
                {t("hero.cta")}
              </a>
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="inline-block bg-accent/10 text-white hover:bg-accent/20 transition-all duration-300 font-medium py-3 px-8 rounded-lg text-lg border-2 border-transparent"
              >
                {t("nav.community")}
              </a>
            </div>
          </div>
          
          {/* Right Column - N Logo */}
          <div className="md:w-1/2 flex justify-center items-center">
            <div className="w-48 h-48 md:w-80 md:h-80 relative animate-float">
              <NLogo size={300} className="drop-shadow-2xl" />
              <div className="absolute inset-0 bg-accent/10 rounded-full filter blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
        
        {/* Down Arrow */}
        <a href="#products" className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-accent animate-bounce">
          <i className="fas fa-chevron-down text-2xl"></i>
        </a>
      </section>
      
      {/* About Us Section */}
      <section id="about" className="py-20 relative z-20">
        {/* Light background contrast with dark theme */}
        <div className="absolute inset-0 glass-effect opacity-90 z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-8 text-accent">
              {t("about.title")}
            </h2>
            <div 
              className="text-lg leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: t("about.content") }}
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 relative z-20">
        {/* Background with slight gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-darkblue to-primary opacity-90 z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6">{t("products.title")}</h2>
            
            {/* Product Filter Tabs */}
            <div className="inline-flex flex-wrap justify-center bg-primary/80 rounded-lg p-1 border border-accent/30 mb-8 max-w-xl mx-auto">
              <Button 
                className={`py-2 px-4 rounded-md m-1 hover:bg-accent hover:text-primary transition-all duration-300 ${
                  selectedCategory === "all" 
                    ? "text-accent bg-secondary/80" 
                    : "text-gray-300"
                }`}
                variant="ghost"
                onClick={() => handleCategoryChange("all")}
              >
                {t("products.all")}
              </Button>
              <Button 
                className={`py-2 px-4 rounded-md m-1 hover:bg-accent hover:text-primary transition-all duration-300 ${
                  selectedCategory === "clothing" 
                    ? "text-accent bg-secondary/80" 
                    : "text-gray-300"
                }`}
                variant="ghost"
                onClick={() => handleCategoryChange("clothing")}
              >
                {t("products.clothing")}
              </Button>
              <Button 
                className={`py-2 px-4 rounded-md m-1 hover:bg-accent hover:text-primary transition-all duration-300 ${
                  selectedCategory === "digital" 
                    ? "text-accent bg-secondary/80" 
                    : "text-gray-300"
                }`}
                variant="ghost"
                onClick={() => handleCategoryChange("digital")}
              >
                {t("products.digital")}
              </Button>
              <Button 
                className={`py-2 px-4 rounded-md m-1 hover:bg-accent hover:text-primary transition-all duration-300 ${
                  selectedCategory === "accessories" 
                    ? "text-accent bg-secondary/80" 
                    : "text-gray-300"
                }`}
                variant="ghost"
                onClick={() => handleCategoryChange("accessories")}
              >
                {t("products.accessories")}
              </Button>
            </div>
          </div>
          
          {/* Product Grid */}
          <ProductGrid category={selectedCategory === "all" ? undefined : selectedCategory} />
        </div>
      </section>
    </div>
  );
}
