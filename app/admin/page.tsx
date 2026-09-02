"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Box,
  ClipboardList,
  IndianRupee,
  Package,
  RefreshCcw,
  Save,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products as staticProducts } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { AdminGuard } from "@/components/admin-guard";
import { supabase } from "@/lib/supabase/client";

const ORDERS_KEY = "oneclick-orders-v1";
const STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

type Order = {
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  trackingNumber?: string | null;
  items: { quantity: number }[];
  customer: { name: string; email: string; phone: string };
};

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(staticProducts.length);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (supabase) {
        const [{ data: orderData, error: orderError }, { count, error: productError }] = await Promise.all([
          supabase
            .from("orders")
            .select("order_number,total,status,payment_status,created_at,tracking_number,customer_name,customer_email,customer_phone,order_items(quantity)")
            .order("created_at", { ascending: false }),
          supabase.from("products").select("id", { count: "exact", head: true }),
        ]);

        if (!orderError && !productError && active) {
          setOrders(
            (orderData || []).map((order: any) => ({
              orderNumber: order.order_number,
              total: Number(order.total) || 0,
              status: order.status,
              paymentStatus: order.payment_status,
              createdAt: order.created_at,
              trackingNumber: order.tracking_number,
              items: order.order_items || [],
              customer: {
                name: order.customer_name || "Customer",
                email: order.customer_email || "",
                phone: order.customer_phone || "",
              },
            }))
          );
          setProductCount(count ?? 0);
          setLoading(false);
          return;
        }
      }

      try {
        if (active) setOrders(JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"));
      } catch {
        if (active) setOrders([]);
      }
      if (active) setLoading(false);
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => (filter === "all" ? orders : orders.filter((order) => order.status === filter)), [filter, orders]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pending = orders.filter((order) => order.status === "pending").length;
  const units = orders.reduce((sum, order) => sum + order.items.reduce((total, item) => total + item.quantity, 0), 0);

  async function getAdminToken() {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Admin session expired. Please sign in again.");
    return token;
  }

  async function updateOrder(orderNumber: string, status: string, trackingNumber: string) {
    if (!supabase) return;
    setSaving(orderNumber);
    setMessage("");
    try {
      const token = await getAdminToken();
      const response = await fetch("/api/admin/order-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderNumber, status, trackingNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update order");
      setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? { ...order, status: result.order.status, paymentStatus: result.order.payment_status, trackingNumber: result.order.tracking_number } : order));
      setMessage(`Order ${orderNumber} updated successfully.`);
    } catch (error: any) {
      setMessage(error?.message || "Could not update order.");
    } finally {
      setSaving(null);
    }
  }

  async function refundOrder(orderNumber: string, amount: string) {
    if (!supabase) return;
    setRefunding(orderNumber);
    setMessage("");
    try {
      const token = await getAdminToken();
      const numericAmount = amount.trim() ? Number(amount) : undefined;
      if (numericAmount !== undefined && (!Number.isFinite(numericAmount) || numericAmount <= 0)) {
        throw new Error("Enter a valid refund amount.");
      }
      const response = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderNumber, amount: numericAmount, reason: amount.trim() ? "Admin partial refund" : "Admin full refund" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Refund failed");
      setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? { ...order, status: result.order?.status || order.status, paymentStatus: result.order?.paymentStatus || order.paymentStatus } : order));
      setMessage(`Refund ${formatCurrency(Number(result.refund.amount) || 0)} processed for ${orderNumber}.`);
    } catch (error: any) {
      setMessage(error?.message || "Refund failed.");
    } finally {
      setRefunding(null);
    }
  }

  return (
    <main className="container-shop py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">ONECLICK control center</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Admin dashboard</h1>
          <p className="mt-3 text-neutral-500">{supabase ? "Live store overview from Supabase." : "Store overview and local demo order management."}</p>
        </div>
        <Link href="/" className="btn-secondary"><ArrowLeft size={16} /> Storefront</Link>
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-4 text-sm text-neutral-500 shadow-sm">
        <strong className="text-black">{supabase ? "Live database:" : "Development dashboard:"}</strong>{" "}
        {supabase ? "Orders and catalogue counts are loaded from Supabase. Status changes and refunds are protected by the admin API." : "Supabase is not configured, so this dashboard reads demo orders saved in the browser."}
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IndianRupee size={18} />} label="Order value" value={formatCurrency(revenue)} />
        <Stat icon={<ClipboardList size={18} />} label="Total orders" value={String(orders.length)} />
        <Stat icon={<Truck size={18} />} label="Pending" value={String(pending)} />
        <Stat icon={<Box size={18} />} label="Units ordered" value={String(units)} />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <QuickLink href="/shop" icon={<ShoppingBag size={20} />} title="Storefront" text={`${productCount} products currently in the catalog`} />
        <QuickLink href="/orders" icon={<Package size={20} />} title="Customer orders" text="Open the customer-facing order history" />
      </div>

      <section className="mt-8 rounded-[32px] bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="eyebrow">Order management</p><h2 className="mt-2 text-2xl font-black">Recent orders</h2></div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-full border border-neutral-200 bg-[#faf9f6] px-4 py-2.5 text-sm font-semibold outline-none">
            <option value="all">All orders</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
          </select>
        </div>

        {message && <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p>}

        {loading ? <div className="py-14 text-center text-sm text-neutral-500">Loading dashboard…</div> : filtered.length === 0 ? <div className="py-14 text-center text-sm text-neutral-500">No orders match this filter.</div> : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead><tr className="border-b border-black/5 text-xs uppercase tracking-wider text-neutral-400"><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3">Payment</th><th className="pb-3">Status</th><th className="pb-3">Tracking</th><th className="pb-3">Refund</th><th className="pb-3 text-right">Total</th></tr></thead>
              <tbody>{filtered.map((order) => <OrderRow key={order.orderNumber} order={order} saving={saving === order.orderNumber} refunding={refunding === order.orderNumber} onSave={updateOrder} onRefund={refundOrder} />)}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function OrderRow({ order, saving, refunding, onSave, onRefund }: { order: Order; saving: boolean; refunding: boolean; onSave: (orderNumber: string, status: string, trackingNumber: string) => void; onRefund: (orderNumber: string, amount: string) => void }) {
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => { setStatus(order.status); setTracking(order.trackingNumber || ""); }, [order.status, order.trackingNumber]);

  const canRefund = order.paymentStatus === "paid" && order.status !== "refunded";

  function submitRefund() {
    if (!canRefund || refunding) return;
    const label = refundAmount.trim() ? `Refund ${formatCurrency(Number(refundAmount))} for ${order.orderNumber}?` : `Refund the full captured amount for ${order.orderNumber}?`;
    if (!window.confirm(label)) return;
    onRefund(order.orderNumber, refundAmount);
    setRefundAmount("");
  }

  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="py-4 font-black">{order.orderNumber}</td>
      <td className="py-4"><p className="font-semibold">{order.customer.name}</p><p className="text-xs text-neutral-400">{order.customer.email}</p></td>
      <td className="py-4 text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</td>
      <td className="py-4"><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold capitalize">{order.paymentStatus}</span></td>
      <td className="py-4"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-neutral-200 bg-[#faf9f6] px-2.5 py-2 text-xs font-bold outline-none" disabled={!supabase || saving || refunding}>{STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select></td>
      <td className="py-4"><div className="flex gap-2"><input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Tracking #" className="w-32 rounded-lg border border-neutral-200 bg-[#faf9f6] px-2.5 py-2 text-xs outline-none" disabled={!supabase || saving || refunding} /><button type="button" onClick={() => onSave(order.orderNumber, status, tracking)} disabled={!supabase || saving || refunding} className="inline-flex items-center gap-1 rounded-lg bg-black px-2.5 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={13} /> {saving ? "…" : "Save"}</button></div></td>
      <td className="py-4"><div className="flex items-center gap-2"><input value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder="Full / ₹ amount" inputMode="decimal" className="w-28 rounded-lg border border-neutral-200 bg-[#faf9f6] px-2.5 py-2 text-xs outline-none" disabled={!supabase || !canRefund || refunding} /><button type="button" onClick={submitRefund} disabled={!supabase || !canRefund || refunding} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCcw size={13} /> {refunding ? "…" : "Refund"}</button></div></td>
      <td className="py-4 text-right font-black">{formatCurrency(order.total)}</td>
    </tr>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[24px] bg-white p-5 shadow-soft"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">{icon}</div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="group rounded-[28px] bg-white p-6 shadow-soft transition hover:-translate-y-1"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">{icon}</div><span className="text-neutral-300 transition group-hover:text-black">→</span></div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-1 text-sm text-neutral-500">{text}</p></Link>;
}
