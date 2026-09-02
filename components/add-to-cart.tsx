"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/components/cart-provider";

export function AddToCart({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const currentQuantity = items.find((item) => item.id === product.id)?.quantity ?? 0;
  const stock = product.stockQuantity;
  const unavailable = !product.inStock || stock === 0;
  const limitReached = stock !== undefined && currentQuantity >= stock;
  const disabled = unavailable || limitReached;

  function handleAdd() {
    if (disabled) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-45" onClick={handleAdd} disabled={disabled}>
    {unavailable ? <>Out of stock</> : limitReached ? <>Maximum available in cart</> : added ? <><Check size={17} /> Added to cart</> : <><ShoppingBag size={17} /> Add to cart</>}
  </button>;
}
