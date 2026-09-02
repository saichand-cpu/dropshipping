import { redirect } from "next/navigation";

export default function LegacyProductRoute({ params }: { params: { slug: string } }) {
  redirect(`/products/${params.slug}`);
}
