import { useState } from "react";
import { Link } from "wouter";
import { formatCurrency, formatEth, formatPrice } from "@/lib/utils";
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
      <div className="bg-white rounded-lg overflow-hidden shadow-md transition-all">
        {/* Product Image */}
        <Link href={`/product/${product.id}`}>
          <div className="relative h-52 overflow-hidden">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover object-center" 
            />
          </div>
        </Link>
        
        {/* Product Info */}
        <div className="p-4">
          <Link href={`/product/${product.id}`}>
            <h3 className="text-lg font-medium mb-2 text-[#0a1528] hover:text-accent transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <div className="text-[#0a1528] font-medium flex items-center">
                <span className="inline-block text-accent mr-1">⊙</span>
                <span>{product.ethPrice} $STONKS</span>
              </div>
            </div>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-primary font-medium py-2 rounded-md transition-colors"
              onClick={handleAddToCart}
            >
              订 加购物车
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
