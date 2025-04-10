import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value);
}

export function formatEth(value: number): string {
  return `⊙ ${value} $STONKS`;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
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
