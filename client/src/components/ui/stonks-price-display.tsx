import React from 'react';
import { useStonksPrice } from '@/contexts/StonksPriceContext';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// STONKS价格显示组件 - 简洁模式，用于顶部导航栏
export function StonksPriceIndicator() {
  const { currentPrice, contractAddress, loading, error } = useStonksPrice();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center text-sm">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        <span>{t('stonksPrice.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        {t('stonksPrice.error')}
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm font-mono group relative">
      <span className="text-primary mr-1">$STONKS:</span>
      <span className="font-semibold">{formatCurrency(currentPrice)}</span>
      
      {/* 悬停显示合约地址 */}
      <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-slate-900 p-2 rounded shadow-lg z-50 text-xs border border-accent/30 max-w-[300px] break-all">
        <div className="text-gray-400 mb-1">{t('stonksPrice.contract')}:</div>
        <code className="font-mono text-accent">{contractAddress}</code>
      </div>
    </div>
  );
}

// 详细的STONKS价格显示，带有UPD价格和STONKS转换
interface StonksPriceDisplayProps {
  amount?: number; // USD金额
  showConverter?: boolean;
}

export function StonksPriceDisplay({ amount, showConverter = false }: StonksPriceDisplayProps) {
  const { currentPrice, contractAddress, loading, error, convertUsdToStonks } = useStonksPrice();
  const { t } = useLanguage();
  const [customAmount, setCustomAmount] = React.useState<string>(amount?.toString() || '');
  
  // 如果提供了amount，计算等值的STONKS
  const stonksEquivalent = amount ? convertUsdToStonks(amount) : 0;
  const customStonksEquivalent = customAmount ? convertUsdToStonks(parseFloat(customAmount)) : 0;

  if (loading) {
    return (
      <div className="flex flex-col space-y-2 p-4 bg-slate-800 rounded-lg">
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>{t('stonksPrice.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg text-red-500">
        <p>{t('stonksPrice.error')}</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-800 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-gray-400">{t('stonksPrice.currentPrice')}</span>
        <span className="font-mono font-semibold">
          1 $STONKS = {formatCurrency(currentPrice)}
        </span>
      </div>
      
      {amount !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t('stonksPrice.equivalentAmount')}</span>
          <span className="font-mono font-semibold">
            {formatCurrency(amount)} = ⊙ {stonksEquivalent.toFixed(6)} $STONKS
          </span>
        </div>
      )}

      {/* 显示合约地址 */}
      <div className="flex flex-col text-xs">
        <div className="text-gray-400 mb-1">{t('stonksPrice.contract')}:</div>
        <div className="font-mono text-accent break-all">{contractAddress}</div>
      </div>
      
      {showConverter && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h4 className="text-sm mb-2">{t('stonksPrice.converter')}</h4>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="USDT金额"
                className="w-full p-2 bg-slate-900 rounded border border-gray-700"
              />
            </div>
            <span>=</span>
            <div className="flex-1">
              <div className="p-2 bg-slate-900 rounded border border-gray-700 font-mono">
                ⊙ {!isNaN(customStonksEquivalent) ? customStonksEquivalent.toFixed(6) : '0.000000'} $STONKS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}