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
   * @param product 产品对象
   * @returns 根据当前语言返回翻译后的库存状态
   */
  const getTranslatedStockStatus = (product: Product): string => {
    // 首先检查inStock字段，如果是0则显示无货
    if (product.inStock === 0) {
      return language === 'zh' ? '无货' : t('product.outOfStock', 'Out of Stock');
    }
    
    // 如果有货，则根据库存数量显示不同的提示
    if (product.stock > 10) {
      return language === 'zh' ? '有货' : t('product.inStock', 'In Stock');
    } else {
      // 处理数量格式化和翻译，确保替换 {0} 为实际数量
      const stockText = language === 'zh' 
        ? t('product.onlyLeft', `仅剩 {0} 件`).replace('{0}', product.stock.toString())
        : t('product.onlyLeft', `Only {0} left`).replace('{0}', product.stock.toString());
      
      return stockText;
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