import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist-button";
import { AddToCart } from "@/components/add-to-cart";

export function ProductCard({ product }: { product: Product }) {
  const stock = product.stockQuantity;
  const lowStock = stock !== undefined && stock > 0 && stock <= (product.lowStockThreshold ?? 5);
  const outOfStock = !product.inStock || stock === 0;
  return <article className="group relative overflow-hidden rounded-[28px] bg-white shadow-soft transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
    <div className="relative overflow-hidden">
      <Link href={`/product/${product.slug}`}><div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur">{product.badge}</span>}
        {outOfStock && <span className="absolute bottom-4 left-4 rounded-full bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">Out of stock</span>}
        {lowStock && <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700">Only {stock} left</span>}
        <span className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17}/></span>
      </div></Link>
      <WishlistButton product={product} />
    </div>
    <div className="p-5">
      <Link href={`/product/${product.slug}`}><p className="eyebrow">{product.category}</p><h3 className="mt-2 text-lg font-bold tracking-tight transition group-hover:text-neutral-500">{product.name}</h3><div className="mt-3 flex items-center justify-between gap-2"><div className="flex items-center gap-1 text-xs text-neutral-500"><Star size={13} fill="currentColor"/> {product.rating} <span className="text-neutral-300">({product.reviewCount})</span></div><div className="text-right"><span className="font-bold">{formatCurrency(product.price)}</span>{product.compareAtPrice && <span className="ml-2 text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}</div></div></Link>
      <div className="mt-4"><AddToCart product={product}/></div>
    </div>
  </article>;
}
