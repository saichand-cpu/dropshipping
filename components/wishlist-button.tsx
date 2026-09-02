"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "@/types/product";

const KEY = "oneclick-wishlist";

export function WishlistButton({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      setSaved(ids.includes(product.id));
    } catch {}
  }, [product.id]);

  function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next.includes(product.id));
    window.dispatchEvent(new Event("wishlist-updated"));
  }

  return <button onClick={toggle} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105"><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>;
}
