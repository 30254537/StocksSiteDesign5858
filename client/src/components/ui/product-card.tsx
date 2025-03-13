import { useState } from "react";
import { Link } from "wouter";
import { formatCurrency, formatEth } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  return (
    <div 
      className="product-card relative group" 
      data-category={product.category}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-secondary border border-accent/30 rounded-xl overflow-hidden transition-all duration-500 hover:glow-border">
        {/* Product Image */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
          />
          
          {/* Quick View Button */}
          <div className={`absolute inset-0 bg-primary/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button 
              className="bg-accent text-primary font-medium hover:bg-white transition-colors duration-300"
              onClick={handleQuickView}
            >
              {t("products.quickView")}
            </Button>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-orbitron text-lg font-medium mb-2 hover:text-accent transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-300 text-sm mb-1">{t("products.price")}</p>
              <div className="flex items-center">
                <span className="text-white mr-2">{formatCurrency(product.price)}</span>
                <span className="text-accent text-sm crypto-font">/ {formatEth(product.ethPrice)}</span>
              </div>
            </div>
            <Button 
              className="w-10 h-10 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center text-accent hover:text-primary transition-colors duration-300"
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <i className="fas fa-plus"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
