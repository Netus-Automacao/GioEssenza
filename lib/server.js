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

// Artes disponíveis (somente galerias publicadas — garantido também pelas regras do banco)
export const ART_PAGE = 24;
export async function getArtGalleries() {
  const c = db();
  const { data, error } = await c.from("art_galleries").select("id,title,description,position").eq("published", true).order("position").order("created_at");
  if (error || !data?.length) return [];
  const { data: items } = await c.from("art_items").select("gallery_id,thumb,position").in("gallery_id", data.map((g) => g.id)).order("position");
  return data.map((g) => {
    const mine = (items || []).filter((i) => i.gallery_id === g.id);
    return { ...g, count: mine.length, covers: mine.slice(0, 4).map((i) => i.thumb) };
  });
}
export async function getArtGallery(id) {
  const c = db();
  const { data: g } = await c.from("art_galleries").select("*").eq("id", id).eq("published", true).maybeSingle();
  if (!g) return null;
  const { data: items, count } = await c.from("art_items").select("id,thumb,mockup", { count: "exact" }).eq("gallery_id", id).order("position").order("created_at").range(0, ART_PAGE - 1);
  return { ...g, items: items || [], total: count || 0 };
}
