"use client";

import Link from "next/link";
import { ArrowLeft, Box, ClipboardList, IndianRupee, Package, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products as staticProducts } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { AdminGuard } from "@/components/admin-guard";
import { supabase } from "@/lib/supabase/client";

const ORDERS_KEY = "oneclick-orders-v1";

type Order = { orderNumber: string; total: number; status: string; paymentStatus: string; createdAt: string; items: { quantity: number }[]; customer: { name: string; email: string; phone: string }; };

export default function AdminPage() {
  return <AdminGuard><AdminDashboard /></AdminGuard>;
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(staticProducts.length);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      if (supabase) {
        const [{ data: orderData, error: orderError }, { count, error: productError }] = await Promise.all([
          supabase.from("orders").select("order_number,total,status,payment_status,created_at,customer_name,customer_email,customer_phone,order_items(quantity)").order("created_at", { ascending: false }),
          supabase.from("products").select("id", { count: "exact", head: true }),
        ]);
        if (!orderError && !productError && active) {
          setOrders((orderData || []).map((order: any) => ({
            orderNumber: order.order_number, total: order.total, status: order.status, paymentStatus: order.payment_status,
            createdAt: order.created_at, items: order.order_items || [],
            customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone || "" },
          })));
          setProductCount(count ?? 0);
          setLoading(false);
          return;
        }
      }
      try { if (active) setOrders(JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")); } catch { if (active) setOrders([]); }
      if (active) setLoading(false);
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => filter === "all" ? orders : orders.filter((order) => order.status === filter), [filter, orders]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.status === "pending").length;
  const units = orders.reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0);

  return <main className="container-shop py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">ONECLICK control center</p><h1 className="mt-2 text-4xl font-black tracking-tight">Admin dashboard</h1><p className="mt-3 text-neutral-500">{supabase ? "Live store overview from Supabase." : "Store overview and local demo order management."}</p></div><Link href="/" className="btn-secondary"><ArrowLeft size={16}/> Storefront</Link></div>
    <div className="mt-8 rounded-2xl border border-black/5 bg-white p-4 text-sm text-neutral-500 shadow-sm"><strong className="text-black">{supabase ? "Live database:" : "Development dashboard:"}</strong> {supabase ? "Orders and catalogue counts are loaded from Supabase using your admin database policies." : "Supabase is not configured, so this dashboard reads demo orders saved in the browser."}</div>

    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<IndianRupee size={18}/>} label="Order value" value={formatCurrency(revenue)}/>
      <Stat icon={<ClipboardList size={18}/>} label="Total orders" value={String(orders.length)}/>
      <Stat icon={<Truck size={18}/>} label="Pending" value={String(pending)}/>
      <Stat icon={<Box size={18}/>} label="Units ordered" value={String(units)}/>
    </div>

    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <QuickLink href="/shop" icon={<ShoppingBag size={20}/>} title="Storefront" text={`${productCount} products currently in the catalog`}/>
      <QuickLink href="/orders" icon={<Package size={20}/>} title="Customer orders" text="Open the customer-facing order history"}/>
    </div>

    <section className="mt-8 rounded-[32px] bg-white p-6 shadow-soft sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="eyebrow">Order management</p><h2 className="mt-2 text-2xl font-black">Recent orders</h2></div><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-neutral-200 bg-[#faf9f6] px-4 py-2.5 text-sm font-semibold outline-none"><option value="all">All orders</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div>
      {loading ? <div className="py-14 text-center text-sm text-neutral-500">Loading dashboard…</div> : filtered.length === 0 ? <div className="py-14 text-center text-sm text-neutral-500">No orders match this filter.</div> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-black/5 text-xs uppercase tracking-wider text-neutral-400"><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.orderNumber} className="border-b border-black/5 last:border-0"><td className="py-4 font-black">{order.orderNumber}</td><td className="py-4"><p className="font-semibold">{order.customer.name}</p><p className="text-xs text-neutral-400">{order.customer.email}</p></td><td className="py-4 text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</td><td className="py-4"><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold capitalize">{order.status}</span></td><td className="py-4 text-right font-black">{formatCurrency(order.total)}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[24px] bg-white p-5 shadow-soft"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">{icon}</div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="group rounded-[28px] bg-white p-6 shadow-soft transition hover:-translate-y-1"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">{icon}</div><span className="text-neutral-300 transition group-hover:text-black">→</span></div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-1 text-sm text-neutral-500">{text}</p></Link>;
}
