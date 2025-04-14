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
      <div className="bg-primary/30 border border-accent/30 rounded-xl overflow-hidden transition-all duration-500 hover:border-accent/70 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
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
        
        {/* Product Info - 更简洁的产品信息显示 */}
        <div className="p-2 pb-3 flex-grow flex flex-col justify-between">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-orbitron text-lg font-bold text-center text-white hover:text-accent transition-colors cursor-pointer line-clamp-1">
              {/* 使用当前语言下的翻译名称，如果不存在则使用产品的原始名称 */}
              {language === 'zh' ? product.name : (t(`product.name.${product.id}`, product.name))}
            </h3>
          </Link>
          
          <div className="flex justify-center items-center mt-2">
            <div>
              <div className="flex items-center justify-center">
                <span className="text-accent font-medium">{formatUsdToStonks(product.price, currentPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
