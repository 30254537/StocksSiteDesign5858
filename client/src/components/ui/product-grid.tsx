import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ui/product-card";
import { QuickViewModal } from "@/components/ui/quick-view-modal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@shared/schema";

interface ProductGridProps {
  category?: string;
  products?: Product[];
}

export function ProductGrid({ category = "all", products: externalProducts }: ProductGridProps) {
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // 如果外部传入了products数组，则使用它，否则从API获取
  const { data: fetchedProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: category === "all" ? ['/api/products'] : [`/api/products/category/${category}`],
    enabled: !externalProducts // 只有在没有外部提供的products时才触发查询
  });
  
  // 使用外部传入的products或者从API获取的products
  const products = externalProducts || fetchedProducts;

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
  };

  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 pt-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-secondary border border-accent/30 rounded-xl animate-pulse">
              <div className="h-64 bg-primary/50 rounded-t-xl"></div>
              <div className="p-4">
                <div className="h-6 bg-primary/50 rounded w-3/4 mb-2"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="h-4 bg-primary/50 rounded w-16 mb-1"></div>
                    <div className="h-5 bg-primary/50 rounded w-24"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/50"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 pt-4">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      )}

      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={isQuickViewOpen}
          onClose={closeQuickView}
        />
      )}
    </>
  );
}
