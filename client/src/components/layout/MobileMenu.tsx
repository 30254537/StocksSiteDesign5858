import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import MusicPlayer from "@/components/ui/music-player";
import { NeonText } from "@/components/ui/neon-text";

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
  
  // 如果当前在首页，平滑滚动到产品部分
  if (window.location.pathname === "/") {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      // 使用更平滑的滚动
      window.scrollTo({
        top: productsSection.offsetTop - 100, // 留出一些顶部空间
        behavior: 'smooth'
      });
    }
  } else {
    // 如果不在首页，使用前端路由而不是重新加载页面
    sessionStorage.setItem('scrollToProducts', 'true');
    window.history.pushState({}, '', '/');
    // 触发路由变化事件以使前端路由更新
    window.dispatchEvent(new PopStateEvent('popstate'));
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
          <div className="flex flex-col">
            <span className="font-bold flex items-center justify-start">
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
                  d="M4 17L10 11L13 14L20 6M20 6H15M20 6V11" 
                  stroke="#00FFCC" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <NeonText className="font-bold">STONKS DEX SHOP</NeonText>
            </span>
            <span className="text-accent text-xs ml-7">Powered by $STONKS</span>
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
              
              {/* Music Player - 使用内联音乐控制而不是完整播放器 */}
              <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                <MusicPlayer minimal={true} />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
