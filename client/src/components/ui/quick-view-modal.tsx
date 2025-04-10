import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStonksPrice } from "@/contexts/StonksPriceContext";
import { formatCurrency, formatEth, formatPrice, formatUsdToStonks } from "@/lib/utils";
import { Product } from "@shared/schema";

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { currentPrice } = useStonksPrice();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity, selectedSize);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-secondary border border-accent/30 rounded-xl p-0 w-[95vw] max-w-4xl"
        aria-describedby="product-description"
      >
        <div className="p-6 relative">
          <DialogClose className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </DialogClose>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-primary/50 rounded-lg overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Product Details */}
            <div>
              <DialogTitle className="text-2xl font-orbitron font-bold mb-4">
                {t(`product.name.${product.id}`) !== `product.name.${product.id}` 
                  ? t(`product.name.${product.id}`) 
                  : product.name}
              </DialogTitle>
              
              {/* Price */}
              <div className="mb-6">
                <p className="text-gray-400 mb-1">{t("products.price")}</p>
                <div className="flex items-center">
                  <span className="text-2xl font-medium text-accent">{formatUsdToStonks(product.price, currentPrice)}</span>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-400 mb-1">{t("product.description")}</p>
                <p id="product-description" className="text-gray-300">{product.description}</p>
              </div>
              
              {/* Size Selector - Only show for clothing */}
              {product.category === "clothing" && (
                <div className="mb-6">
                  <p className="text-gray-400 mb-2">{t("product.size")}</p>
                  <div className="flex space-x-3">
                    {["S", "M", "L", "XL"].map((size) => (
                      <button 
                        key={size}
                        className={`w-10 h-10 rounded-md border flex items-center justify-center transition-all duration-300 ${
                          selectedSize === size 
                            ? "border-accent bg-accent/10 text-accent" 
                            : "border-gray-700 hover:border-accent hover:text-accent"
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity */}
              <div className="mb-8">
                <p className="text-gray-400 mb-2">{t("product.quantity")}</p>
                <div className="flex items-center">
                  <button 
                    className="w-10 h-10 rounded-l-md border border-gray-700 flex items-center justify-center hover:text-accent transition-colors duration-300"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <div className="w-14 h-10 border-t border-b border-gray-700 flex items-center justify-center">
                    {quantity}
                  </div>
                  <button 
                    className="w-10 h-10 rounded-r-md border border-gray-700 flex items-center justify-center hover:text-accent transition-colors duration-300"
                    onClick={() => handleQuantityChange(1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <Button 
                className="w-full bg-accent text-primary py-3 rounded-lg font-medium hover:bg-white transition-colors duration-300 mb-4"
                onClick={handleAddToCart}
              >
                {t("product.addToCart")}
              </Button>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <i className="fas fa-shipping-fast text-accent mr-2"></i>
                  <span>{t("product.globalShipping")}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-exchange-alt text-accent mr-2"></i>
                  <span>{t("product.returnPolicy")}</span>
                </div>
                <div className="flex items-center">
                  <i className="fab fa-ethereum text-accent mr-2"></i>
                  <span>{t("product.cryptoPayment")}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-shield-alt text-accent mr-2"></i>
                  <span>{t("product.secureTransaction")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
