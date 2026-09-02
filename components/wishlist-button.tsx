"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { supabase } from "@/lib/supabase/client";

const KEY = "oneclick-wishlist";

export function WishlistButton({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
        if (active) setSaved(ids.includes(product.id));
      } catch {}
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
      if (active && data) setSaved(true);
    }
    load();
    return () => { active = false; };
  }, [product.id]);

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      let ids: string[] = [];
      try { ids = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}
      const next = ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next.includes(product.id));
      window.dispatchEvent(new Event("wishlist-updated"));

      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (next.includes(product.id)) await supabase.from("wishlists").upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
          else await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
        }
      }
    } finally { setBusy(false); }
  }

  return <button onClick={toggle} disabled={busy} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-50"><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>;
}
