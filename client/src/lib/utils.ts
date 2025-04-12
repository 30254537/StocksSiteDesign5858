import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  }).format(value);
}

/**
 * 格式化交易哈希显示，移除多余前缀
 * @param hash - 交易哈希字符串
 * @param paymentMethod - 支付方式 (usdt 或 crypto/stonks)
 * @returns 格式化后的交易哈希字符串
 */
export function formatTransactionHash(hash: string | null | undefined, paymentMethod: string): string {
  if (!hash) return "";
  
  // 清除 "USDT transaction on trc20 network: 1" 前缀
  if (paymentMethod === 'usdt' && hash.includes('USDT transaction on trc20 network: 1')) {
    return hash.replace('USDT transaction on trc20 network: 1', 'USDT/TRC20:');
  }
  
  // 清除 "CRYPTO transaction: 1" 前缀
  if ((paymentMethod === 'crypto' || paymentMethod === 'stonks') && hash.includes('CRYPTO transaction: 1')) {
    return hash.replace('CRYPTO transaction: 1', 'STONKS:');
  }
  
  // 如果已经是正确格式或其他格式，添加前缀
  if (paymentMethod === 'usdt' && !hash.startsWith('USDT/TRC20:')) {
    return `USDT/TRC20: ${hash}`;
  }
  
  if ((paymentMethod === 'crypto' || paymentMethod === 'stonks') && !hash.startsWith('STONKS:')) {
    return `STONKS: ${hash}`;
  }
  
  return hash;
}

export function formatEth(value: number): string {
  return `⊙ ${value.toFixed(6)} $STONKS`;
}

// 将美元价格转换成STONKS代币价格并格式化显示
export function formatUsdToStonks(usdPrice: number, stonksPrice: number): string {
  if (!stonksPrice || stonksPrice === 0) return `⊙ 0.000000 $STONKS`;
  const stonksAmount = usdPrice / stonksPrice;
  return `⊙ ${stonksAmount.toFixed(6)} $STONKS`;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(6)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * 格式化日期为本地字符串，用于显示订单日期等
 * @param dateString - 日期字符串或Date对象
 * @returns 格式化后的日期字符串，例如：2025-04-12 11:30 AM
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function calculateCartTotals(cartItems: any[]) {
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalEthPrice = cartItems.reduce((sum, item) => sum + (item.product.ethPrice * item.quantity), 0);
  
  return {
    totalPrice,
    totalEthPrice,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

/**
 * Format seconds into MM:SS format
 * @param seconds - Duration in seconds
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format time in seconds to MM:SS format (alias for formatDuration)
 * @param seconds - Time in seconds
 */
export function formatTime(seconds: number): string {
  return formatDuration(seconds);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an audio file
 */
export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
}
