export interface CryptoNewsType {
  id: number;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  category: string;
  isHighlighted: number;
  createdAt: string;
  updatedAt: string;
}