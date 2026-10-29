import { notFound } from "next/navigation";
import ProductView from "@/components/ProductView";
import { getProduct, getSettings } from "@/lib/server";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getProduct(params.id);
  return p ? { title: p.name, openGraph: { title: p.name, images: p.photos?.slice(0, 1) || [] } } : {};
}
export default async function Page({ params }) {
  const [settings, product] = await Promise.all([getSettings(), getProduct(params.id)]);
  if (!product || !settings.active) notFound();
  return <ProductView settings={settings} product={product} />;
}
