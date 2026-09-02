"use client";

import Link from "next/link";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

const ORDERS_KEY = "oneclick-orders-v1";

type StoredOrder = {
  orderNumber: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  customer: { name: string; email: string; phone: string };
  address: { line1: string; city: string; state: string; pincode: string; landmark: string };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

function mapDbOrder(order: any): StoredOrder {
  const address = order.shipping_address || {};
  return {
    orderNumber: order.order_number,
    items: (order.order_items || []).map((item: any) => ({ id: item.id, name: item.product_name, quantity: item.quantity, price: item.unit_price })),
    customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone || "" },
    address: { line1: address.line1 || "", city: address.city || "", state: address.state || "", pincode: address.pincode || "", landmark: address.landmark || "" },
    subtotal: order.subtotal,
    shipping: order.shipping_fee,
    discount: order.discount || 0,
    total: order.total,
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false });
          if (!error && active) {
            setOrders((data || []).map(mapDbOrder));
            setLoading(false);
            return;
          }
        }
      }
      try { if (active) setOrders(JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")); } catch { if (active) setOrders([]); }
      if (active) setLoading(false);
    }
    loadOrders();
    return () => { active = false; };
  }, []);

  return <main className="container-shop py-12 sm:py-16">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Account</p><h1 className="mt-2 text-4xl font-black tracking-tight">My orders</h1><p className="mt-3 text-neutral-500">{supabase ? "Your orders are securely loaded from your ONECLICK account." : "Your ONECLICK orders are saved on this device."}</p></div><Link href="/shop" className="btn-secondary"><ShoppingBag size={16}/> Continue shopping</Link></div>
    {loading ? <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-soft"><p className="text-sm text-neutral-500">Loading your orders…</p></div> : orders.length === 0 ? <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-soft"><Package className="mx-auto" size={32}/><h2 className="mt-5 text-2xl font-black">No orders yet</h2><p className="mt-2 text-neutral-500">Once you place an order, it will appear here.</p><Link href="/shop" className="btn-primary mt-6">Explore ONECLICK</Link></div> : <div className="mt-10 space-y-5">{orders.map((order) => <article key={order.orderNumber} className="rounded-[28px] bg-white p-6 shadow-soft sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order</p><h2 className="mt-1 text-lg font-black">{order.orderNumber}</h2><p className="mt-1 text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold capitalize">{order.status}</span><span className="font-black">{formatCurrency(order.total)}</span></div></div><div className="grid gap-5 pt-5 md:grid-cols-[1fr_auto]"><div className="space-y-3">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.name} <span className="text-neutral-400">× {item.quantity}</span></span><span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div><div className="rounded-2xl bg-[#f7f4ee] p-4 text-sm md:min-w-64"><p className="font-bold">Deliver to</p><p className="mt-2 leading-6 text-neutral-500">{order.customer.name}<br/>{order.address.line1}<br/>{order.address.city}, {order.address.state} — {order.address.pincode}</p></div></div><div className="mt-5 border-t border-black/5 pt-4 text-xs text-neutral-500">Payment status: <span className="font-bold capitalize text-black">{order.paymentStatus}</span>{supabase ? "" : " · Online payment will be connected in the payment phase."}</div></article>)}</div>}
    <Link href="/account" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black">Back to account <ArrowRight size={15}/></Link>
  </main>;
}
