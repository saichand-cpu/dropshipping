export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  inStock: boolean;
  featured?: boolean;
};
