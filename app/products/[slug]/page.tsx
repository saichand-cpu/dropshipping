import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ShieldCheck } from "lucide-react";
import { getProduct, products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { AddToCart } from "@/components/add-to-cart";

export function generateStaticParams() { return products.map(p => ({ slug: p.slug })); }

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();
  return <main className="container-shop py-10 sm:py-16"><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-black"><ArrowLeft size={16}/> Back to shop</Link><div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16"><div className="overflow-hidden rounded-[36px] bg-white"><img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover"/></div><div className="flex flex-col justify-center"><p className="eyebrow">{product.category}</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{product.name}</h1><div className="mt-4 flex items-center gap-2 text-sm"><Star size={15} fill="currentColor"/> {product.rating} <span className="text-neutral-400">· {product.reviewCount} reviews</span></div><div className="mt-7 flex items-baseline gap-3"><span className="text-3xl font-black">{formatCurrency(product.price)}</span>{product.compareAtPrice && <span className="text-sm text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}</div><p className="mt-6 max-w-xl leading-7 text-neutral-500">{product.description}</p><div className="mt-8 max-w-md"><AddToCart product={product}/></div><div className="mt-6 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck size={16}/> Secure checkout and order support</div></div></div></main>;
}
