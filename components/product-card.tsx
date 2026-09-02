import Link from "next/link";
import { Star } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist-button";
import { AddToCart } from "@/components/add-to-cart";

export function ProductCard({ product }: { product: Product }) {
  return <article className="group overflow-hidden rounded-[28px] bg-white shadow-soft"><div className="relative"><Link href={`/product/${product.slug}`}><div className="relative aspect-square overflow-hidden bg-neutral-100"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />{product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">{product.badge}</span>}</div></Link><WishlistButton product={product} /></div><div className="p-5"><Link href={`/product/${product.slug}`}><p className="eyebrow">{product.category}</p><h3 className="mt-2 text-lg font-bold tracking-tight">{product.name}</h3><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1 text-xs text-neutral-500"><Star size={13} fill="currentColor" /> {product.rating} ({product.reviewCount})</div><div className="text-right"><span className="font-bold">{formatCurrency(product.price)}</span>{product.compareAtPrice && <span className="ml-2 text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}</div></div></Link><div className="mt-4"><AddToCart product={product} /></div></div></article>;
}
