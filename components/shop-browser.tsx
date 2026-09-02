"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/product-card";

export function ShopBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => products.filter(p => (category === "All" || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "price-low" ? a.price-b.price : sort === "price-high" ? b.price-a.price : b.rating-a.rating), [query, category, sort]);
  return <div><div className="grid gap-3 rounded-3xl bg-white p-4 shadow-soft md:grid-cols-[1fr_auto_auto]"><label className="flex items-center gap-3 rounded-2xl bg-[#f7f4ee] px-4"><Search size={17} className="text-neutral-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-transparent py-3 text-sm outline-none"/></label><select value={category} onChange={e => setCategory(e.target.value)} className="rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm outline-none">{categories.map(c => <option key={c}>{c}</option>)}</select><select value={sort} onChange={e => setSort(e.target.value)} className="rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm outline-none"><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select></div><div className="mt-8 flex items-center justify-between"><p className="text-sm text-neutral-500">{filtered.length} products</p></div><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(product => <ProductCard key={product.id} product={product}/>)}</div>{filtered.length === 0 && <div className="py-20 text-center"><p className="text-lg font-bold">No products found</p><p className="mt-2 text-sm text-neutral-500">Try a different search or category.</p></div>}</div>;
}
