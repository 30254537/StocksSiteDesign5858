import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import MobileMenu from "./MobileMenu";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import BackgroundMusic from "@/components/ui/background-music";

export default function Header() {
  const [location] = useLocation();
  const { openCart, totalItems } = useCart();
  const { language, toggleLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="font-orbitron text-2xl md:text-3xl font-bold text-white flex items-center">
                <span className="text-accent animate-glow">STONKS</span>
                <span className="ml-1">DEX</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
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
                  <Link href="#" className="font-medium hover:text-accent transition-colors duration-300">
                      {t("nav.about")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-medium hover:text-accent transition-colors duration-300">
                      {t("nav.community")}
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="relative mr-4 hidden md:block">
                <div className="flex items-center">
                  <span className="mr-2 text-sm">中文</span>
                  <Switch 
                    checked={language === "en"}
                    onCheckedChange={toggleLanguage}
                    className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                  />
                  <span className="ml-2 text-sm">EN</span>
                </div>
              </div>
              
              {/* Cart Button */}
              <Button
                variant="ghost"
                size="icon" 
                className="relative p-2 text-accent hover:text-white transition-colors duration-300"
                onClick={openCart}
              >
                <i className="fas fa-shopping-cart"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neonpink text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
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
