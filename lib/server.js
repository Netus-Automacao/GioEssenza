import { createClient } from "@supabase/supabase-js";
import { withDefaults } from "./data";

// cache: "no-store" → o Next.js não guarda cópia antiga dos dados; o site sempre mostra o que foi salvo no painel
const noStore = (url, opts = {}) => fetch(url, { ...opts, cache: "no-store" });
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: { fetch: noStore },
});

export async function getSettings() {
  const { data } = await db().from("settings").select("data").eq("id", 1).maybeSingle();
  return withDefaults(data?.data);
}
export async function getCatalog() {
  const c = db();
  const [settings, cats, prods] = await Promise.all([
    getSettings(),
    c.from("categories").select("*").order("position"),
    c.from("products").select("*").eq("active", true).order("position").order("created_at"),
  ]);
  const categories = (cats.data || []).filter((x) => x.active !== false);
  const ok = new Set(categories.map((x) => x.id));
  // produto aparece se estiver ativo e a categoria (quando houver) também estiver ativa
  const products = (prods.data || []).filter((p) => !p.category_id || ok.has(p.category_id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base", numeric: true })); // ordem alfabética
  return { settings, categories, products };
}
export async function getProduct(id) {
  const c = db();
  const { data } = await c.from("products").select("*").eq("id", id).eq("active", true).maybeSingle();
  if (!data) return null;
  if (data.category_id) {
    const { data: cat } = await c.from("categories").select("name, active").eq("id", data.category_id).maybeSingle();
    if (cat && cat.active === false) return null;
    data.category_name = cat?.name || "";
  }
  return data;
}
