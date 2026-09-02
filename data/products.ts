import { Product } from "@/types/product";

export const products: Product[] = [
  { id: "p1", slug: "aura-wireless-headphones", name: "AURA Wireless Headphones", description: "Immersive sound, comfortable all-day fit, and a clean minimalist silhouette.", price: 2499, compareAtPrice: 3999, category: "Tech", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviewCount: 184, badge: "Bestseller", inStock: true, featured: true },
  { id: "p2", slug: "minimal-steel-watch", name: "Minimal Steel Watch", description: "A refined everyday watch with a timeless face and polished steel case.", price: 1899, compareAtPrice: 2999, category: "Style", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", rating: 4.7, reviewCount: 96, badge: "New", inStock: true, featured: true },
  { id: "p3", slug: "urban-shade-sunglasses", name: "Urban Shade Sunglasses", description: "Statement frames designed for bright days, city walks, and weekend escapes.", price: 1299, compareAtPrice: 1999, category: "Style", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85", rating: 4.6, reviewCount: 73, inStock: true, featured: true },
  { id: "p4", slug: "everyday-travel-pack", name: "Everyday Travel Pack", description: "Smart compartments and a streamlined profile for work, travel, and daily carry.", price: 2199, compareAtPrice: 3299, category: "Travel", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", rating: 4.9, reviewCount: 121, badge: "Top Rated", inStock: true, featured: true },
  { id: "p5", slug: "street-runner-sneakers", name: "Street Runner Sneakers", description: "Lightweight everyday sneakers built around comfort and a versatile streetwear look.", price: 2799, compareAtPrice: 4299, category: "Style", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", rating: 4.7, reviewCount: 204, inStock: true, featured: true },
  { id: "p6", slug: "insulated-urban-bottle", name: "Insulated Urban Bottle", description: "A durable insulated bottle that keeps drinks ready through busy days.", price: 999, compareAtPrice: 1499, category: "Lifestyle", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85", rating: 4.5, reviewCount: 58, inStock: true, featured: true },
];

export const categories = ["All", "Tech", "Style", "Travel", "Lifestyle"];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
