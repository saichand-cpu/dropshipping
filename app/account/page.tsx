"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, ShoppingBag, Heart, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Loading account…");

  useEffect(() => {
    if (!supabase) return setStatus("Supabase is not configured yet.");
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setEmail(data.user.email ?? "");
      setName(data.user.user_metadata?.full_name ?? "Customer");
      setStatus("");
    });
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="container-shop py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">My account</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Hello, {name || "there"}.</h1>
        {status && <p className="mt-3 text-sm text-neutral-500">{status}</p>}
        {email && <p className="mt-2 text-neutral-500">{email}</p>}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link href="/orders" className="rounded-3xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm"><ShoppingBag size={22}/><h2 className="mt-5 font-bold">My orders</h2><p className="mt-1 text-sm text-neutral-500">Track your purchases.</p></Link>
        <Link href="/wishlist" className="rounded-3xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm"><Heart size={22}/><h2 className="mt-5 font-bold">Wishlist</h2><p className="mt-1 text-sm text-neutral-500">Products you saved.</p></Link>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6"><User size={22}/><h2 className="mt-5 font-bold">Profile</h2><p className="mt-1 text-sm text-neutral-500">Your ONECLICK account.</p></div>
      </div>
      <button onClick={signOut} className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-bold hover:bg-neutral-50"><LogOut size={16}/> Sign out</button>
    </main>
  );
}
