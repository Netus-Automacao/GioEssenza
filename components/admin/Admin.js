"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { withDefaults } from "@/lib/data";
import { TabGeral, TabIdentidade, TabBanner, TabCores, TabHorarios, TabEntrega } from "./SettingsTabs";
import Products from "./Products";

const TABS = [
  ["geral", "Geral"], ["identidade", "Identidade da loja"], ["banner", "Banner de destaque"], ["cores", "Cores"],
  ["horarios", "Horário de funcionamento"], ["entrega", "Entrega e retirada"], ["produtos", "Produtos"],
];

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

function Dashboard() {
  const [tab, setTab] = useState("geral");
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

  const props = { s: draft, set, save, cats, prods, setToast };
  const isSettings = tab !== "produtos";

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
        {tab === "geral" && <TabGeral {...props} />}
        {tab === "identidade" && <TabIdentidade {...props} />}
        {tab === "banner" && <TabBanner {...props} />}
        {tab === "cores" && <TabCores {...props} />}
        {tab === "horarios" && <TabHorarios {...props} />}
        {tab === "entrega" && <TabEntrega {...props} />}
        {tab === "produtos" && <Products cats={cats} setCats={setCats} prods={prods} setProds={setProds} setToast={setToast} />}
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

export default function Admin() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <div className="ad-loading">Carregando…</div>;
  return session ? <Dashboard /> : <Login />;
}
