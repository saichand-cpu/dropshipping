"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage(error.message);
    window.location.href = "/account";
  }

  return (
    <main className="container-shop flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="eyebrow">ONECLICK account</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Sign in to manage orders, wishlist and your account.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black" />
          <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black" />
          <button disabled={loading} className="w-full rounded-2xl bg-black px-5 py-3.5 font-bold text-white disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        {message && <p className="mt-4 rounded-2xl bg-neutral-100 p-3 text-sm text-neutral-600">{message}</p>}
        <p className="mt-6 text-center text-sm text-neutral-500">New to ONECLICK? <Link href="/signup" className="font-bold text-black">Create an account</Link></p>
      </div>
    </main>
  );
}
