"use client";
import { useEffect, useRef, useState } from "react";
import { supabase, uploadArtFile, removeStored } from "@/lib/supabase";
import { DEFAULT_MOCKUPS, DEFAULT_ADJUST, loadImage, renderMockup, toBlob, thumbOf } from "@/lib/mockup";
import { Toggle, Field, Card } from "./ui";

const typeOf = (settings, id) => (settings.mockups || DEFAULT_MOCKUPS).find((t) => t.id === id) || null;

// gera mockup + miniatura a partir da arte (arquivo novo ou URL já salva)
// webp guarda a transparência do fundo (jpg não guarda)
async function makeAssets(src, type, adjust, bg) {
  const img = await loadImage(src);
  const canvas = renderMockup(img, type, adjust, bg);
  const [mock, thumb] = await Promise.all([toBlob(canvas, "image/webp", 0.92), thumbOf(canvas)]);
  const [mockup, th] = await Promise.all([uploadArtFile(mock, "mockups", mock.type === "image/webp" ? "webp" : "png"), uploadArtFile(thumb, "miniaturas", thumb.type === "image/webp" ? "webp" : "jpg")]);
  return { mockup, thumb: th };
}

export default function Arts({ settings, saveSettings, setToast }) {
  const [gals, setGals] = useState(null);
  const [counts, setCounts] = useState({});
  const [open, setOpen] = useState(null);
  const [missing, setMissing] = useState(false);
  const arts = settings.arts || {};
  const types = settings.mockups || DEFAULT_MOCKUPS;
  const bg = arts.bg || null;

  async function load() {
    const { data, error } = await supabase.from("art_galleries").select("*").order("position").order("created_at");
    if (error) { setMissing(true); setGals([]); return; }
    setGals(data);
    const { data: it } = await supabase.from("art_items").select("gallery_id");
    const c = {}; (it || []).forEach((x) => { c[x.gallery_id] = (c[x.gallery_id] || 0) + 1; }); setCounts(c);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const { data, error } = await supabase.from("art_galleries").insert({ title: "Nova galeria", position: (gals?.length || 0), mockup: "" }).select().single();
    if (error) return setToast(error.message);
    setGals([...gals, data]); setOpen(data);
  }
  async function patch(g, fields, msg) {
    const { data, error } = await supabase.from("art_galleries").update(fields).eq("id", g.id).select().single();
    if (error) return setToast(error.message);
    setGals(gals.map((x) => (x.id === g.id ? data : x))); if (msg) setToast(msg);
  }
  async function move(i, d) {
    const j = i + d; if (j < 0 || j >= gals.length) return;
    const n = [...gals]; [n[i], n[j]] = [n[j], n[i]]; setGals(n);
    await Promise.all(n.map((g, k) => supabase.from("art_galleries").update({ position: k }).eq("id", g.id)));
  }
  async function del(g) {
    if (!confirm(`Excluir a galeria “${g.title}” e todas as artes dela?`)) return;
    const { data: it } = await supabase.from("art_items").select("original,mockup,thumb").eq("gallery_id", g.id);
    await supabase.from("art_galleries").delete().eq("id", g.id);
    removeStored((it || []).flatMap((x) => [x.original, x.mockup, x.thumb]));
    setGals(gals.filter((x) => x.id !== g.id)); setToast("Galeria excluída");
  }

  if (open) return <GalleryEditor g={open} types={types} bg={bg} setToast={setToast} onBack={() => { setOpen(null); load(); }} onSaved={(d) => setGals(gals.map((x) => (x.id === d.id ? d : x)))} />;

  return (
    <>
      <h1 className="ad-h1">Artes disponíveis</h1>
      {missing && <p className="ad-alert"><strong>Falta preparar o banco de dados.</strong> Rode o arquivo <b>supabase/migration_artes.sql</b> no Supabase → SQL Editor e recarregue esta página.</p>}
      <Card title="No catálogo" desc="A aba aparece junto das categorias. Só galerias publicadas ficam visíveis para os clientes.">
        <Toggle label="Mostrar “Artes disponíveis” no catálogo" checked={!!arts.enabled} onChange={(v) => saveSettings({ ...settings, arts: { ...arts, enabled: v } })} />
        <Field label="Nome da aba"><input defaultValue={arts.title || "Artes disponíveis"} maxLength={40} onBlur={(e) => e.target.value !== arts.title && saveSettings({ ...settings, arts: { ...arts, title: e.target.value || "Artes disponíveis" } })} /></Field>
      </Card>
      <Card title="Galerias" aside={<button className="ad-btn" onClick={create} disabled={missing}>+ Nova galeria</button>}>
        {gals === null ? <p className="ad-muted">Carregando…</p> : gals.length === 0 ? <p className="ad-muted">Nenhuma galeria ainda.</p> : (
          <ul className="ad-plist">
            {gals.map((g, i) => (
              <li key={g.id} className={g.published ? "" : "inactive"}>
                <div className="ad-pinfo">
                  <strong>{g.title}{g.published ? <span className="ad-pill star">Publicada</span> : <span className="ad-pill">Oculta</span>}</strong>
                  <span className="ad-muted">{counts[g.id] || 0} arte(s) — {typeOf(settings, g.mockup)?.name || "sem mockup"}</span>
                </div>
                <div className="ad-pactions">
                  <button className="ad-btn ghost sm" onClick={() => setOpen(g)}>Editar</button>
                  <button className="ad-btn ghost sm" onClick={() => patch(g, { published: !g.published }, g.published ? "Galeria ocultada" : "Galeria publicada")}>{g.published ? "Ocultar" : "Publicar"}</button>
                  <button className="ad-btn ghost sm" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className="ad-btn ghost sm" disabled={i === gals.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button className="ad-btn ghost sm danger" onClick={() => del(g)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <MockupBg bg={bg} save={(b) => saveSettings({ ...settings, arts: { ...arts, bg: b } })} />
      <MockupTypes types={types} save={(mockups) => saveSettings({ ...settings, mockups })} />
    </>
  );
}

function MockupBg({ bg, save }) {
  const [color, setColor] = useState(bg?.color || "#FFFFFF");
  const [op, setOp] = useState(bg?.opacity ?? 1);
  const dirty = color !== (bg?.color || "#FFFFFF") || op !== (bg?.opacity ?? 1);
  return (
    <Card title="Fundo dos mockups" desc="Escolha a cor que mais destaca as artes. Vale para os mockups gerados depois; nas galerias antigas use “Gerar mockups de novo”.">
      <div className="ad-row" style={{ alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div className="ad-bgprev"><span style={{ background: color, opacity: op }} /><b>Arte</b></div>
        <label className="ad-field" style={{ margin: 0 }}><span>Cor do fundo</span>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} style={{ width: 48, height: 40, padding: 0, border: 0, background: "none" }} />
            <input value={color} maxLength={7} style={{ width: 100 }} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setColor(e.target.value.toUpperCase())} />
          </div>
        </label>
      </div>
      <label className="ad-field"><span>Transparência do fundo: {Math.round((1 - op) * 100)}%</span>
        <input type="range" min="0" max="1" step="0.05" value={1 - op} onChange={(e) => setOp(Math.round((1 - Number(e.target.value)) * 100) / 100)} />
        <em>0% = cor sólida · 100% = fundo transparente (aparece a cor do catálogo por trás).</em>
      </label>
      <div className="ad-row">
        <button className="ad-btn ghost" onClick={() => { setColor("#FFFFFF"); setOp(1); }}>Voltar ao branco</button>
        {dirty && <button className="ad-btn" onClick={() => save({ color: /^#[0-9A-F]{6}$/.test(color) ? color : "#FFFFFF", opacity: op })}>Salvar fundo</button>}
      </div>
    </Card>
  );
}

function MockupTypes({ types, save }) {
  const [list, setList] = useState(types);
  const [dirty, setDirty] = useState(false);
  const up = (i, patch) => { setList(list.map((t, j) => (j === i ? { ...t, ...patch } : t))); setDirty(true); };
  return (
    <Card title="Tipos de produto (mockups)" desc="Medidas da área de estampa em centímetros. Mudar as medidas vale para as artes geradas depois; use “Gerar mockups de novo” na galeria para atualizar as antigas.">
      {list.map((t, i) => (
        <div key={t.id} className="ad-review">
          <div className="ad-grid2">
            <Field label="Nome"><input value={t.name} onChange={(e) => up(i, { name: e.target.value })} /></Field>
            <Field label="Modelo visual">
              <select value={t.kind} onChange={(e) => up(i, { kind: e.target.value })}>
                <option value="mug">Caneca (estampa em volta)</option>
                <option value="book">Capa (agenda, planner, bloco, caderno…)</option>
              </select>
            </Field>
            <Field label="Largura (cm)"><input type="number" inputMode="decimal" step="0.1" min="0" value={t.w} onChange={(e) => up(i, { w: e.target.value })} /></Field>
            <Field label="Altura (cm)"><input type="number" inputMode="decimal" step="0.1" min="0" value={t.h} onChange={(e) => up(i, { h: e.target.value })} /></Field>
          </div>
          {t.kind === "book" && <Toggle label="Mostrar wire-o (espiral)" checked={!!t.spiral} onChange={(v) => up(i, { spiral: v })} />}
          {t.kind === "book" && t.spiral && (
            <div className="ad-grid2">
              <Field label="Quantidade de anéis"><input type="number" min="1" max="60" value={t.rings ?? (t.side === "top" ? 6 : 15)} onChange={(e) => up(i, { rings: e.target.value })} /></Field>
              <Field label="Posição do wire-o">
                <select value={t.side || (t.w > t.h ? "top" : "left")} onChange={(e) => up(i, { side: e.target.value })}>
                  <option value="left">Na lateral (como agenda)</option>
                  <option value="top">No topo (como bloquinho)</option>
                </select>
              </Field>
            </div>
          )}
          <button className="ad-btn ghost sm danger" onClick={() => { if (confirm("Remover este tipo de produto?")) { setList(list.filter((_, j) => j !== i)); setDirty(true); } }}>Remover tipo</button>
        </div>
      ))}
      <div className="ad-row">
        <button className="ad-btn ghost" onClick={() => { setList([...list, { id: `t${Date.now()}`, name: "Novo produto", kind: "book", w: 15, h: 21, spiral: true, rings: 15, side: "left" }]); setDirty(true); }}>+ Novo tipo de produto</button>
        {dirty && <button className="ad-btn" onClick={async () => {
          // só confere os números ao salvar, para poder apagar e digitar à vontade
          const num = (v) => Number(String(v).replace(",", "."));
          const sideOf = (t) => t.side || (num(t.w) > num(t.h) ? "top" : "left");
          const ringsOf = (t) => (t.rings === undefined || t.rings === null ? (sideOf(t) === "top" ? 6 : 15) : Math.round(num(t.rings)));
          const bad = list.find((t) => !(num(t.w) > 0) || !(num(t.h) > 0) || (t.kind === "book" && t.spiral && !(ringsOf(t) >= 1)));
          if (bad) return alert(`Confira as medidas e a quantidade de anéis de “${bad.name}”.`);
          const clean = list.map((t) => (t.kind === "book" ? { ...t, w: num(t.w), h: num(t.h), rings: ringsOf(t), side: sideOf(t) } : { ...t, w: num(t.w), h: num(t.h) }));
          setList(clean); await save(clean); setDirty(false);
        }}>Salvar tipos</button>}
      </div>
    </Card>
  );
}

function GalleryEditor({ g, types, bg, setToast, onBack, onSaved }) {
  const [form, setForm] = useState(g);
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState("");
  const [adjusting, setAdjusting] = useState(null);
  const [preview, setPreview] = useState(false);
  const replaceFor = useRef(null);
  const replaceInput = useRef(null);
  const type = types.find((t) => t.id === form.mockup) || null;

  useEffect(() => { (async () => {
    const { data } = await supabase.from("art_items").select("*").eq("gallery_id", g.id).order("position").order("created_at");
    setItems(data || []);
  })(); }, [g.id]);

  async function saveInfo(extra = {}) {
    const fields = { title: form.title.trim() || "Galeria", description: form.description, note: form.note, mockup: form.mockup, published: form.published, ...extra };
    const { data, error } = await supabase.from("art_galleries").update(fields).eq("id", g.id).select().single();
    if (error) return setToast(error.message);
    setForm(data); onSaved(data); setToast("Galeria salva");
    if (fields.mockup !== g.mockup && items?.length && confirm("O tipo de produto mudou. Gerar os mockups de todas as artes de novo agora?")) regenAll(data.mockup);
  }

  async function addFiles(e) {
    const files = [...e.target.files]; e.target.value = "";
    let pos = items.length; const added = [];
    for (let k = 0; k < files.length; k++) {
      setBusy(`Gerando mockup ${k + 1} de ${files.length}…`);
      try {
        const f = files[k];
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error(`${f.name}: use JPG, PNG ou WebP.`);
        const original = await uploadArtFile(f, "originais");
        const { mockup, thumb } = await makeAssets(f, type, DEFAULT_ADJUST, bg);
        const { data, error } = await supabase.from("art_items").insert({ gallery_id: g.id, original, mockup, thumb, adjust: DEFAULT_ADJUST, position: pos++ }).select().single();
        if (error) throw error;
        added.push(data); setItems((x) => [...x, data]);
      } catch (err) { setToast(err.message); }
    }
    setBusy(""); if (added.length) setToast(`${added.length} arte(s) adicionada(s)`);
  }

  async function regen(item, adjust, newOriginal) {
    const original = newOriginal ? await uploadArtFile(newOriginal, "originais") : item.original;
    const { mockup, thumb } = await makeAssets(newOriginal || item.original, type, adjust, bg);
    const { data, error } = await supabase.from("art_items").update({ original, mockup, thumb, adjust }).eq("id", item.id).select().single();
    if (error) throw error;
    removeStored([item.mockup, item.thumb, newOriginal ? item.original : null]);
    setItems((x) => x.map((i) => (i.id === item.id ? data : i)));
  }
  async function regenAll(mockId) {
    const t = types.find((x) => x.id === mockId) || null;
    for (let k = 0; k < items.length; k++) {
      setBusy(`Gerando mockup ${k + 1} de ${items.length}…`);
      const it = items[k];
      try {
        const { mockup, thumb } = await makeAssets(it.original, t, it.adjust, bg);
        const { data } = await supabase.from("art_items").update({ mockup, thumb }).eq("id", it.id).select().single();
        removeStored([it.mockup, it.thumb]);
        setItems((x) => x.map((i) => (i.id === it.id ? data : i)));
      } catch (err) { setToast(err.message); }
    }
    setBusy(""); setToast("Mockups atualizados");
  }
  async function move(i, d) {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n);
    await Promise.all([supabase.from("art_items").update({ position: i }).eq("id", n[i].id), supabase.from("art_items").update({ position: j }).eq("id", n[j].id)]);
  }
  async function del(it) {
    if (!confirm("Excluir esta arte?")) return;
    await supabase.from("art_items").delete().eq("id", it.id);
    removeStored([it.original, it.mockup, it.thumb]);
    setItems(items.filter((x) => x.id !== it.id));
  }

  return (
    <>
      <div className="ad-titlebar">
        <h1 className="ad-h1">{form.title}</h1>
        <button className="ad-btn ghost" onClick={onBack}>← Voltar às galerias</button>
      </div>
      <Card title="Informações da galeria">
        <Field label="Título"><input value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Descrição (opcional)"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Observação para o cliente" hint="Aparece em destaque na galeria. Ex.: escolha seu modelo, tire um print e envie pelo WhatsApp.">
          <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        <Field label="Tipo de produto (mockup)">
          <select value={form.mockup} onChange={(e) => setForm({ ...form, mockup: e.target.value })}>
            <option value="">Sem mockup (mostrar só a arte)</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.w} × {t.h} cm</option>)}
          </select>
        </Field>
        <Toggle label="Publicada (visível no catálogo)" checked={form.published} onChange={(v) => setForm({ ...form, published: v })} />
        <div className="ad-row end">
          <button className="ad-btn ghost" onClick={() => setPreview(true)} disabled={!items?.length}>Pré-visualizar</button>
          <button className="ad-btn" onClick={() => saveInfo()}>Salvar galeria</button>
        </div>
      </Card>
      <Card title={`Artes${items ? ` (${items.length})` : ""}`} desc="Envie quantas quiser, várias de uma vez. A arte original é guardada sem nenhuma alteração; o mockup é gerado automaticamente."
        aside={<label className="ad-btn" style={{ cursor: busy ? "wait" : "pointer" }}>{busy || "+ Adicionar artes"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={!!busy || !items} onChange={addFiles} /></label>}>
        {busy && <p className="ad-note">{busy} Não feche esta página.</p>}
        {items === null ? <p className="ad-muted">Carregando…</p> : items.length === 0 ? <p className="ad-muted">Nenhuma arte ainda.</p> : (
          <>
            {items.length > 0 && <button className="ad-btn ghost sm" disabled={!!busy} onClick={() => confirm("Gerar de novo os mockups de todas as artes desta galeria?") && regenAll(form.mockup)}>Gerar mockups de novo</button>}
            <div className="ad-arts">
              {items.map((it, i) => (
                <div key={it.id} className="ad-art">
                  <img src={it.thumb || it.mockup || it.original} alt="" loading="lazy" />
                  <span className="ad-muted">Modelo {String(i + 1).padStart(2, "0")}</span>
                  <div className="ad-art-actions">
                    <button className="ad-btn ghost sm" onClick={() => setAdjusting(it)} disabled={!!busy}>Ajustar</button>
                    <button className="ad-btn ghost sm" disabled={!!busy} onClick={() => { replaceFor.current = it; replaceInput.current.click(); }}>Substituir</button>
                    <button className="ad-btn ghost sm" disabled={i === 0} onClick={() => move(i, -1)}>←</button>
                    <button className="ad-btn ghost sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}>→</button>
                    <a className="ad-btn ghost sm" href={it.original} target="_blank" rel="noreferrer">Original</a>
                    <button className="ad-btn ghost sm danger" onClick={() => del(it)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <input ref={replaceInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ""; const it = replaceFor.current; if (!f || !it) return;
          setBusy("Substituindo arte…"); try { await regen(it, it.adjust, f); setToast("Arte substituída"); } catch (err) { setToast(err.message); } setBusy("");
        }} />
      </Card>
      {adjusting && <Adjuster item={adjusting} type={type} bg={bg} onClose={() => setAdjusting(null)}
        onSave={async (adj) => { setBusy("Gerando mockup…"); try { await regen(adjusting, adj); setToast("Mockup atualizado"); setAdjusting(null); } catch (err) { setToast(err.message); } setBusy(""); }} />}
      {preview && (
        <div className="ad-modal crop" role="dialog" aria-label="Pré-visualização">
          <div className="crop-panel" style={{ maxWidth: 900, width: "100%" }}>
            <h2>{form.title}</h2>
            {form.description && <p className="ad-muted">{form.description}</p>}
            {form.note && <p className="ad-note">{form.note}</p>}
            <div className="art-grid">{items.map((it, i) => <figure key={it.id}><img src={it.thumb || it.mockup} alt="" loading="lazy" /><figcaption>Modelo {String(i + 1).padStart(2, "0")}</figcaption></figure>)}</div>
            <div className="ad-row end"><button className="ad-btn" onClick={() => setPreview(false)}>Fechar</button></div>
          </div>
        </div>
      )}
    </>
  );
}

function Adjuster({ item, type, bg, onClose, onSave }) {
  const [a, setA] = useState({ ...DEFAULT_ADJUST, ...(item.adjust || {}) });
  const [img, setImg] = useState(null);
  const box = useRef(null);
  useEffect(() => { loadImage(item.original).then(setImg).catch(() => {}); }, [item.original]);
  useEffect(() => {
    if (!img || !box.current) return;
    const c = renderMockup(img, type, a, bg);
    c.style.width = "100%"; c.style.height = "auto"; c.style.borderRadius = "12px";
    box.current.replaceChildren(c);
  }, [img, a, type, bg]);
  const slider = (k, label, min, max, step, fmt) => (
    <label className="ad-field"><span>{label}: {fmt(a[k])}</span>
      <input type="range" min={min} max={max} step={step} value={a[k]} onChange={(e) => setA({ ...a, [k]: Number(e.target.value) })} />
    </label>
  );
  return (
    <div className="ad-modal crop" role="dialog" aria-label="Ajustar arte">
      <div className="crop-panel" style={{ maxWidth: 560, width: "100%" }}>
        <h2>Ajustar aplicação</h2>
        <div ref={box} style={{ minHeight: 200 }}>{!img && <p className="ad-muted">Carregando arte…</p>}</div>
        {slider("scale", "Tamanho", 0.3, 2.5, 0.01, (v) => `${Math.round(v * 100)}%`)}
        {slider("x", "Posição horizontal", -0.5, 0.5, 0.005, (v) => `${Math.round(v * 100)}`)}
        {slider("y", "Posição vertical", -0.5, 0.5, 0.005, (v) => `${Math.round(v * 100)}`)}
        <label className="ad-field"><span>Enquadramento</span>
          <select value={a.fit} onChange={(e) => setA({ ...a, fit: e.target.value })}>
            <option value="cover">Preencher a área toda</option>
            <option value="contain">Mostrar a arte inteira</option>
          </select>
        </label>
        <div className="ad-row end">
          <button className="ad-btn ghost" onClick={() => setA({ ...DEFAULT_ADJUST })}>Restaurar</button>
          <button className="ad-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="ad-btn" onClick={() => onSave(a)} disabled={!img}>Salvar e gerar mockup</button>
        </div>
      </div>
    </div>
  );
}
