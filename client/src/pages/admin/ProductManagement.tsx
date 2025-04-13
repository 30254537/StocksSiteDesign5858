import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronDown, ChevronUp, Pin, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from '@shared/schema';
import { useLanguage } from '@/contexts/LanguageContext';

// 创建简单的翻译函数，因为useProductTranslations不包含通用翻译功能
function useTranslations() {
  const { language } = useLanguage();
  
  const t = (key: string, defaultValue: string) => {
    // 简单的翻译实现
    const translations: Record<string, Record<string, string>> = {
      'zh': {
        'category.clothing': '服装',
        'category.accessory': '配件',
        'category.collectible': '收藏品',
        'category.digital': '数字产品',
        'category.limited': '限量版',
      },
      'en': {
        'category.clothing': 'Clothing',
        'category.accessory': 'Accessory',
        'category.collectible': 'Collectible',
        'category.digital': 'Digital',
        'category.limited': 'Limited Edition',
      }
    };
    
    const langKey = language === 'CN' ? 'zh' : 'en';
    return translations[langKey]?.[key] || defaultValue;
  };
  
  // 增加产品名称翻译方法
  const getTranslatedName = (product: Product) => {
    // 这里我们只返回原始名称，因为实际的翻译逻辑在别处处理
    return product.name;
  };
  
  return { t, getTranslatedName };
}

export default function ProductManagement() {
  const { t, getTranslatedName } = useTranslations();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 获取所有产品
  const { data: products, isLoading, isError, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 1000 * 60, // 1分钟内不重新获取
  });

  // 设置产品为特色产品或取消特色
  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number, featured: boolean }) => 
      apiRequest('PATCH', `/api/products/${id}/feature`, { featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'CN' ? '设置成功' : 'Product updated',
        description: language === 'CN' ? '产品特色状态已更新' : 'Product feature status has been updated',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'CN' ? '操作失败' : 'Error',
        description: err.message || (language === 'CN' ? '更新产品特色状态时出错' : 'Error updating product feature status'),
        variant: 'destructive',
      });
    }
  });

  // 更新产品顺序
  const reorderMutation = useMutation({
    mutationFn: ({ id, direction }: { id: number, direction: 'up' | 'down' }) => 
      apiRequest('PATCH', `/api/products/${id}/reorder`, { direction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'CN' ? '重新排序成功' : 'Reordered successfully',
        description: language === 'CN' ? '产品顺序已更新' : 'Product order has been updated',
      });
    },
    onError: (err: any) => {
      toast({
        title: language === 'CN' ? '操作失败' : 'Error',
        description: err.message || (language === 'CN' ? '更新产品顺序时出错' : 'Error updating product order'),
        variant: 'destructive',
      });
    }
  });

  // 过滤产品列表基于选择的类别
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    
    if (selectedCategory === 'all') {
      return [...products].sort((a, b) => {
        // 先按特色产品排序
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        
        // 再按显示顺序排序
        return (a.display_order || 0) - (b.display_order || 0);
      });
    }
    
    return products
      .filter(product => product.category === selectedCategory)
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
  }, [products, selectedCategory]);

  // 提取所有可用的产品类别
  const categories = React.useMemo(() => {
    if (!products) return [];
    const categorySet = new Set(products.map(p => p.category));
    return Array.from(categorySet);
  }, [products]);

  // 处理特色产品切换
  const handleFeatureToggle = (product: Product) => {
    featureMutation.mutate({ 
      id: product.id, 
      featured: !product.is_featured 
    });
  };

  // 处理上移产品
  const handleMoveUp = (product: Product) => {
    reorderMutation.mutate({ id: product.id, direction: 'up' });
  };

  // 处理下移产品
  const handleMoveDown = (product: Product) => {
    reorderMutation.mutate({ id: product.id, direction: 'down' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <XCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {language === 'CN' ? '加载产品时出错' : 'Error loading products'}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : 
            (language === 'CN' ? '请稍后再试或联系管理员' : 'Please try again later or contact the administrator')}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">
        {language === 'CN' ? '产品管理' : 'Product Management'}
      </h1>

      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <Label htmlFor="category-filter" className="mb-2 block">
            {language === 'CN' ? '按类别筛选:' : 'Filter by Category:'}
          </Label>
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={language === 'CN' ? '选择类别' : 'Select category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'CN' ? '所有类别' : 'All Categories'}
              </SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {t(`category.${category}`, category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium mb-2">
            {language === 'CN' ? '显示:' : 'Showing:'}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {language === 'CN' ? '总产品:' : 'Total:'} {products?.length || 0}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {language === 'CN' ? '特色产品:' : 'Featured:'} {products?.filter(p => p.is_featured).length || 0}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {language === 'CN' ? '已筛选:' : 'Filtered:'} {filteredProducts.length}
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="grid gap-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">
              {language === 'CN' ? '没有找到产品' : 'No products found'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <Card key={product.id} className={`p-4 ${product.is_featured ? 'border-accent' : ''}`}>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-1 gap-4">
                  {product.image_url ? (
                    <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={product.image_url} 
                        alt={t(product.id, 'name', product.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      {language === 'CN' ? '无图片' : 'No image'}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {t(product.id, 'name', product.name)}
                      </h3>
                      {product.is_featured && (
                        <Badge className="bg-accent text-primary">
                          {language === 'CN' ? '特色' : 'Featured'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      ID: {product.id} | {t(`category.${product.category}`, product.category)}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {language === 'CN' ? '显示顺序:' : 'Order:'} {product.display_order || 0}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ⊙ {product.price_stonks.toFixed(6)} $STONKS
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        USDT ${product.price_usdt}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex flex-col items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMoveUp(product)}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMoveDown(product)}
                      disabled={index === filteredProducts.length - 1 || reorderMutation.isPending}
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center">
                    <Switch
                      id={`feature-${product.id}`}
                      checked={product.is_featured}
                      onCheckedChange={() => handleFeatureToggle(product)}
                      disabled={featureMutation.isPending}
                    />
                    <Label htmlFor={`feature-${product.id}`} className="ml-2">
                      {product.is_featured ? 
                        <Pin className="h-4 w-4" /> : 
                        <Pin className="h-4 w-4 text-muted-foreground" />}
                    </Label>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}