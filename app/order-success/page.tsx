"use client";

import Link from "next/link";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const params = useSearchParams();
  const order = params.get("order");
  return <main className="container-shop py-16"><div className="mx-auto max-w-2xl rounded-[36px] bg-white p-8 text-center shadow-soft sm:p-14"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100"><CheckCircle2 size={32}/></div><p className="eyebrow mt-7">ONECLICK order</p><h1 className="mt-3 text-4xl font-black tracking-tight">Order received.</h1><p className="mx-auto mt-4 max-w-lg leading-7 text-neutral-500">Your order has been saved successfully. Online payment is not enabled yet, so the order currently remains pending.</p>{order && <div className="mt-7 rounded-2xl bg-[#f7f4ee] p-5"><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order number</p><p className="mt-2 text-2xl font-black">{order}</p></div>}<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/orders" className="btn-primary"><Package size={17}/> View my orders</Link><Link href="/shop" className="btn-secondary"><ShoppingBag size={17}/> Continue shopping</Link></div></div></main>;
}
