"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products as staticProducts, categories as staticCategories } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { supabase } from "@/lib/supabase/client";
import { Product } from "@/types/product";

function mapProduct(row: any): Product { return { id: row.id, slug: row.slug, name: row.name, description: row.description, price: row.price, compareAtPrice: row.compare_at_price ?? undefined, category: row.category, image: row.image, rating: row.rating ?? 0, reviewCount: row.review_count ?? 0, badge: row.badge ?? undefined, inStock: row.in_stock ?? true, featured: row.featured ?? false, stockQuantity: row.stock_quantity ?? undefined }; }

export function ShopBrowser() {
  const [catalog, setCatalog] = useState<Product[]>(staticProducts);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All"); const [sort, setSort] = useState("featured");
  useEffect(() => { let active = true; async function loadProducts() { if (!supabase) return; const { data, error } = await supabase.from("products").select("id,slug,name,description,price,compare_at_price,category,image,rating,review_count,badge,in_stock,featured,stock_quantity").eq("in_stock", true).order("featured", { ascending: false }).order("created_at", { ascending: false }); if (!error && data?.length && active) setCatalog(data.map(mapProduct)); } loadProducts(); return () => { active = false; }; }, []);
  const categories = useMemo(() => ["All", ...Array.from(new Set(catalog.map(p => p.category)))], [catalog]);
  const filtered = useMemo(() => [...catalog].filter(p => (category === "All" || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "price-low" ? a.price-b.price : sort === "price-high" ? b.price-a.price : Number(b.featured)-Number(a.featured) || b.rating-a.rating), [catalog,query,category,sort]);
  return <div>
    <div className="glass rounded-[28px] p-3 shadow-soft transition duration-500 hover:shadow-xl"><div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
      <label className="flex items-center gap-3 rounded-2xl bg-[#f5f3ee] px-4"><Search size={17} className="text-neutral-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-transparent py-3 text-sm outline-none"/></label>
      <div className="flex items-center gap-2 rounded-2xl bg-[#f5f3ee] px-3"><SlidersHorizontal size={15} className="text-neutral-400"/><select value={category} onChange={e=>setCategory(e.target.value)} className="bg-transparent px-1 py-3 text-sm outline-none">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
      <select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-2xl bg-[#f5f3ee] px-4 py-3 text-sm outline-none"><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
    </div></div>
    <div className="mt-8 flex items-center justify-between"><p className="text-sm text-neutral-500"><span className="font-bold text-black">{filtered.length}</span> products</p><p className="hidden text-xs uppercase tracking-[.2em] text-neutral-400 sm:block">Curated for you</p></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product,i)=><div key={product.id} className={`animate-rise delay-${Math.min((i%4)+1,4)}`}><ProductCard product={product}/></div>)}</div>
    {filtered.length===0 && <div className="animate-reveal py-24 text-center"><p className="text-lg font-bold">Nothing found.</p><p className="mt-2 text-sm text-neutral-500">Try a different search or category.</p></div>}
  </div>;
}
