import { useState } from "react";
import { Link } from "wouter";
import { formatCurrency, formatEth, formatPrice, formatUsdToStonks } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStonksPrice } from "@/contexts/StonksPriceContext";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { currentPrice } = useStonksPrice();
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
      className="product-card relative group w-full h-full" 
      data-category={product.category}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-secondary border border-accent/30 rounded-xl overflow-hidden transition-all duration-500 hover:glow-border h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-60 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
          />
          
          {/* Product Detail Link */}
          <div className={`absolute inset-0 bg-primary/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Link href={`/product/${product.id}`}>
              <Button 
                className="bg-accent text-primary font-medium hover:bg-white transition-colors duration-300"
              >
                {t("products.viewDetails")}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-orbitron text-lg font-medium mb-3 hover:text-accent transition-colors cursor-pointer line-clamp-2">
              {/* 始终优先使用产品的实际名称 */}
              {product.name || t(`product.name.${product.id}`)}
            </h3>
          </Link>
          <div className="flex justify-between items-center mt-auto">
            <div>
              <p className="text-gray-300 text-sm mb-1">{t("products.price")}</p>
              <div className="flex items-center">
                <span className="text-accent">{formatUsdToStonks(product.price, currentPrice)}</span>
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
