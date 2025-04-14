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

  // 过滤产品
  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((product: Product) => product.category === selectedCategory);

  // 获取所有可用的产品类别
  const categories = ["all", ...Array.from(new Set(products.map((product: Product) => product.category)))];

  // 将内部类别ID翻译为用户友好的显示名称
  const getCategoryDisplayName = (categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      all: t("products.allCategories", "All Items"),
      clothing: t("products.clothingCategory", "Clothing"),
      accessories: t("products.accessoriesCategory", "Accessories"),
      collectibles: t("products.collectiblesCategory", "Collectibles"),
      electronics: t("products.electronicsCategory", "Electronics"),
      shoes: t("products.shoesCategory", "Shoes")
    };
    
    return categoryNames[categoryId] || categoryId;
  };

  return (
    <>
      <Helmet>
        <title>{t("merchandise.pageTitle", "STONKS DEX SHOP - Merchandise")}</title>
        <meta name="description" content={t("merchandise.metaDescription", "Explore our exclusive crypto-themed merchandise. From apparel to collectibles, show your support for STONKS DEX.")} />
      </Helmet>
      
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-10">
          {/* 标题改为带霓虹边框的容器 */}
          <div className="border-2 border-accent rounded-lg px-8 py-3 mb-8 glow-border-accent">
            <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-white">
              STONKS DEX {t("merchandise.title", "周边产品")}
            </h1>
          </div>
          
          {/* 移除原来的描述文字 */}
          
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                  selectedCategory === category
                    ? "bg-accent text-primary shadow-glow-sm"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Display */}
        <ProductGrid products={filteredProducts} />
      </section>
    </>
  );
}