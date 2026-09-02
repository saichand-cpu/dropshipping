"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";

export default function WishlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return setLoading(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
      setIds((data ?? []).map((item) => item.product_id));
      setLoading(false);
    }
    load();
  }, []);

  const saved = products.filter((product) => ids.includes(product.id));

  return (
    <main className="container-shop py-12 sm:py-16">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Your wishlist.</h1>
      {loading ? <p className="mt-8 text-neutral-500">Loading…</p> : saved.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-neutral-300 p-10 text-center">
          <Heart className="mx-auto" size={28}/>
          <h2 className="mt-4 font-bold">Your wishlist is empty.</h2>
          <p className="mt-2 text-sm text-neutral-500">Save products you love and find them here later.</p>
          <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white">Explore the shop <ArrowRight size={16}/></Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white">
              <img src={product.image} alt={product.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{product.category}</p><h2 className="mt-2 font-bold">{product.name}</h2><p className="mt-2 font-black">{formatCurrency(product.price)}</p></div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
