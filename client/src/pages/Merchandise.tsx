import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/ui/product-grid";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonText } from "@/components/ui/neon-text";
import { Helmet } from "react-helmet";
import { Sparkles } from "lucide-react";
import { Product } from "@shared/schema";

export default function Merchandise() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 获取产品数据
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // 不再过滤产品，直接显示所有产品
  const filteredProducts = products;

  // 将内部类别ID翻译为用户友好的显示名称
  const getCategoryDisplayName = (categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      all: t("products.all", "All Items"),
      clothing: t("products.clothing", "Clothing"),
      accessories: t("products.accessories", "Accessories"),
      digital: t("products.digital", "Digital"),
      collectibles: t("products.collectibles", "Collectibles"),
      electronics: t("products.electronics", "Electronics"),
      shoes: t("products.shoes", "Shoes")
    };
    
    return categoryNames[categoryId] || categoryId;
  };

  return (
    <>
      <Helmet>
        <title>{t("merchandise.pageTitle", "STONKS DEX SHOP - Merchandise")}</title>
        <meta name="description" content={t("merchandise.metaDescription", "Explore our exclusive crypto-themed merchandise. From apparel to collectibles, show your support for STONKS DEX.")} />
      </Helmet>
      
      <section className="container mx-auto px-4 pt-32 pb-10">
        <div className="flex flex-col items-center mb-12">
          <div className="inline-block relative px-12 py-5 rounded-lg border-2 border-accent/60 bg-primary/20 shadow-glow-sm">
            <NeonText 
              as="h1" 
              text="STONKS DEX 周边产品" 
              className="text-2xl md:text-3xl font-orbitron font-bold text-center" 
              color="accent"
              glowIntensity="medium"
            />
          </div>
          
          {/* 移除了分类筛选按钮 */}
        </div>

        {/* Products Display */}
        <ProductGrid products={filteredProducts} />
      </section>
    </>
  );
}