"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const links = [{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { href: "/#featured", label: "Featured" }];
  return (
    <>
      <div className="bg-ink text-white overflow-hidden">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-3 px-5 text-[10px] font-bold uppercase tracking-[.22em]">
          <Sparkles size={12} /> Free shipping on selected orders <span className="hidden sm:inline text-white/50">•</span> New drops every week
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f5f3ee]/85 backdrop-blur-2xl">
        <div className="container-shop flex h-[72px] items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-xl font-black tracking-[-0.06em]">
            <span className="transition-transform duration-500 group-hover:rotate-6">ONECLICK</span><span className="text-gold">.</span>
          </Link>
          <nav className="hidden items-center gap-9 md:flex">{links.map((link, i) => <Link key={link.href} href={link.href} className="relative py-2 text-sm font-semibold text-neutral-600 transition hover:text-black"><span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-black transition-transform duration-300 hover:scale-x-100" />{link.label}</Link>)}</nav>
          <div className="flex items-center gap-1">
            <Link href="/shop" aria-label="Search" className="hidden rounded-full p-3 transition hover:-translate-y-0.5 hover:bg-white md:block"><Search size={18} /></Link>
            <Link href="/wishlist" aria-label="Wishlist" className="hidden rounded-full p-3 transition hover:-translate-y-0.5 hover:bg-white md:block"><Heart size={18} /></Link>
            <Link href="/account" aria-label="Account" className="hidden rounded-full p-3 transition hover:-translate-y-0.5 hover:bg-white md:block"><UserRound size={18} /></Link>
            <Link href="/cart" className="relative rounded-full p-3 transition hover:-translate-y-0.5 hover:bg-white" aria-label="Shopping cart"><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 animate-bounce items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">{itemCount}</span>}</Link>
            <button className="rounded-full p-3 transition hover:bg-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {open && <nav className="animate-rise border-t border-black/5 bg-[#f5f3ee] px-5 py-5 md:hidden">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-black/5 py-4 text-sm font-semibold">{link.label}</Link>)}<Link href="/wishlist" onClick={() => setOpen(false)} className="block border-b border-black/5 py-4 text-sm font-semibold">Wishlist</Link><Link href="/account" onClick={() => setOpen(false)} className="block py-4 text-sm font-semibold">Account</Link></nav>}
      </header>
    </>
  );
}
