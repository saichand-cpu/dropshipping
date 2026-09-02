"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, PackageCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type LocalOrder = {
  orderNumber: string;
  items: ReturnType<typeof useCart>["items"];
  customer: { name: string; email: string; phone: string };
  address: { line1: string; city: string; state: string; pincode: string; landmark: string };
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: "pending";
  paymentStatus: "pending";
  createdAt: string;
};

const ORDERS_KEY = "oneclick-orders-v1";
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", state: "", pincode: "", landmark: "" });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const shipping = useMemo(() => (subtotal >= 1999 ? 0 : 99), [subtotal]);
  const total = subtotal + shipping;

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setError("");
    setPlacing(true);

    if (!supabase) {
      const orderNumber = `OC-${Date.now().toString().slice(-8)}`;
      const order: LocalOrder = { orderNumber, items, customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }, address: { line1: form.line1.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(), landmark: form.landmark.trim() }, subtotal, shipping, discount: 0, total, status: "pending", paymentStatus: "pending", createdAt: new Date().toISOString() };
      try {
        const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
        localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...existing]));
        clearCart();
        router.push(`/order-success?order=${encodeURIComponent(orderNumber)}`);
      } catch {
        setError("We couldn't save your demo order. Please try again.");
        setPlacing(false);
      }
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in before placing an order.");

      const { data, error: orderError } = await supabase.rpc("create_order", {
        p_customer_name: form.name.trim(),
        p_customer_email: form.email.trim(),
        p_customer_phone: form.phone.trim(),
        p_shipping_address: { line1: form.line1.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(), landmark: form.landmark.trim() },
        p_items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      });
      if (orderError || !data?.order_number) throw new Error(orderError?.message || "We couldn't create your order.");

      if (!API_BASE || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        clearCart();
        router.push(`/order-success?order=${encodeURIComponent(data.order_number)}&payment=pending`);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session expired. Please sign in again.");

      const paymentResponse = await fetch(`${API_BASE}/api/razorpay/create-order`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ orderId: data.id }) });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Unable to start payment.");

      if (!(await loadRazorpayScript()) || !window.Razorpay) throw new Error("Razorpay could not be loaded. Please try again.");
      const Razorpay = window.Razorpay;
      const checkout = new Razorpay({
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "ONECLICK",
        description: `Order ${data.order_number}`,
        order_id: paymentData.orderId,
        prefill: { name: form.name.trim(), email: form.email.trim(), contact: form.phone.trim() },
        theme: { color: "#111111" },
        modal: { ondismiss: () => setPlacing(false) },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyResponse = await fetch(`${API_BASE}/api/razorpay/verify-payment`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ ...response, oneclick_order_id: data.id }) });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.verified) throw new Error(verifyData.error || "Payment verification failed.");
            clearCart();
            router.push(`/order-success?order=${encodeURIComponent(data.order_number)}&payment=paid`);
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed. Your order remains pending.");
            setPlacing(false);
          }
        },
      });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "We couldn't create your order. Please try again.");
      setPlacing(false);
    }
  }

  if (!items.length) return <main className="container-shop py-16"><div className="mx-auto max-w-xl rounded-[32px] bg-white p-8 text-center shadow-soft sm:p-12"><PackageCheck className="mx-auto" size={30}/><p className="eyebrow mt-6">Checkout</p><h1 className="mt-3 text-3xl font-black tracking-tight">Your cart is empty.</h1><p className="mt-4 text-neutral-500">Add something you love before continuing to checkout.</p><Link href="/shop" className="btn-primary mt-7">Continue shopping</Link></div></main>;

  return <main className="container-shop py-10 sm:py-14">
    <Link href="/cart" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-black"><ArrowLeft size={16}/> Back to cart</Link>
    <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
      <form onSubmit={placeOrder} className="rounded-[32px] bg-white p-6 shadow-soft sm:p-9">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100"><LockKeyhole size={19}/></div><div><p className="eyebrow">Secure checkout</p><h1 className="mt-1 text-3xl font-black tracking-tight">Delivery details</h1></div></div>
        <p className="mt-4 text-sm leading-6 text-neutral-500">Your order is priced by Supabase. When the payment API is configured, Razorpay opens securely and its signature is verified before the order is marked paid.</p>
        <section className="mt-8"><h2 className="text-base font-bold">Contact information</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="field-label">Full name *</span><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-shop" placeholder="Your full name" /></label>
          <label><span className="field-label">Email *</span><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-shop" placeholder="you@example.com" /></label>
          <label><span className="field-label">Phone *</span><input required type="tel" inputMode="tel" pattern="[0-9 +()-]{10,}" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-shop" placeholder="10-digit mobile number" /></label>
        </div></section>
        <section className="mt-8"><h2 className="text-base font-bold">Shipping address</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="field-label">Address *</span><input required value={form.line1} onChange={(e) => update("line1", e.target.value)} className="input-shop" placeholder="House / flat, street and area" /></label>
          <label><span className="field-label">City *</span><input required value={form.city} onChange={(e) => update("city", e.target.value)} className="input-shop" placeholder="Hyderabad" /></label>
          <label><span className="field-label">State *</span><input required value={form.state} onChange={(e) => update("state", e.target.value)} className="input-shop" placeholder="Telangana" /></label>
          <label><span className="field-label">PIN code *</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))} className="input-shop" placeholder="500001" /></label>
          <label><span className="field-label">Landmark <span className="font-normal text-neutral-400">(optional)</span></span><input value={form.landmark} onChange={(e) => update("landmark", e.target.value)} className="input-shop" placeholder="Nearby landmark" /></label>
        </div></section>
        <div className="mt-8 rounded-2xl border border-black/5 bg-[#f7f4ee] p-4"><div className="flex gap-3"><CheckCircle2 size={19} className="mt-0.5 shrink-0"/><div><p className="text-sm font-bold">Payment protection</p><p className="mt-1 text-xs leading-5 text-neutral-500">Card and UPI details are handled by Razorpay. ONECLICK never receives or stores your payment credentials.</p></div></div></div>
        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        <button disabled={placing} className="btn-primary mt-6 w-full">{placing ? "Opening secure payment…" : `Place order · ${formatCurrency(total)}`}</button>
      </form>
      <aside className="h-fit rounded-[32px] bg-ink p-6 text-white shadow-soft sm:p-8 lg:sticky lg:top-28"><p className="eyebrow text-white/50">Order summary</p><div className="mt-5 space-y-4">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-white/50">Qty {item.quantity}</p></div><p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p></div>)}</div><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between text-white/60"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between text-white/60"><span>Shipping</span><span>{shipping ? formatCurrency(shipping) : "FREE"}</span></div><div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-black"><span>Total</span><span>{formatCurrency(total)}</span></div></div><p className="mt-6 text-xs leading-5 text-white/40">Free shipping on orders above ₹1,999.</p></aside>
    </div>
  </main>;
}
