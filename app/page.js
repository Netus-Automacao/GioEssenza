import Catalog from "@/components/Catalog";
import { getCatalog } from "@/lib/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  const d = await getCatalog();
  return <Catalog {...d} />;
}
