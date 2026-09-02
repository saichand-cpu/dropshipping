import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Truck, RotateCcw, Sparkles, MoveUpRight } from "lucide-react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/product-card";

export default function HomePage() {
  const featured = products.filter(p => p.featured).slice(0, 4);
  return <main>
    <section className="container-shop pt-6 sm:pt-10">
      <div className="relative min-h-[620px] overflow-hidden rounded-[38px] bg-ink text-white shadow-2xl sm:min-h-[680px]">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-drift" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gold/10 blur-3xl animate-drift" />
        <div className="relative grid min-h-[620px] items-end lg:min-h-[680px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 lg:pb-20">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.25em] backdrop-blur-xl"><Sparkles size={13}/> The everyday edit</div>
            <h1 className="animate-rise delay-1 mt-6 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.07em] sm:text-7xl lg:text-[88px]">Better finds.<br/><span className="text-white/45">Less searching.</span></h1>
            <p className="animate-rise delay-2 mt-7 max-w-lg text-base leading-7 text-white/65 sm:text-lg">Practical upgrades, beautiful objects and internet-worthy finds — carefully selected so you can discover more and scroll less.</p>
            <div className="animate-rise delay-3 mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn-primary bg-white text-black hover:bg-white">Shop the collection <ArrowRight size={17}/></Link><Link href="#featured" className="btn-secondary border-white/20 bg-white/5 text-white hover:border-white/50 hover:bg-white/10">Explore drops</Link></div>
            <div className="animate-rise delay-4 mt-10 flex flex-wrap gap-7 text-xs font-semibold text-white/55"><span>Curated weekly</span><span>Secure checkout</span><span>Easy support</span></div>
          </div>
          <div className="absolute inset-0 lg:relative lg:min-h-full">
            <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=90" alt="Modern retail collection" className="absolute inset-0 h-full w-full object-cover opacity-45 lg:opacity-100 lg:[mask-image:linear-gradient(to_right,transparent,black_28%)]"/>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent lg:hidden" />
            <div className="absolute bottom-8 right-8 hidden w-56 animate-float rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl lg:block"><p className="text-[10px] font-bold uppercase tracking-widest text-white/45">This week</p><p className="mt-2 text-2xl font-black">Fresh drops.</p><p className="mt-1 text-xs leading-5 text-white/55">Useful things you didn't know you needed.</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="overflow-hidden border-y border-black/5 bg-white mt-8"><div className="flex min-w-max animate-[marquee_24s_linear_infinite] gap-12 py-5 text-[10px] font-black uppercase tracking-[.3em] text-neutral-400"><span>ONECLICK • CURATED FINDS</span><span>SMARTER SHOPPING •</span><span>DESIGNED FOR EVERYDAY •</span><span>ONECLICK • CURATED FINDS</span><span>SMARTER SHOPPING •</span><span>DESIGNED FOR EVERYDAY •</span></div></section>

    <section className="container-shop py-16 sm:py-20"><div className="grid gap-4 sm:grid-cols-3"><div className="glass rounded-3xl p-6 transition duration-500 hover:-translate-y-2 hover:shadow-xl"><Truck size={21}/><p className="mt-5 font-bold">Reliable delivery</p><p className="mt-1 text-sm leading-6 text-neutral-500">Tracking on eligible orders.</p></div><div className="glass rounded-3xl p-6 transition duration-500 hover:-translate-y-2 hover:shadow-xl"><ShieldCheck size={21}/><p className="mt-5 font-bold">Secure checkout</p><p className="mt-1 text-sm leading-6 text-neutral-500">Protected Razorpay payments.</p></div><div className="glass rounded-3xl p-6 transition duration-500 hover:-translate-y-2 hover:shadow-xl"><RotateCcw size={21}/><p className="mt-5 font-bold">Simple support</p><p className="mt-1 text-sm leading-6 text-neutral-500">Help when you need it.</p></div></div></section>

    <section id="featured" className="container-shop pb-20 sm:pb-28"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow">Handpicked by ONECLICK</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">Featured right now.</h2></div><Link href="/shop" className="group hidden items-center gap-2 text-sm font-bold sm:flex">View all <MoveUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"/></Link></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((product, i) => <div key={product.id} className={`animate-rise delay-${Math.min(i + 1, 4)}`}><ProductCard product={product}/></div>)}</div></section>

    <section className="container-shop pb-20"><div className="relative overflow-hidden rounded-[34px] bg-[#171717] p-8 text-white sm:p-12 lg:p-16"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"/><div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-2xl"><p className="eyebrow text-white/40">Why ONECLICK</p><h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">A calmer way to shop the internet.</h2><p className="mt-5 leading-7 text-white/55">No clutter. No endless tabs. Just useful products, clear pricing and a storefront designed around the things you actually need.</p></div><Link href="/shop" className="btn-primary w-fit bg-white text-black">Start exploring <ArrowRight size={17}/></Link></div><div className="relative mt-12 grid gap-3 sm:grid-cols-3">{["Curated products", "Transparent pricing", "Mobile-first experience"].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-500 hover:-translate-y-1 hover:bg-white/10"><Check size={18}/><p className="mt-5 font-bold">{item}</p></div>)}</div></div></section>
  </main>;
}
