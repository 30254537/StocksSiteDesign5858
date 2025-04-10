// 加密新闻类型
export interface CryptoNewsType {
  id: number;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string;
  isHighlighted: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// 加密货币价格类型
export interface CryptoPrice {
  price: number;
  currency: string;
  contractAddress: string;
  tokenSymbol: string;
  lastUpdated: string;
}