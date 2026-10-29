import { createClient } from "@supabase/supabase-js";
import { withDefaults } from "./data";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

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
  return { settings, categories: cats.data || [], products: prods.data || [] };
}
export async function getProduct(id) {
  const { data } = await db().from("products").select("*").eq("id", id).eq("active", true).maybeSingle();
  return data;
}
