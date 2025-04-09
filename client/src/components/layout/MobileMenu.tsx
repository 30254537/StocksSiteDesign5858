import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import BackgroundMusic from "@/components/ui/background-music";
import { Switch } from "@/components/ui/switch";

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
            <span className="text-accent font-bold">STONKS DEX SHOP</span>
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
        
        <nav className="flex-grow flex flex-col items-center pt-12">
          {/* Navigation Links */}
          <ul className="space-y-6 text-center w-full">
            <li>
              <Link 
                href="/" 
                className="text-xl hover:text-accent transition-colors duration-300 block py-2" 
                onClick={onClose}
              >
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link 
                href="/#products" 
                className="text-xl text-accent transition-colors duration-300 block py-2 border-y border-accent/20 bg-accent/5" 
                onClick={onClose}
              >
                {t("nav.products")}
              </Link>
            </li>
            <li>
              <Link 
                href="/about" 
                className="text-xl hover:text-accent transition-colors duration-300 block py-2" 
                onClick={onClose}
              >
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank"
                className="text-xl hover:text-accent transition-colors duration-300 block py-2"
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
              
              {/* Audio Control */}
              <BackgroundMusic />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
