"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";

type CartItem = Product & { quantity: number };
type CartContextValue = { items: CartItem[]; itemCount: number; subtotal: number; addItem: (product: Product) => void; removeItem: (id: string) => void; setQuantity: (id: string, quantity: number) => void; clearCart: () => void };

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "oneclick-cart-v1";
const LEGACY_STORAGE_KEY = "nexora-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
        if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, saved);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (product) => setItems((current) => {
      const found = current.find((item) => item.id === product.id);
      return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
    }),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    setQuantity: (id, quantity) => setItems((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
