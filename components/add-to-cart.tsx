"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/components/cart-provider";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  return <button className="btn-primary w-full" onClick={() => { addItem(product); setAdded(true); setTimeout(() => setAdded(false), 1400); }}>{added ? <><Check size={17} /> Added to cart</> : <><ShoppingBag size={17} /> Add to cart</>}</button>;
}
