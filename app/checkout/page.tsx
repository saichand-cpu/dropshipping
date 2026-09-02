import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function CheckoutPage() {
  return <main className="container-shop py-16"><div className="mx-auto max-w-xl rounded-[32px] bg-white p-8 text-center shadow-soft sm:p-12"><LockKeyhole className="mx-auto" size={28}/><p className="eyebrow mt-6">Secure checkout</p><h1 className="mt-3 text-3xl font-black tracking-tight">Checkout is next.</h1><p className="mt-4 leading-7 text-neutral-500">Your cart and storefront are ready. Phase 2 will connect customer details, Supabase orders, Razorpay payment verification and order confirmation here.</p><Link href="/cart" className="btn-secondary mt-7"><ArrowLeft size={16}/> Back to cart</Link></div></main>;
}
