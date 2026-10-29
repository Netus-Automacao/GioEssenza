import CartView from "@/components/CartView";
import { getSettings } from "@/lib/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Carrinho" };
export default async function Page() {
  return <CartView settings={await getSettings()} />;
}
