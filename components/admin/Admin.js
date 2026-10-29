"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { withDefaults } from "@/lib/data";
import { TabGeral, TabIdentidade, TabBanner, TabCores, TabHorarios, TabEntrega, TabSobre, TabPoliticas } from "./SettingsTabs";
import Products from "./Products";

import Categories from "./Categories";

const TABS = [
  ["dashboard", "Geral"], ["loja", "Identidade da loja"], ["banner", "Banner de destaque"], ["cores", "Cores e fontes"],
  ["horarios", "Horário de funcionamento"], ["entrega", "Entrega e retirada"], ["sobre", "Sobre nós"], ["politicas", "Políticas"], ["categorias", "Categorias"], ["produtos", "Produtos"],
];
const go = (t) => window.history.pushState(null, "", `/admin/${t}`);

function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setErr("E-mail ou senha incorretos.");
    setBusy(false);
  }
  return (
    <main className="ad-login">
      <form onSubmit={go}>
        <h1>Painel Gio Essenza</h1>
        <p>Entre para gerenciar o catálogo.</p>
        <label className="ad-field"><span>E-mail</span><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="ad-field"><span>Senha</span><input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {err && <p className="ad-err">{err}</p>}
        <button className="ad-btn" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}

function Dashboard({ initialTab }) {
  const [tab, setTabState] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : "dashboard");
  const [newProduct, setNewProduct] = useState(0);
  const setTab = (t, opts = {}) => { setTabState(t); go(t); if (opts.newProduct) setNewProduct((n) => n + 1); window.scrollTo(0, 0); };
  useEffect(() => {
    const f = () => { const t = window.location.pathname.split("/")[2] || "dashboard"; if (TABS.some(([k]) => k === t)) setTabState(t); };
    window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f);
  }, []);
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [s, c, p] = await Promise.all([
      supabase.from("settings").select("data").eq("id", 1).maybeSingle(),
      supabase.from("categories").select("*").order("position"),
      supabase.from("products").select("*").order("position").order("created_at"),
    ]);
    const st = withDefaults(s.data?.data);
    setSaved(st); setDraft(st); setCats(c.data || []); setProds(p.data || []);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); } }, [toast]);

  if (!draft) return <div className="ad-loading">Carregando…</div>;
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  async function save(next = draft) {
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({ id: 1, data: next, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return setToast("Não foi possível salvar: " + error.message);
    setSaved(next); setDraft(next); setToast("Alterações salvas");
  }

  const props = { s: draft, set, save, cats, prods, setToast, setTab };
  const isSettings = !["produtos", "categorias"].includes(tab);

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">{draft.logo && <img src={draft.logo} alt="" />}<div><strong>{draft.name}</strong><span>Painel</span></div></div>
        <nav>{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</nav>
        <div className="ad-side-foot">
          <a href="/" target="_blank" rel="noreferrer">Ver catálogo</a>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </aside>
      <main className="ad-main">
        {tab === "dashboard" && <TabGeral {...props} />}
        {tab === "loja" && <TabIdentidade {...props} />}
        {tab === "banner" && <TabBanner {...props} />}
        {tab === "cores" && <TabCores {...props} />}
        {tab === "horarios" && <TabHorarios {...props} />}
        {tab === "entrega" && <TabEntrega {...props} />}
        {tab === "sobre" && <TabSobre {...props} />}
        {tab === "politicas" && <TabPoliticas {...props} />}
        {tab === "categorias" && <Categories cats={cats} setCats={setCats} prods={prods} setToast={setToast} setTab={setTab} />}
        {tab === "produtos" && <Products key={newProduct} startNew={newProduct > 0} settings={saved} cats={cats} prods={prods} setProds={setProds} setToast={setToast} setTab={setTab} />}
        {isSettings && (dirty || saving) && (
          <div className="ad-savebar">
            <span>Há alterações não salvas.</span>
            <button className="ad-btn ghost" onClick={() => setDraft(saved)} disabled={saving}>Descartar</button>
            <button className="ad-btn" onClick={() => save()} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
          </div>
        )}
      </main>
      {toast && <div className="ad-toast" role="status">{toast}</div>}
    </div>
  );
}

export default function Admin({ initialTab }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session === null && initialTab !== "login") window.history.replaceState(null, "", "/admin/login");
    if (session && window.location.pathname.startsWith("/admin/login")) window.history.replaceState(null, "", "/admin/dashboard");
  }, [session]);
  if (session === undefined) return <div className="ad-loading">Carregando…</div>;
  return session ? <Dashboard initialTab={initialTab === "login" ? "dashboard" : initialTab} /> : <Login />;
}
