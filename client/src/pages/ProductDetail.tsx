import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, formatEth } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || '0');
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !isNaN(productId)
  });
  
  // 重置图片索引，当产品加载完成时
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };
  
  const handlePrevImage = () => {
    if (!product || !product.imageUrls || product.imageUrls.length === 0) return;
    
    const maxIndex = product.imageUrls.length - 1;
    setCurrentImageIndex(prev => (prev === 0 ? maxIndex : prev - 1));
  };
  
  const handleNextImage = () => {
    if (!product || !product.imageUrls || product.imageUrls.length === 0) return;
    
    const maxIndex = product.imageUrls.length - 1;
    setCurrentImageIndex(prev => (prev === maxIndex ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity, product.category === "clothing" ? selectedSize : undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto bg-secondary border border-accent/30 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-primary/50 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-10 bg-primary/50 rounded w-3/4 mb-6 animate-pulse"></div>
              <div className="h-6 bg-primary/50 rounded w-1/2 mb-6 animate-pulse"></div>
              <div className="h-24 bg-primary/50 rounded w-full mb-6 animate-pulse"></div>
              <div className="h-10 bg-primary/50 rounded w-full mt-8 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto bg-secondary border border-accent/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-orbitron font-bold mb-4">Product Not Found</h2>
          <p className="mb-6">The product you are looking for does not exist or has been removed.</p>
          <Link href="/#products">
            <Button className="bg-accent text-primary hover:bg-white transition-colors">
              Return to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-6xl mx-auto bg-secondary border border-accent/30 rounded-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <div className="relative aspect-square bg-primary/50 rounded-lg overflow-hidden">
            {/* Main Image */}
            <img 
              src={product.imageUrls && product.imageUrls.length > 0 
                ? product.imageUrls[currentImageIndex] 
                : product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
            
            {/* Image Navigation Arrows - Only show if there are multiple images */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                  {product.imageUrls.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentImageIndex === index 
                          ? "bg-accent w-4" 
                          : "bg-white/60 hover:bg-white"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail Gallery - Show if there are multiple images */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="hidden md:flex gap-2 mt-4 overflow-x-auto pb-2 -mx-2 px-2">
              {product.imageUrls.map((url, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                    currentImageIndex === index 
                      ? "border-accent" 
                      : "border-transparent hover:border-gray-400"
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`${product.name} view ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-orbitron font-bold mb-4">{product.name}</h1>
            
            {/* Price */}
            <div className="mb-6">
              <p className="text-gray-400 mb-1">{t("products.price")}</p>
              <div className="flex items-center">
                <span className="text-2xl font-medium mr-3">{formatCurrency(product.price)}</span>
                <span className="text-accent">{formatEth(product.ethPrice)}</span>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-400 mb-1">{t("product.description")}</p>
              <p className="text-gray-300">{product.description}</p>
            </div>
            
            {/* Stock Info */}
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/30 rounded-md text-accent text-sm">
                <i className="fas fa-check-circle mr-1"></i>
                {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
              </div>
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
              className="w-full bg-accent text-primary py-6 rounded-lg font-medium hover:bg-white transition-colors duration-300 mb-4"
              onClick={handleAddToCart}
              size="lg"
            >
              {t("product.addToCart")}
            </Button>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-sm mt-8">
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
    </div>
  );
}
