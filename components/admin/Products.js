"use client";
import { useRef, useState } from "react";
import { supabase, uploadImage } from "@/lib/supabase";
import { brl, hasPromo } from "@/lib/data";
import { Toggle, Field, Card } from "./ui";

const EMPTY = { name: "", category_id: "", description: "", photos: [], price: "", promo_price: "", featured: false, active: true, stock_enabled: false, stock: 0, variations: [], options: [] };
const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

/* ---------------- Categorias ---------------- */
function Categories({ cats, setCats, prods, setToast }) {
  const [name, setName] = useState("");
  async function add(e) {
    e.preventDefault(); if (!name.trim()) return;
    const { data, error } = await supabase.from("categories").insert({ name: name.trim(), position: cats.length }).select().single();
    if (error) return setToast(error.message);
    setCats([...cats, data]); setName("");
  }
  async function rename(c, v) {
    if (!v.trim() || v === c.name) return;
    await supabase.from("categories").update({ name: v.trim() }).eq("id", c.id);
    setCats(cats.map((x) => (x.id === c.id ? { ...x, name: v.trim() } : x)));
  }
  async function reorder(i, d) {
    const next = move(cats, i, d).map((c, k) => ({ ...c, position: k }));
    setCats(next);
    await Promise.all(next.map((c) => supabase.from("categories").update({ position: c.position }).eq("id", c.id)));
  }
  async function del(c) {
    const n = prods.filter((p) => p.category_id === c.id).length;
    if (!confirm(n ? `${n} produto(s) ficarão sem categoria. Excluir “${c.name}”?` : `Excluir “${c.name}”?`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    setCats(cats.filter((x) => x.id !== c.id));
  }
  return (
    <Card title="Categorias" desc="A ordem aqui é a ordem dos filtros no catálogo.">
      <ul className="ad-cats">
        {cats.map((c, i) => (
          <li key={c.id}>
            <input defaultValue={c.name} onBlur={(e) => rename(c, e.target.value)} aria-label="Nome da categoria" />
            <span className="ad-muted">{prods.filter((p) => p.category_id === c.id).length} produtos</span>
            <button className="ad-icon" onClick={() => reorder(i, -1)} aria-label="Subir">↑</button>
            <button className="ad-icon" onClick={() => reorder(i, 1)} aria-label="Descer">↓</button>
            <button className="ad-icon danger" onClick={() => del(c)} aria-label="Excluir">✕</button>
          </li>
        ))}
      </ul>
      <form className="ad-row" onSubmit={add}>
        <input className="ad-input" placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="ad-btn">Adicionar categoria</button>
      </form>
    </Card>
  );
}

/* ---------------- Fotos ---------------- */
function Photos({ photos, onChange }) {
  const add = useRef(); const rep = useRef(); const [repIdx, setRepIdx] = useState(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function upload(files, idx = null) {
    setBusy(true); setErr("");
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadImage(f));
      if (idx === null) onChange([...photos, ...urls]);
      else onChange(photos.map((u, i) => (i === idx ? urls[0] : u)));
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <div>
      <div className="ad-photos">
        {photos.map((u, i) => (
          <figure key={u + i}>
            <img src={u} alt="" />
            {i === 0 && <span className="ad-main-tag">Principal</span>}
            <figcaption>
              <button type="button" onClick={() => onChange(move(photos, i, -1))} aria-label="Mover para a esquerda">←</button>
              <button type="button" onClick={() => onChange(move(photos, i, 1))} aria-label="Mover para a direita">→</button>
              <button type="button" onClick={() => { setRepIdx(i); rep.current.click(); }}>Trocar</button>
              <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label="Excluir">✕</button>
            </figcaption>
          </figure>
        ))}
        <button type="button" className="ad-photo-add" onClick={() => add.current.click()} disabled={busy}>{busy ? "Enviando…" : "+ Adicionar fotos"}</button>
      </div>
      <small className="ad-muted">A primeira foto é a principal. Use as setas para mudar a ordem.</small>
      {err && <p className="ad-err">{err}</p>}
      <input ref={add} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { upload([...e.target.files]); e.target.value = ""; }} />
      <input ref={rep} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { if (e.target.files[0]) upload([e.target.files[0]], repIdx); e.target.value = ""; }} />
    </div>
  );
}

