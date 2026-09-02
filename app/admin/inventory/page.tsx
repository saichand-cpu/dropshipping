"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { supabase } from "@/lib/supabase/client";

const LOW_STOCK_THRESHOLD = 5;

type InventoryProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  in_stock: boolean;
  stock_quantity: number;
  updated_at: string;
};

export default function InventoryPage() {
  return <AdminGuard><InventoryDashboard /></AdminGuard>;
}

function InventoryDashboard() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function token() {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Admin session expired. Please sign in again.");
    return data.session.access_token;
  }

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/inventory", { headers: { Authorization: `Bearer ${await token()}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load inventory.");
      setProducts(result.products || []);
      setDrafts(Object.fromEntries((result.products || []).map((product: InventoryProduct) => [product.id, String(product.stock_quantity)])));
    } catch (error: any) {
      setMessage(error?.message || "Could not load inventory.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save(id: string) {
    setSaving(id); setMessage("");
    try {
      const quantity = Number(drafts[id]);
      if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Stock must be a whole number of 0 or more.");
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id, stockQuantity: quantity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update stock.");
      setProducts(current => current.map(product => product.id === id ? result.product : product));
      setDrafts(current => ({ ...current, [id]: String(result.product.stock_quantity) }));
      setMessage(`${result.product.name} inventory updated.`);
    } catch (error: any) {
      setMessage(error?.message || "Could not update stock.");
    } finally { setSaving(null); }
  }

  const lowStock = useMemo(() => products.filter(product => product.stock_quantity > 0 && product.stock_quantity <= LOW_STOCK_THRESHOLD), [products]);
  const outOfStock = useMemo(() => products.filter(product => product.stock_quantity === 0), [products]);

  return <main className="container-shop py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">ONECLICK control center</p><h1 className="mt-2 text-4xl font-black tracking-tight">Inventory</h1><p className="mt-3 text-neutral-500">Manage live stock levels without exposing database credentials.</p></div>
      <Link href="/admin" className="btn-secondary"><ArrowLeft size={16}/> Admin dashboard</Link>
    </div>

    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Summary label="Products" value={products.length} />
      <Summary label="Low stock" value={lowStock.length} warning />
      <Summary label="Out of stock" value={outOfStock.length} warning={outOfStock.length > 0} />
    </div>

    {message && <p className="mt-5 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p>}

    <section className="mt-8 rounded-[32px] bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Stock control</p><h2 className="mt-2 text-2xl font-black">Product inventory</h2></div><span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-bold">Low stock ≤ {LOW_STOCK_THRESHOLD}</span></div>
      {loading ? <div className="py-16 text-center text-sm text-neutral-500">Loading inventory…</div> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-black/5 text-xs uppercase tracking-wider text-neutral-400"><th className="pb-3">Product</th><th className="pb-3">Status</th><th className="pb-3">Stock</th><th className="pb-3">Last updated</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{products.map(product => { const quantity = Number(drafts[product.id]); const changed = String(product.stock_quantity) !== drafts[product.id]; const low = product.stock_quantity > 0 && product.stock_quantity <= LOW_STOCK_THRESHOLD; return <tr key={product.id} className="border-b border-black/5 last:border-0"><td className="py-5"><p className="font-bold">{product.name}</p><p className="mt-1 text-xs text-neutral-400">{product.slug}</p></td><td className="py-5">{product.stock_quantity === 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"><AlertTriangle size={13}/> Out of stock</span> : low ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700"><AlertTriangle size={13}/> Low stock</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={13}/> In stock</span>}</td><td className="py-5"><input type="number" min="0" max="1000000" value={drafts[product.id] ?? ""} onChange={event => setDrafts(current => ({ ...current, [product.id]: event.target.value }))} className="w-28 rounded-xl border border-neutral-200 bg-[#faf9f6] px-3 py-2.5 font-bold outline-none" /></td><td className="py-5 text-neutral-500">{new Date(product.updated_at).toLocaleString()}</td><td className="py-5 text-right"><button type="button" onClick={() => save(product.id)} disabled={!changed || saving === product.id} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"><Save size={14}/>{saving === product.id ? "Saving…" : "Save"}</button></td></tr>; })}</tbody></table></div>}
    </section>
  </main>;
}

function Summary({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div className="rounded-[24px] bg-white p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p>{warning && value > 0 && <p className="mt-1 text-xs font-semibold text-neutral-500">Needs attention</p>}</div>; }
