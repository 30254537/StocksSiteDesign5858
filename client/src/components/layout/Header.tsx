import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAudio } from "@/contexts/AudioContext";
import { useStonksPrice } from "@/contexts/StonksPriceContext";
import MobileMenu from "./MobileMenu";
import { Button } from "@/components/ui/button";
import MiniMusicPlayer from "@/components/ui/mini-music-player";
import { NeonText } from "@/components/ui/neon-text";
import { useIsMobile } from "@/hooks/use-mobile";
import { StonksPriceIndicator } from "@/components/ui/stonks-price-display";
import { formatCurrency } from "@/lib/utils";

// 简单的滚动到顶部函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth" // 使用平滑滚动
  });
};

// 简化的产品部分链接点击处理
const handleProductsClick = (e: React.MouseEvent) => {
  e.preventDefault();
  
  // 如果当前在首页，平滑滚动到产品部分
  if (window.location.pathname === "/") {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      // 获取header高度，确保滚动位置正确
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      
      // 计算正确的滚动位置，减去header高度
      const scrollPosition = productsSection.offsetTop - headerHeight - 5;
      
      // 使用平滑滚动
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  } else {
    // 如果不在首页，先设置标记，然后使用前端路由导航到首页
    sessionStorage.setItem('scrollToProducts', 'true');
    // 使用前端路由导航而不是刷新页面
    window.history.pushState({}, '', '/');
    // 触发页面内容重新加载，但不是整页刷新
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

// 音频控制已集成到迷你音乐播放器组件中

export default function Header() {
  const [location] = useLocation();
  const { openCart, totalItems } = useCart();
  const { t, toggleLanguage, language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled ? 'bg-primary/90' : 'glass-effect'
      } border-b border-accent/30`}>
        <div className="container mx-auto px-4">
          {/* STONKS 价格顶部条 */}
          <div className="hidden md:flex justify-start py-1 border-b border-accent/10">
            <StonksPriceIndicator />
          </div>
          
          <div className="flex items-center justify-between h-16 md:h-24">
            {/* LOGO区域 - 左侧 */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="font-orbitron text-xl md:text-2xl font-bold text-white flex items-center"
                onClick={scrollToTop}
              >
                <div className="flex items-center justify-center mr-3">
                  <img 
                    src="/images/stonks-characters-2.png" 
                    alt="STONKS Characters" 
                    className="w-10 h-10 rounded-full bg-black" 
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div className="flex flex-col md:flex-row items-center">
                  <NeonText className="font-bold">STONKS DEX SHOP</NeonText>
                  <span className="powered text-xs text-accent md:ml-2">Powered by $STONKS</span>
                </div>
              </Link>
            </div>
            
            {/* 主导航 - 中间 - 统一单行布局 */}
            <nav className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center">
                <div className="flex items-center justify-between mx-auto px-4 w-full max-w-4xl">
                  <Link 
                    href="/" 
                    className={`font-medium text-base transition-colors duration-300 whitespace-nowrap px-4 py-2 ${
                      location === "/" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {t("nav.home")}
                  </Link>
                  
                  <a 
                    href="/#products" 
                    className={`font-medium text-base transition-colors duration-300 whitespace-nowrap px-4 py-2 ${
                      location.includes("#products") ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={handleProductsClick}
                  >
                    {t("nav.products")}
                  </a>
                  
                  <Link 
                    href="/order-lookup" 
                    className={`font-medium text-base transition-colors duration-300 whitespace-nowrap px-4 py-2 ${
                      location === "/order-lookup" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {t("nav.orderLookup")}
                  </Link>
                  
                  <Link 
                    href="/telegram-messages" 
                    className={`font-medium text-base transition-colors duration-300 whitespace-nowrap px-4 py-2 ${
                      location === "/telegram-messages" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {language === 'zh' ? '加密快讯' : 'Crypto News'}
                  </Link>
                  
                  <Link 
                    href="/about" 
                    className={`font-medium text-base transition-colors duration-300 whitespace-nowrap px-4 py-2 ${
                      location === "/about" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {t("nav.about")}
                  </Link>
                  
                  <a 
                    href="https://t.me/STONKSOPEN" 
                    target="_blank"
                    className="font-medium text-base text-white hover:text-accent transition-colors duration-300 whitespace-nowrap px-4 py-2"
                  >
                    {t("nav.community")}
                  </a>
                </div>
              </div>
            </nav>
            
            {/* 功能控件 - 右侧 */}
            <div className="flex items-center">
              {/* 桌面端控件 */}
              <div className="hidden md:flex flex-col items-center space-y-2 pr-4">
                <div className="flex items-center space-x-5">
                  {/* 迷你音乐播放器 */}
                  <div>
                    <MiniMusicPlayer />
                  </div>
                  
                  {/* 购物车按钮（仅桌面端） */}
                  <button
                    className="relative flex items-center justify-center text-white hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer"
                    onClick={openCart}
                  >
                    <i className="fas fa-shopping-cart text-lg"></i>
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* 语言切换 - 右侧角落 */}
                <button
                  className="text-white hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer"
                  onClick={toggleLanguage}
                >
                  {language === 'en' ? 'EN' : 'CN'}
                </button>
              </div>
              
              {/* 移动菜单按钮（仅移动端） */}
              <button
                className="md:hidden text-white hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer p-2"
                onClick={toggleMobileMenu}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Floating Cart Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <Button
          className="w-14 h-14 rounded-full bg-accent text-primary shadow-lg flex items-center justify-center text-xl relative"
          onClick={openCart}
        >
          <i className="fas fa-shopping-cart"></i>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-neonpink text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>
    </>
  );
}
