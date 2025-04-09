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
  const [directData, setDirectData] = useState<any>(null);

  // 添加直接fetch请求，用于调试
  useEffect(() => {
    if (!isNaN(productId) && productId > 0) {
      console.log(`开始直接获取产品ID: ${productId}的数据`);
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          console.log('直接获取的产品数据:', data);
          console.log('图片数组类型:', typeof data.imageUrls);
          console.log('是数组吗?', Array.isArray(data.imageUrls));
          if (data.imageUrls) {
            console.log('图片URLs:', data.imageUrls);
            console.log('图片数组长度:', data.imageUrls.length);
          }
          setDirectData(data);
        })
        .catch(err => console.error('获取产品数据错误:', err));
    }
  }, [productId]);

  const { data: product, isLoading, error } = useQuery<Product, Error>({
    queryKey: [`/api/products/${productId}`],
    enabled: !isNaN(productId)
  });
  
  // 使用useEffect来在产品数据加载后记录信息
  useEffect(() => {
    if (product) {
      console.log("加载的产品数据:", JSON.stringify(product, null, 2));
      console.log("产品ID:", product.id);
      console.log("产品名称:", product.name);
      console.log("产品图片URL:", product.imageUrl);
      console.log("产品图片URLs数组类型:", typeof product.imageUrls);
      console.log("是否是数组:", Array.isArray(product.imageUrls));
      console.log("产品图片URLs数组:", product.imageUrls);
      
      if (Array.isArray(product.imageUrls)) {
        console.log("图片数组长度:", product.imageUrls.length);
        product.imageUrls.forEach((url, index) => {
          console.log(`图片 ${index + 1}:`, url);
        });
      } else {
        console.log("警告: imageUrls 不是数组");
      }
    }
  }, [product]);
  
  // 重置图片索引，当产品加载完成时
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };
  
  const handlePrevImage = () => {
    // 使用直接获取的数据或产品数据
    const urls = Array.isArray(directData?.imageUrls) ? directData.imageUrls : 
                (Array.isArray(product?.imageUrls) ? product.imageUrls : []);
    
    if (urls.length <= 1) return;
    
    const maxIndex = urls.length - 1;
    setCurrentImageIndex(prev => (prev === 0 ? maxIndex : prev - 1));
  };
  
  const handleNextImage = () => {
    // 使用直接获取的数据或产品数据
    const urls = Array.isArray(directData?.imageUrls) ? directData.imageUrls : 
                (Array.isArray(product?.imageUrls) ? product.imageUrls : []);
    
    if (urls.length <= 1) return;
    
    const maxIndex = urls.length - 1;
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
          
          {/* 显示直接获取的数据 */}
          {directData && (
            <div className="text-left bg-gray-800 p-4 rounded my-4 overflow-auto max-h-96">
              <h3 className="text-xl text-accent font-bold mb-2">调试信息（直接获取的产品数据）</h3>
              <p className="mb-2">产品ID: {directData.id}</p>
              <p className="mb-2">产品名称: {directData.name}</p>
              <p className="mb-2">图片URL: {directData.imageUrl}</p>
              <p className="mb-2">图片URLs数组类型: {typeof directData.imageUrls}</p>
              <p className="mb-2">是否是数组: {Array.isArray(directData.imageUrls) ? "是" : "否"}</p>
              
              {Array.isArray(directData.imageUrls) && (
                <>
                  <p className="mb-2">图片数组长度: {directData.imageUrls.length}</p>
                  <div className="mb-4">
                    <h4 className="font-medium mb-1">图片列表:</h4>
                    <ul className="list-disc list-inside">
                      {directData.imageUrls.map((url: string, index: number) => (
                        <li key={index}>{url}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {directData.imageUrls.map((url: string, index: number) => (
                      <div key={index} className="border border-accent p-1 rounded">
                        <img src={url} alt={`图片${index + 1}`} className="w-full h-24 object-cover" />
                        <p className="text-xs text-center mt-1">图片 {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
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
      {/* 显示直接获取的数据，用于调试 */}
      {directData && (
        <div className="text-left bg-gray-800 p-4 rounded mb-8 overflow-auto max-h-96">
          <h3 className="text-xl text-accent font-bold mb-2">调试信息（直接获取的产品数据）</h3>
          <p className="mb-2">产品ID: {directData.id}</p>
          <p className="mb-2">产品名称: {directData.name}</p>
          <p className="mb-2">图片URL: {directData.imageUrl}</p>
          <p className="mb-2">图片URLs数组类型: {typeof directData.imageUrls}</p>
          <p className="mb-2">是否是数组: {Array.isArray(directData.imageUrls) ? "是" : "否"}</p>
          
          {Array.isArray(directData.imageUrls) && (
            <>
              <p className="mb-2">图片数组长度: {directData.imageUrls.length}</p>
              <div className="mb-4">
                <h4 className="font-medium mb-1">图片列表:</h4>
                <ul className="list-disc list-inside">
                  {directData.imageUrls.map((url: string, index: number) => (
                    <li key={index}>{url}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {directData.imageUrls.map((url: string, index: number) => (
                  <div key={index} className="border border-accent p-1 rounded">
                    <img src={url} alt={`图片${index + 1}`} className="w-full h-24 object-cover" />
                    <p className="text-xs text-center mt-1">图片 {index + 1}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-secondary border border-accent/30 rounded-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <div>
            <div className="relative aspect-square bg-primary/50 rounded-lg overflow-hidden group">
              {/* Main Image - 优先使用直接获取的数据 */}
              <img 
                src={Array.isArray(directData?.imageUrls) && directData.imageUrls.length > 0 
                  ? directData.imageUrls[currentImageIndex] 
                  : (Array.isArray(product.imageUrls) && product.imageUrls.length > 0 
                    ? product.imageUrls[currentImageIndex] 
                    : product.imageUrl)} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              
              {/* 强制显示调试信息 */}
              <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                图片: {currentImageIndex + 1} / {Array.isArray(product.imageUrls) ? product.imageUrls.length : 1}
              </div>
              
              {/* Image Navigation Arrows - 使用优化的检测逻辑 */}
              {(Array.isArray(directData?.imageUrls) && directData.imageUrls.length > 1) || 
               (Array.isArray(product?.imageUrls) && product.imageUrls.length > 1) ? (
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
                  
                  {/* Image Indicators - Always display */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {(Array.isArray(directData?.imageUrls) ? directData.imageUrls : 
                     (Array.isArray(product?.imageUrls) ? product.imageUrls : [])).map((_: string, index: number) => (
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
              ) : null}
            </div>
            
            {/* Thumbnail Gallery - 使用优化的检测逻辑 */}
            {((Array.isArray(directData?.imageUrls) && directData.imageUrls.length > 1) || 
              (Array.isArray(product?.imageUrls) && product.imageUrls.length > 1)) ? (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {(Array.isArray(directData?.imageUrls) ? directData.imageUrls : 
                 (Array.isArray(product?.imageUrls) ? product.imageUrls : [])).map((url: string, index: number) => (
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
                      alt={`${product?.name || 'Product'} view ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          
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