/* ---------------- Variações ---------------- */
function Variations({ value, onChange, photos, stockOn }) {
  const setG = (gi, patch) => onChange(value.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setV = (gi, vi, patch) => setG(gi, { values: value[gi].values.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });
  return (
    <div className="ad-groups">
      {value.map((g, gi) => (
        <div key={gi} className="ad-group">
          <div className="ad-row">
            <input className="ad-input grow" placeholder="Nome do grupo (ex.: Cor, Miolo, Tamanho)" value={g.name} onChange={(e) => setG(gi, { name: e.target.value })} />
            <button type="button" className="ad-icon danger" onClick={() => onChange(value.filter((_, i) => i !== gi))} aria-label="Excluir grupo">✕</button>
          </div>
          <div className="ad-vtable">
            <div className="ad-vhead"><span>Opção</span><span>Preço (vazio = padrão)</span>{stockOn && <span>Estoque</span>}<span>Foto</span><span>Disponível</span><span /></div>
            {g.values.map((v, vi) => (
              <div key={vi} className="ad-vrow">
                <input placeholder="Ex.: Verde" value={v.label} onChange={(e) => setV(gi, vi, { label: e.target.value })} />
                <input type="number" min="0" step="0.01" value={v.price ?? ""} onChange={(e) => setV(gi, vi, { price: e.target.value })} />
                {stockOn && <input type="number" min="0" step="1" placeholder="—" value={v.stock ?? ""} onChange={(e) => setV(gi, vi, { stock: e.target.value })} />}
                <select value={v.photo || ""} onChange={(e) => setV(gi, vi, { photo: e.target.value })}>
                  <option value="">Nenhuma</option>
                  {photos.map((u, i) => <option key={u} value={u}>Foto {i + 1}</option>)}
                </select>
                <input type="checkbox" checked={v.available !== false} onChange={(e) => setV(gi, vi, { available: e.target.checked })} aria-label="Disponível" />
                <button type="button" className="ad-icon danger" onClick={() => setG(gi, { values: g.values.filter((_, i) => i !== vi) })} aria-label="Excluir opção">✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="ad-link" onClick={() => setG(gi, { values: [...g.values, { label: "", price: "", stock: "", photo: "", available: true }] })}>+ Adicionar opção</button>
        </div>
      ))}
      <button type="button" className="ad-btn ghost" onClick={() => onChange([...value, { name: "", values: [{ label: "", price: "", stock: "", photo: "", available: true }] }])}>+ Novo grupo de variação</button>
    </div>
  );
}

/* ---------------- Opções adicionais ---------------- */
function Options({ value, onChange }) {
  const setG = (gi, patch) => onChange(value.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setC = (gi, ci, patch) => setG(gi, { choices: value[gi].choices.map((c, i) => (i === ci ? { ...c, ...patch } : c)) });
  return (
    <div className="ad-groups">
      {value.map((g, gi) => (
        <div key={gi} className="ad-group">
          <div className="ad-row">
            <input className="ad-input grow" placeholder="Nome (ex.: Embalagem, Personalização)" value={g.name} onChange={(e) => setG(gi, { name: e.target.value })} />
            <button type="button" className="ad-icon danger" onClick={() => onChange(value.filter((_, i) => i !== gi))} aria-label="Excluir grupo">✕</button>
          </div>
          <div className="ad-row">
            <label className="ad-check"><input type="checkbox" checked={g.required} onChange={(e) => setG(gi, { required: e.target.checked })} /> Escolha obrigatória</label>
            <label className="ad-check"><input type="checkbox" checked={g.multiple} onChange={(e) => setG(gi, { multiple: e.target.checked })} /> Permitir mais de uma</label>
          </div>
          <div className="ad-vtable">
            <div className="ad-vhead opt"><span>Alternativa</span><span>Acréscimo (R$)</span><span>Cliente digita texto</span><span /></div>
            {g.choices.map((c, ci) => (
              <div key={ci} className="ad-vrow opt">
                <input placeholder="Ex.: Com nome personalizado" value={c.label} onChange={(e) => setC(gi, ci, { label: e.target.value })} />
                <input type="number" min="0" step="0.01" value={c.extra ?? ""} onChange={(e) => setC(gi, ci, { extra: e.target.value })} />
                <input type="checkbox" checked={!!c.input} onChange={(e) => setC(gi, ci, { input: e.target.checked })} aria-label="Cliente digita texto" />
                <button type="button" className="ad-icon danger" onClick={() => setG(gi, { choices: g.choices.filter((_, i) => i !== ci) })} aria-label="Excluir">✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="ad-link" onClick={() => setG(gi, { choices: [...g.choices, { label: "", extra: "", input: false }] })}>+ Adicionar alternativa</button>
        </div>
      ))}
      <button type="button" className="ad-btn ghost" onClick={() => onChange([...value, { name: "", required: false, multiple: false, choices: [{ label: "", extra: "", input: false }] }])}>+ Novo grupo de opções</button>
    </div>
  );
}

/* ---------------- Formulário ---------------- */
function Editor({ initial, cats, onClose, onSaved }) {
  const [p, setP] = useState({ ...EMPTY, ...initial, price: initial.price ?? "", promo_price: initial.promo_price ?? "", category_id: initial.category_id || "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));

  async function submit(e) {
    e.preventDefault();
    const price = Number(p.price);
    const promo = p.promo_price === "" || p.promo_price === null ? null : Number(p.promo_price);
    if (!p.name.trim()) return setErr("Informe o nome do produto.");
    if (p.price === "" || !isFinite(price) || price < 0) return setErr("Informe um preço normal válido (zero ou maior).");
    if (promo !== null && (!isFinite(promo) || promo < 0 || promo >= price)) return setErr("O preço promocional precisa ser menor que o preço normal.");
    const variations = p.variations.filter((g) => g.name.trim()).map((g) => ({ ...g, name: g.name.trim(), values: g.values.filter((v) => v.label.trim()) })).filter((g) => g.values.length);
    if (variations.some((g) => g.values.some((v) => v.price !== "" && v.price != null && Number(v.price) < 0))) return setErr("Preços de variações não podem ser negativos.");
    const options = p.options.filter((g) => g.name.trim()).map((g) => ({ ...g, name: g.name.trim(), choices: g.choices.filter((c) => c.label.trim()) })).filter((g) => g.choices.length);
    const row = {
      name: p.name.trim(), category_id: p.category_id || null, description: p.description, photos: p.photos,
      price, promo_price: promo, featured: p.featured, active: p.active,
      stock_enabled: p.stock_enabled, stock: Math.max(0, parseInt(p.stock) || 0), variations, options,
    };
    setBusy(true); setErr("");
    const q = p.id ? supabase.from("products").update(row).eq("id", p.id) : supabase.from("products").insert({ ...row, position: Date.now() % 1e9 });
    const { data, error } = await q.select().single();
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved(data);
  }

  return (
    <form className="ad-editor" onSubmit={submit}>
      <div className="ad-editor-head">
        <button type="button" className="ad-link" onClick={onClose}>← Voltar para a lista</button>
        <h1 className="ad-h1">{p.id ? "Editar produto" : "Novo produto"}</h1>
      </div>
      <Card title="Informações principais">
        <Field label="Nome do produto"><input value={p.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} required /></Field>
        <Field label="Categoria">
          <select value={p.category_id} onChange={(e) => set({ category_id: e.target.value })}>
            <option value="">Sem categoria</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Descrição detalhada"><textarea rows={6} value={p.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      </Card>
      <Card title="Fotografias"><Photos photos={p.photos} onChange={(photos) => set({ photos })} /></Card>
      <Card title="Preço">
        <div className="ad-grid2">
          <Field label="Preço normal (R$)"><input type="number" min="0" step="0.01" value={p.price} onChange={(e) => set({ price: e.target.value })} required /></Field>
          <Field label="Preço promocional (R$)" hint="Opcional. Deixe vazio quando não houver promoção."><input type="number" min="0" step="0.01" value={p.promo_price} onChange={(e) => set({ promo_price: e.target.value })} /></Field>
        </div>
      </Card>
      <Card title="Exibição e estoque">
        <Toggle label="Produto ativo" hint="Produtos inativos não aparecem no catálogo." checked={p.active} onChange={(v) => set({ active: v })} />
        <Toggle label="Produto em destaque" hint="Aparece na seção Destaques no topo do catálogo." checked={p.featured} onChange={(v) => set({ featured: v })} />
        <Toggle label="Controlar estoque" hint="Com estoque zerado, o produto aparece como indisponível e não pode ser pedido." checked={p.stock_enabled} onChange={(v) => set({ stock_enabled: v })} />
        {p.stock_enabled && <Field label="Quantidade disponível"><input type="number" min="0" step="1" value={p.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>}
      </Card>
      <Card title="Variações" desc="Cores, modelos, tamanhos, miolos… O cliente escolhe uma opção de cada grupo. Cada opção pode ter preço, foto e estoque próprios.">
        <Variations value={p.variations} onChange={(variations) => set({ variations })} photos={p.photos} stockOn={p.stock_enabled} />
      </Card>
      <Card title="Opções adicionais" desc="Embalagem para presente, personalização com nome, texto… Pode ter acréscimo de preço.">
        <Options value={p.options} onChange={(options) => set({ options })} />
      </Card>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <div className="ad-savebar static">
        <button type="button" className="ad-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="ad-btn" disabled={busy}>{busy ? "Salvando…" : "Salvar produto"}</button>
      </div>
    </form>
  );
}

/* ---------------- Lista ---------------- */
export default function Products({ cats, setCats, prods, setProds, setToast }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("");
  const catName = (id) => cats.find((c) => c.id === id)?.name || "Sem categoria";

  async function patch(p, fields, msg) {
    const { data, error } = await supabase.from("products").update(fields).eq("id", p.id).select().single();
    if (error) return setToast(error.message);
    setProds(prods.map((x) => (x.id === p.id ? data : x))); setToast(msg);
  }
  async function del(p) {
    if (!confirm(`Excluir “${p.name}”? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return setToast(error.message);
    setProds(prods.filter((x) => x.id !== p.id)); setToast("Produto excluído");
  }

  if (editing) {
    return <Editor initial={editing} cats={cats} onClose={() => setEditing(null)}
      onSaved={(d) => { setProds(prods.some((x) => x.id === d.id) ? prods.map((x) => (x.id === d.id ? d : x)) : [...prods, d]); setEditing(null); setToast("Produto salvo"); }} />;
  }

  const list = prods.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <>
      <div className="ad-titlebar">
        <h1 className="ad-h1">Produtos</h1>
        <button className="ad-btn" onClick={() => setEditing({ ...EMPTY })}>+ Novo produto</button>
      </div>
      <Card title={`${prods.length} produtos cadastrados`} aside={<input className="ad-input" placeholder="Buscar" value={filter} onChange={(e) => setFilter(e.target.value)} />}>
        {list.length === 0 ? <p className="ad-muted">Nenhum produto. Clique em “Novo produto” para cadastrar o primeiro.</p> : (
          <ul className="ad-plist">
            {list.map((p) => (
              <li key={p.id} className={p.active ? "" : "inactive"}>
                <div className="ad-thumb">{p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <span>{p.name[0]}</span>}</div>
                <div className="ad-pinfo">
                  <strong>{p.name}{p.featured && <span className="ad-pill star">Destaque</span>}{!p.active && <span className="ad-pill">Inativo</span>}</strong>
                  <span className="ad-muted">{catName(p.category_id)}{p.stock_enabled && ` — estoque: ${p.stock}`}</span>
                  <span>{hasPromo(p) ? <><b>{brl(p.promo_price)}</b> <s className="ad-muted">{brl(p.price)}</s></> : brl(p.price)}</span>
                </div>
                <div className="ad-pactions">
                  <button className="ad-btn ghost sm" onClick={() => setEditing(p)}>Editar</button>
                  <button className="ad-btn ghost sm" onClick={() => patch(p, { active: !p.active }, p.active ? "Produto desativado" : "Produto ativado")}>{p.active ? "Desativar" : "Ativar"}</button>
                  <button className="ad-btn ghost sm" onClick={() => patch(p, { featured: !p.featured }, p.featured ? "Destaque removido" : "Produto destacado")}>{p.featured ? "Tirar destaque" : "Destacar"}</button>
                  {p.active && <a className="ad-btn ghost sm" href={`/produto/${p.id}`} target="_blank" rel="noreferrer">Ver no catálogo</a>}
                  <button className="ad-btn ghost sm danger" onClick={() => del(p)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Categories cats={cats} setCats={setCats} prods={prods} setToast={setToast} />
    </>
  );
}
