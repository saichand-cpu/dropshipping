"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const links = [{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { href: "/#featured", label: "Featured" }];
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f4ee]/90 backdrop-blur-xl">
      <div className="container-shop flex h-20 items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-[-0.05em]">ONECLICK<span className="text-gold">.</span></Link>
        <nav className="hidden items-center gap-8 md:flex">{links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-medium text-neutral-600 transition hover:text-black">{link.label}</Link>)}</nav>
        <div className="flex items-center gap-2">
          <Link href="/shop" aria-label="Search" className="hidden rounded-full p-3 hover:bg-white md:block"><Search size={18} /></Link>
          <Link href="/cart" className="relative rounded-full p-3 hover:bg-white" aria-label="Shopping cart"><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">{itemCount}</span>}</Link>
          <button className="rounded-full p-3 hover:bg-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && <nav className="border-t border-black/5 bg-[#f7f4ee] px-5 py-5 md:hidden">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-black/5 py-4 text-sm font-semibold">{link.label}</Link>)}</nav>}
    </header>
  );
}
