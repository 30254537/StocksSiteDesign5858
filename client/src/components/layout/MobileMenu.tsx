import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MusicPlayer } from "@/components/ui/music-player";

// 跳转到页面顶部的函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "instant" // 使用"instant"而不是"smooth"以实现立即跳转
  });
};

// 处理产品部分链接的点击
const handleProductsClick = (e: React.MouseEvent, onClose: () => void) => {
  e.preventDefault();
  onClose(); // 关闭移动菜单
  
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

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { language, toggleLanguage, t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-primary/95 z-50">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-accent/30">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold flex items-center justify-center">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1"
              >
                <path 
                  d="M5 17L10 12L13 15L19 9M19 9H14M19 9V14" 
                  stroke="#00FFCC" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              STONKS DEX SHOP
            </span>
          </div>
          
          {/* Close Button */}
          <Button 
            variant="ghost"
            className="text-white" 
            onClick={onClose}
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>
        
        <nav className="flex-grow flex flex-col items-center pt-10">
          {/* Navigation Links */}
          <ul className="space-y-5 text-center w-full">
            <li>
              <Link 
                href="/" 
                className="text-xl hover:text-accent transition-colors duration-300 block py-3" 
                onClick={() => {
                  scrollToTop();
                  onClose();
                }}
              >
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <a 
                href="/#products" 
                className="text-xl transition-colors duration-300 block py-3" 
                onClick={(e) => handleProductsClick(e, onClose)}
              >
                {t("nav.products")}
              </a>
            </li>
            <li>
              <Link 
                href="/about" 
                className="text-xl hover:text-accent transition-colors duration-300 block py-3" 
                onClick={() => {
                  scrollToTop();
                  onClose();
                }}
              >
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="text-xl hover:text-accent transition-colors duration-300 block py-3"
                onClick={onClose}
              >
                {t("nav.community")}
              </a>
            </li>
          </ul>
          
          {/* Controls */}
          <div className="mt-auto p-6 w-full border-t border-accent/30">
            <div className="flex justify-between items-center">
              {/* Language Toggle */}
              <div className="flex items-center gap-2">
                <span className={language === 'zh' ? 'text-accent font-bold' : 'text-white'}>中文</span>
                <Switch 
                  checked={language === "en"}
                  onCheckedChange={toggleLanguage}
                  className="data-[state=checked]:bg-accent"
                />
                <span className={language === 'en' ? 'text-accent font-bold' : 'text-white'}>EN</span>
              </div>
              
              {/* Music Player */}
              <div className="flex items-center">
                <MusicPlayer />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
