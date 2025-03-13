import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import BackgroundMusic from "@/components/ui/background-music";

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
    <div className="fixed inset-0 glass-effect z-50">
      <div className="flex flex-col h-full">
        <div className="flex justify-end p-4">
          <Button 
            variant="ghost"
            className="text-white" 
            onClick={onClose}
          >
            <i className="fas fa-times text-2xl"></i>
          </Button>
        </div>
        <nav className="flex-grow flex flex-col items-center justify-center">
          <ul className="space-y-8 text-center">
            <li>
              <Link href="/" className="text-xl font-orbitron hover:text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link href="/#products" className="text-xl font-orbitron text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.products")}
              </Link>
            </li>
            <li>
              <Link href="#" className="text-xl font-orbitron hover:text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.about")}
              </Link>
            </li>
            <li>
              <a 
                href="https://t.me/STONKSOPEN" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xl font-orbitron hover:text-accent transition-colors duration-300 flex items-center justify-center"
                onClick={onClose}
              >
                {t("nav.community")}
                <i className="fas fa-external-link-alt text-xs ml-1"></i>
              </a>
            </li>
            <li>
              <div className="flex items-center justify-center mt-6">
                <span className="mr-2">中文</span>
                <Switch 
                  checked={language === "en"}
                  onCheckedChange={toggleLanguage}
                  className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <span className="ml-2">EN</span>
              </div>
            </li>
            <li>
              <div className="flex items-center justify-center mt-4">
                <BackgroundMusic />
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
