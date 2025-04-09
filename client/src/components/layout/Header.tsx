import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MobileMenu from "./MobileMenu";
import { Button } from "@/components/ui/button";
import { MusicPlayer } from "@/components/ui/music-player";

import { useIsMobile } from "@/hooks/use-mobile";

// 跳转到页面顶部的函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "instant" // 使用"instant"而不是"smooth"以实现立即跳转
  });
};

// 处理产品部分链接的点击
const handleProductsClick = (e: React.MouseEvent) => {
  e.preventDefault();
  
  // 如果当前在首页，滚动到产品部分
  if (window.location.pathname === "/") {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'instant' });
    }
  } else {
    // 如果不在首页，先导航到首页，然后设置一个标记以便首页加载后滚动到产品部分
    window.location.href = "/#products";
  }
};

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
          <div className="flex items-center h-16 md:h-20">
            {/* Left side - Brand text only */}
            <div className="flex items-center mr-8">
              {/* Brand text */}
              <Link 
                href="/" 
                className="font-orbitron text-xl md:text-2xl font-bold text-white flex items-center flex-col md:flex-row"
                onClick={scrollToTop}
              >
                <span className="bright-white flex items-center">
                  <svg 
                    width="30" 
                    height="30" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 text-accent"
                    style={{ verticalAlign: 'middle' }}
                  >
                    <path 
                      d="M5 17L10 12L13 15L19 9M19 9H14M19 9V14" 
                      stroke="#00FFCC" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  STONKS DEX SHOP
                </span>
                <span className="powered text-xs text-accent md:ml-2">Powered by $STONKS</span>
              </Link>
            </div>
            
            {/* Navigation - Now placed to the right of the brand */}
            <nav className="hidden md:flex flex-grow items-center justify-center">
              <ul className="flex items-center space-x-5 px-3">
                <li>
                  <Link 
                    href="/" 
                    className={`font-medium text-base transition-colors duration-300 px-2 py-1 whitespace-nowrap ${
                      location === "/" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {t("nav.home")}
                  </Link>
                </li>
                <li>
                  <a 
                    href="/#products" 
                    className={`font-medium text-base transition-colors duration-300 px-2 py-1 whitespace-nowrap ${
                      location.includes("#products") ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={handleProductsClick}
                  >
                    {t("nav.products")}
                  </a>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className={`font-medium text-base transition-colors duration-300 px-2 py-1 whitespace-nowrap ${
                      location === "/about" ? "text-accent" : "text-white hover:text-accent"
                    }`}
                    onClick={scrollToTop}
                  >
                    {t("nav.about")}
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://t.me/STONKSOPEN" 
                    target="_blank"
                    className="font-medium text-base text-white hover:text-accent transition-colors duration-300 px-2 py-1 whitespace-nowrap"
                  >
                    {t("nav.community")}
                  </a>
                </li>
              </ul>
            </nav>
            
            {/* Right side - Controls - Now pushed to the far right */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Music Player */}
              <div className="hidden md:block">
                <MusicPlayer />
              </div>
              
              {/* Language Switcher */}
              <button
                className="text-white font-medium hover:text-accent py-1 px-2 transition-duration-300 bg-transparent border-none cursor-pointer"
                onClick={toggleLanguage}
              >
                {language === 'en' ? 'EN' : '中文'}
              </button>
              
              {/* Cart Button (desktop only) */}
              <button
                className="relative hidden md:flex py-1 px-2 text-white hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer"
                onClick={openCart}
              >
                <i className="fas fa-shopping-cart text-lg"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              
              {/* Mobile Menu Button */}
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
