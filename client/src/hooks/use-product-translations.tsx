import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@shared/schema';

/**
 * 专门用于处理产品翻译的Hook，集中处理产品相关的所有翻译逻辑
 * 这样当后台添加新产品时，只需要在translations.ts中添加对应的翻译键值对
 */
export function useProductTranslations() {
  const { t, language } = useLanguage();

  /**
   * 获取产品名称的翻译
   * @param product 产品对象
   * @returns 根据当前语言返回翻译后的产品名称
   */
  const getTranslatedName = (product: Product): string => {
    if (language === 'zh') return product.name;
    return t(`product.name.${product.id}`, product.name);
  };

  /**
   * 获取产品描述的翻译
   * @param product 产品对象
   * @returns 根据当前语言返回翻译后的产品描述
   */
  const getTranslatedDescription = (product: Product): string => {
    if (language === 'zh') return product.description;
    return t(`product.description.${product.id}`, product.description);
  };

  /**
   * 获取库存状态的翻译
   * @param stock 库存数量
   * @returns 根据当前语言返回翻译后的库存状态
   */
  const getTranslatedStockStatus = (stock: number): string => {
    if (stock > 10) {
      return language === 'zh' ? '有货' : t('product.inStock', 'In Stock');
    } else {
      return language === 'zh' 
        ? `仅剩 ${stock} 件` 
        : t('product.onlyLeft', `Only ${stock} left`);
    }
  };

  /**
   * 获取产品尺寸的翻译
   * @param size 尺寸值
   * @returns 根据当前语言返回翻译后的尺寸文本
   */
  const getTranslatedSize = (size: string): string => {
    return size; // 尺寸通常是标准符号，不需要翻译
  };

  /**
   * 获取产品分类的翻译
   * @param category 分类名称
   * @returns 根据当前语言返回翻译后的分类名称
   */
  const getTranslatedCategory = (category: string): string => {
    if (language === 'zh') return category;
    return t(`product.category.${category}`, category);
  };

  return {
    getTranslatedName,
    getTranslatedDescription,
    getTranslatedStockStatus,
    getTranslatedSize,
    getTranslatedCategory,
  };
}