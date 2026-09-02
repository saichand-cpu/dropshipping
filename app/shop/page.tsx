import { ShopBrowser } from "@/components/shop-browser";

export const metadata = { title: "Shop — NEXORA" };

export default function ShopPage() {
  return <main className="container-shop py-12 sm:py-16"><div className="max-w-2xl"><p className="eyebrow">The collection</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Find your next favourite.</h1><p className="mt-4 leading-7 text-neutral-500">Browse our curated selection and filter by what matters to you.</p></div><div className="mt-10"><ShopBrowser /></div></main>;
}
