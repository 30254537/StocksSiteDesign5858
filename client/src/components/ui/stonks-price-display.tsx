import React, { useState, useEffect, useRef } from 'react';
import { useStonksPrice } from '@/contexts/StonksPriceContext';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// 创建一个模拟树叶落下动作的丝滑数字翻动组件
// 使用内联样式和CSS变量确保动画过程中数字保持对齐
const FlipDigit = ({ 
  digit, 
  prevDigit, 
  direction 
}: { 
  digit: string; 
  prevDigit: string; 
  direction: 'up' | 'down' | null 
}) => {
  // 判断数字是否发生变化
  const hasChanged = digit !== prevDigit;
  
  // 特殊处理点号、美元符等非数字字符，这些字符不应该有翻动效果
  const isSpecialChar = !(/^\d$/.test(digit));
  
  // 如果是特殊字符或数字没有变化，就只显示静态数字
  if (isSpecialChar || !hasChanged) {
    return (
      <span style={{
        display: 'inline-block',
        width: isSpecialChar ? '0.5em' : '0.65em',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {digit}
      </span>
    );
  }
  
  // 创建丝滑的树叶落下式数字翻动动画
  return (
    <span style={{
      display: 'inline-block',
      width: '0.65em',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      height: '1.5em'
    }}>
      {/* 新数字动画 - 从顶部/底部滑入 */}
      <span 
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          animation: `${direction === 'up' ? 'leafDropIn' : 'leafRiseIn'} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`
        }}
      >
        {digit}
      </span>
      
      {/* 旧数字动画 - 滑出 */}
      <span 
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          animation: `${direction === 'up' ? 'leafDropOut' : 'leafRiseOut'} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.175) forwards`
        }}
      >
        {prevDigit}
      </span>
    </span>
  );
};

// STONKS价格显示组件 - 简洁模式，用于顶部导航栏
export function StonksPriceIndicator() {
  const { currentPrice, contractAddress, loading, error } = useStonksPrice();
  const { t } = useLanguage();
  const [prevPrice, setPrevPrice] = useState(currentPrice);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const priceRef = useRef(currentPrice);

  // 将价格转换为带前缀的格式化字符串
  const formattedCurrentPrice = formatCurrency(currentPrice);
  const formattedPrevPrice = formatCurrency(prevPrice || currentPrice);
  
  // 监测价格变化并设置方向
  useEffect(() => {
    if (currentPrice !== priceRef.current) {
      setPriceDirection(currentPrice > priceRef.current ? 'up' : 'down');
      setPrevPrice(priceRef.current);
      priceRef.current = currentPrice;
      
      // 1.5秒后重置方向
      const timer = setTimeout(() => {
        setPriceDirection(null);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentPrice]);

  // 即使在加载中也显示价格，如果以前有价格
  // 如果是全新加载（没有缓存的价格），则短暂显示加载状态
  if (loading && prevPrice === 0) {
    return (
      <div className="flex items-center text-sm font-mono group relative h-5">
        <span className="text-primary mr-1">$STONKS:</span>
        <span className="text-[#00ffcc] font-semibold">---.--</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-sm font-mono group relative h-5">
        <span className="text-primary mr-1">$STONKS:</span>
        <span className="text-[#00ffcc] font-semibold opacity-70">{formatCurrency(prevPrice || 0.032834)}</span>
      </div>
    );
  }

  // 拆分价格字符串为单个字符，包括美元符号、小数点等
  const currentPriceChars = formattedCurrentPrice.split('');
  const prevPriceChars = formattedPrevPrice.split('');
  
  // 确保两个数组长度相同
  while (prevPriceChars.length < currentPriceChars.length) {
    prevPriceChars.push(currentPriceChars[prevPriceChars.length]);
  }
  while (currentPriceChars.length < prevPriceChars.length) {
    currentPriceChars.push(prevPriceChars[currentPriceChars.length]);
  }

  // 渲染具有单独翻动数字的价格
  return (
    <div className="flex items-center text-sm font-mono group relative h-5">
      <span className="text-primary mr-1">$STONKS:</span>
      <span className={`font-semibold text-[#00ffcc]`}>
        {currentPriceChars.map((char, index) => (
          <FlipDigit 
            key={index} 
            digit={char} 
            prevDigit={prevPriceChars[index]} 
            direction={priceDirection}
          />
        ))}
      </span>
      
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
        <span className="text-gray-400">{t('stonksPrice.currentPrice')}:</span>
        <span className="font-mono font-semibold">
          1 $STONKS = {formatCurrency(currentPrice)}
        </span>
      </div>
      
      {amount !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t('stonksPrice.equivalentAmount')}:</span>
          <span className="font-mono font-semibold">
            {formatCurrency(amount)} = ⊙ {stonksEquivalent.toFixed(6)} $STONKS
          </span>
        </div>
      )}

      {/* 显示合约地址 */}
      <div className="flex flex-col text-xs">
        <div className="text-gray-400 mb-1">{t('stonksPrice.contract')}:</div>
        <div className="font-mono text-accent break-all user-select-all">{contractAddress}</div>
      </div>
      
      {showConverter && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h4 className="text-sm mb-2">{t('stonksPrice.converter')}:</h4>
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