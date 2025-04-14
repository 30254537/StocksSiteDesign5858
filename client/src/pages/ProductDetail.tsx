import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStonksPrice } from "@/contexts/StonksPriceContext";
import { useProductTranslations } from "@/hooks/use-product-translations";
import { formatCurrency, formatEth, formatPrice, formatUsdToStonks } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn, ArrowLeft } from "lucide-react";
import { Product } from "@shared/schema";
import { ImageZoomModal } from "@/components/ui/image-zoom-modal";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || '0');
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { currentPrice } = useStonksPrice();
  const { getTranslatedName, getTranslatedDescription, getTranslatedStockStatus } = useProductTranslations();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  const { data: product, isLoading, error } = useQuery<Product, Error>({
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
    if (!product || !Array.isArray(product.imageUrls) || product.imageUrls.length <= 1) return;
    
    const maxIndex = product.imageUrls.length - 1;
    setCurrentImageIndex(prev => (prev === 0 ? maxIndex : prev - 1));
  };
  
  const handleNextImage = () => {
    if (!product || !Array.isArray(product.imageUrls) || product.imageUrls.length <= 1) return;
    
    const maxIndex = product.imageUrls.length - 1;
    setCurrentImageIndex(prev => (prev === maxIndex ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    if (product) {
      // 根据产品是否有尺码属性决定是否传递尺码信息
      addToCart(product.id, quantity, product.hasSizes === 1 ? selectedSize : undefined);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-6">
          {/* Product Image Gallery */}
          <div className="flex flex-col justify-center">
            {/* Back to Products Button */}
            <Link href="/merchandise" className="self-start mb-2">
              <Button variant="ghost" size="sm" className="flex items-center text-accent hover:text-white hover:bg-accent/20 transition-all">
                <ArrowLeft size={18} className="mr-1" />
                <span>{t("product.backToProducts", "Back to Products")}</span>
              </Button>
            </Link>
            
            <div className="relative aspect-square bg-primary/50 rounded-lg overflow-hidden group mt-2 shadow-xl border border-accent/20">
              {/* Main Image - Clickable for zoom */}
              <div
                onClick={() => setZoomModalOpen(true)}
                className="w-full h-full cursor-zoom-in"
              >
                <img 
                  src={Array.isArray(product.imageUrls) && product.imageUrls.length > 0 
                    ? product.imageUrls[currentImageIndex] 
                    : product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                  style={{ 
                    imageRendering: 'auto',
                    objectFit: 'contain',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                  }}
                  loading="eager"
                />
                {/* Zoom indicator */}
                <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-accent/90 text-white p-2 rounded-full opacity-70 hover:opacity-100 shadow-lg transition-all backdrop-blur-sm">
                  <ZoomIn size={20} />
                </div>
              </div>
              
              {/* Image Navigation Arrows */}
              {Array.isArray(product.imageUrls) && product.imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-accent/90 text-white p-3 rounded-full transition-colors opacity-90 shadow-lg"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-accent/90 text-white p-3 rounded-full transition-colors opacity-90 shadow-lg"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {product.imageUrls.map((_: string, index: number) => (
                      <button 
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all shadow-md ${
                          currentImageIndex === index 
                            ? "bg-accent scale-125" 
                            : "bg-white/80 hover:bg-white"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {Array.isArray(product.imageUrls) && product.imageUrls.length > 1 && (
              <div className="flex gap-3 mt-6 overflow-x-auto pb-3 px-1">
                {product.imageUrls.map((url: string, index: number) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all shadow-lg transform hover:scale-105 ${
                      currentImageIndex === index 
                        ? "border-2 border-accent ring-2 ring-accent/30" 
                        : "border border-gray-600/50 hover:border-accent/50"
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`${product.name} view ${index + 1}`} 
                      className="w-full h-full object-cover"
                      style={{ 
                        imageRendering: 'auto',
                        objectFit: 'cover'
                      }}
                      loading="eager"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col justify-center md:h-full py-8 mt-8">
            <h1 className="text-3xl font-orbitron font-bold mb-4">
              {/* 使用专用翻译Hook获取产品名称的翻译 */}
              {getTranslatedName(product)}
            </h1>
            
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
              <p className="text-gray-300">
                {/* 使用专用翻译Hook获取产品描述的翻译 */}
                {getTranslatedDescription(product)}
              </p>
            </div>
            
            {/* Stock Info */}
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/30 rounded-md text-accent text-sm">
                <i className="fas fa-check-circle mr-1"></i>
                {/* 使用专用翻译Hook获取库存状态的翻译 */}
                {getTranslatedStockStatus(product.stock)}
              </div>
            </div>
            
            {/* Size Selector - Show based on product hasSizes flag */}
            {product.hasSizes === 1 && (
              <div className="mb-6">
                <p className="text-gray-400 mb-2">{t("product.size")}</p>
                <div className="flex space-x-3">
                  {/* Display different size options based on product category */}
                  {product.category === "shoes" ? 
                    // Shoe size options
                    ["38", "39", "40", "41", "42", "43", "44", "45"].map((size) => (
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
                    ))
                    : 
                    // Clothing size options
                    ["S", "M", "L", "XL"].map((size) => (
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
                    ))
                  }
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
      
      {/* Image Zoom Modal */}
      {product && (
        <ImageZoomModal
          isOpen={zoomModalOpen}
          onClose={() => setZoomModalOpen(false)}
          images={Array.isArray(product.imageUrls) && product.imageUrls.length > 0 
            ? product.imageUrls 
            : [product.imageUrl]}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          altText={product.name}
        />
      )}
    </div>
  );
}