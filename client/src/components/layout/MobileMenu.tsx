import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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
              <Link href="/">
                <a className="text-xl font-orbitron hover:text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.home")}
                </a>
              </Link>
            </li>
            <li>
              <Link href="/#products">
                <a className="text-xl font-orbitron text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.products")}
                </a>
              </Link>
            </li>
            <li>
              <Link href="#">
                <a className="text-xl font-orbitron hover:text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.about")}
                </a>
              </Link>
            </li>
            <li>
              <Link href="#">
                <a className="text-xl font-orbitron hover:text-accent transition-colors duration-300" onClick={onClose}>
                  {t("nav.community")}
                </a>
              </Link>
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
          </ul>
        </nav>
      </div>
    </div>
  );
}
