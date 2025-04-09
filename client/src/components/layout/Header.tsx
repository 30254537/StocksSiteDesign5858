import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MobileMenu from "./MobileMenu";
import { Button } from "@/components/ui/button";
import BackgroundMusic from "@/components/ui/background-music";
import { useIsMobile } from "@/hooks/use-mobile";

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
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Left side - Brand text only */}
            <div className="flex items-center gap-4">
              {/* Brand text */}
              <Link href="/" className="font-orbitron text-xl md:text-2xl font-bold text-white flex items-center flex-col md:flex-row">
                <span className="text-accent animate-glow">STONKS DEX SHOP</span>
                <span className="powered text-xs text-gray-400 md:ml-2">Powered by $STONKS</span>
              </Link>
            </div>
            
            {/* Center - Navigation */}
            <nav className="hidden md:flex items-center justify-center">
              <ul className="flex space-x-10 bg-primary/50 px-6 py-2 rounded-full">
                <li>
                  <Link href="/" className={`font-medium transition-colors duration-300 ${
                      location === "/" ? "text-accent" : "hover:text-accent"
                    }`}>
                      {t("nav.home")}
                  </Link>
                </li>
                <li>
                  <Link href="/#products" className={`font-medium transition-colors duration-300 ${
                      location.includes("#products") ? "text-accent" : "hover:text-accent"
                    }`}>
                      {t("nav.products")}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={`font-medium transition-colors duration-300 ${
                      location === "/about" ? "text-accent" : "hover:text-accent"
                    }`}>
                      {t("nav.about")}
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://t.me/STONKSOPEN" 
                    target="_blank"
                    className="font-medium hover:text-accent transition-colors duration-300"
                  >
                    {t("nav.community")}
                  </a>
                </li>
              </ul>
            </nav>
            
            {/* Right side - Controls */}
            <div className="flex items-center gap-4">

              
              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-accent transition-duration-300"
                onClick={toggleLanguage}
              >
                {language === 'en' ? '中文' : 'EN'}
              </Button>
              
              {/* Audio Control (desktop only) */}
              <div className="hidden md:block">
                <BackgroundMusic />
              </div>
              
              {/* Cart Button (desktop only) */}
              <Button
                variant="ghost"
                size="icon" 
                className="relative hidden md:flex p-2 text-white hover:text-accent transition-colors duration-300"
                onClick={openCart}
              >
                <i className="fas fa-shopping-cart"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-primary text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white"
                onClick={toggleMobileMenu}
              >
                <i className="fas fa-bars text-xl"></i>
              </Button>
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
