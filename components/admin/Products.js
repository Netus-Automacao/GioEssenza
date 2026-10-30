"use client";
import { useRef, useState } from "react";
import { uploadVideo, supabase, uploadImage } from "@/lib/supabase";
import { brl, hasPromo, saleBadge, DEFAULT_IMPORTANT } from "@/lib/data";
import ProductView from "@/components/ProductView";
import Cropper from "./Cropper";
import { Toggle, Field, Card } from "./ui";

const MAX_PHOTOS = 10;
const EMPTY_SPECS = { dimensions: {}, miolo: { uses: true }, capa: { uses: true }, materiais: [], laminacao: { has: "nao" }, estrutura: "", encadernacao: {}, acessorios: [], outros_acabamentos: "", arte: { tipo: "" } };
const EMPTY = { name: "", category_id: "", description: "", photos: [], price: "", promo_price: "", featured: false, active: false, stock_enabled: false, stock: 0,
  sale_type: "unit", kit_qty: "", sale_note: "", specs: EMPTY_SPECS, custom_fields: [], variations: [], options: [] };
const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

/* ---------------- Fotos ---------------- */
// originals: { urlDaFotoEnquadrada: urlDaFotoOriginal } — permite reenquadrar depois sem perder área
function Photos({ photos, originals, onChange }) {
  const add = useRef(); const rep = useRef();
  const [queue, setQueue] = useState([]);       // [{ src, file, mode: "add" | "replace" | "adjust", idx }]
  const [err, setErr] = useState("");
  const full = photos.length >= MAX_PHOTOS;
  const job = queue[0];

  function pickFiles(files, mode, idx = null) {
    setErr("");
    files = [...files].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!files.length) return setErr("Use imagens JPG, PNG ou WebP.");
    if (mode === "add") {
      const room = MAX_PHOTOS - photos.length - queue.filter((j) => j.mode === "add").length;
      if (room <= 0) return setErr("Limite máximo de 10 imagens atingido.");
      if (files.length > room) { setErr(`Limite máximo de 10 imagens atingido. Só ${room} serão adicionadas.`); files = files.slice(0, room); }
    }
    setQueue((q) => [...q, ...files.map((file) => ({ file, src: URL.createObjectURL(file), mode, idx }))]);
  }

  async function done(cropped) {
    const j = job;
    const url = await uploadImage(cropped);
    const orig = j.file ? await uploadImage(j.file) : (originals[photos[j.idx]] || photos[j.idx]);
    const nextOrig = { ...originals, [url]: orig };
    let next;
    if (j.mode === "add") next = [...photos, url];
    else next = photos.map((u, i) => (i === j.idx ? url : u));
    onChange(next, nextOrig);
    if (j.file) URL.revokeObjectURL(j.src);
    setQueue((q) => q.slice(1));
  }
  function cancel() { if (job?.file) URL.revokeObjectURL(job.src); setQueue((q) => q.slice(1)); }
  const remove = (i) => { const u = photos[i]; const o = { ...originals }; delete o[u]; onChange(photos.filter((_, j) => j !== i), o); };

  return (
    <div>
      <p className={`ad-counter${full ? " full" : ""}`}>{photos.length} / {MAX_PHOTOS} imagens{full && " — limite máximo atingido"}</p>
      <div className="ad-photos">
        {photos.map((u, i) => (
          <figure key={u + i}>
            <img src={u} alt="" />
            {i === 0 && <span className="ad-main-tag">Principal</span>}
            <figcaption>
              <button type="button" onClick={() => setQueue((q) => [...q, { src: originals[u] || u, mode: "adjust", idx: i }])}>Enquadrar</button>
              <button type="button" onClick={() => { rep.current.dataset.idx = i; rep.current.click(); }}>Trocar</button>
              <button type="button" disabled={i === 0} onClick={() => onChange(move(photos, i, -1), originals)}>Mover antes</button>
              <button type="button" disabled={i === photos.length - 1} onClick={() => onChange(move(photos, i, 1), originals)}>Mover depois</button>
              {i > 0 ? <button type="button" onClick={() => onChange([u, ...photos.filter((_, j) => j !== i)], originals)}>Principal</button> : <button type="button" disabled>—</button>}
              <button type="button" className="danger" onClick={() => remove(i)}>Excluir</button>
            </figcaption>
          </figure>
        ))}
        {!full && <button type="button" className="ad-photo-add" onClick={() => add.current.click()}>+ Adicionar fotos</button>}
      </div>
      <small className="ad-muted">A primeira foto é a principal. Depois de escolher cada foto, você enquadra antes de salvar. São fotos de apresentação — não têm relação com a quantidade de um kit.</small>
      {err && <p className="ad-err">{err}</p>}
      <input ref={add} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickFiles(e.target.files, "add"); e.target.value = ""; }} />
      <input ref={rep} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickFiles(e.target.files, "replace", Number(e.target.dataset.idx)); e.target.value = ""; }} />
      {job && <Cropper key={job.src + queue.length} src={job.src} onCancel={cancel} onDone={done} step={queue.length > 1 ? `faltam ${queue.length}` : ""} />}
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
          <label className="ad-field"><span>Preço das opções deste grupo</span>
            <select value={g.price_mode || "replace"} onChange={(e) => setG(gi, { price_mode: e.target.value })}>
              <option value="replace">Substitui o preço do produto (ex.: 400 páginas = R$ 105,00)</option>
              <option value="add">Soma ao preço do produto (ex.: capa com glitter = + R$ 5,00)</option>
            </select>
            <em>Deixe o preço da opção vazio para usar o preço do produto.</em>
          </label>
          <div className="ad-vtable">
            <div className="ad-vhead"><span>Opção</span><span>{g.price_mode === "add" ? "Acréscimo (R$)" : "Preço (R$)"}</span>{stockOn && <span>Estoque</span>}<span>Foto</span><span>Disponível</span><span /></div>
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
      <button type="button" className="ad-btn ghost" onClick={() => onChange([...value, { name: "", price_mode: "replace", values: [{ label: "", price: "", stock: "", photo: "", available: true }] }])}>+ Novo grupo de variação</button>
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

/* ---------------- Especificações técnicas ---------------- */
function Specs({ value, onChange }) {
  const sp = { ...EMPTY_SPECS, ...value };
  const set = (k, patch) => onChange({ ...sp, [k]: typeof patch === "object" && !Array.isArray(patch) ? { ...sp[k], ...patch } : patch });
  const D = sp.dimensions || {};
  const Num = ({ k, label }) => (
    <Field label={`${label} (cm)`}><input type="number" min="0" step="0.1" value={D[k] ?? ""} onChange={(e) => set("dimensions", { [k]: e.target.value })} /></Field>
  );
  const Paper = ({ k, title, extra, optional }) => {
    const m = sp[k] || {};
    return (
      <div className="ad-group">
        <strong>{title}</strong>
        {optional !== false && <label className="ad-check"><input type="checkbox" checked={m.uses !== false} onChange={(e) => set(k, { uses: e.target.checked })} /> Utiliza papel</label>}
        {m.uses !== false && (
          <div className="ad-grid2">
            <Field label="Tipo / modelo"><input list="dl-papel" value={m.tipo || ""} onChange={(e) => set(k, { tipo: e.target.value })} /></Field>
            <Field label="Gramatura (g/m²)"><input type="number" min="0" value={m.gramatura || ""} onChange={(e) => set(k, { gramatura: e.target.value })} /></Field>
            {extra && <Field label={extra[1]}><input value={m[extra[0]] || ""} onChange={(e) => set(k, { [extra[0]]: e.target.value })} /></Field>}
            <Field label="Observações"><input value={m.obs || ""} onChange={(e) => set(k, { obs: e.target.value })} /></Field>
          </div>
        )}
      </div>
    );
  };
  const acc = sp.acessorios || [];
  return (
    <div className="ad-groups">
      <datalist id="dl-papel"><option value="Offset" /><option value="Couché" /><option value="Fotográfico Gloss" /><option value="Fotográfico fosco" /><option value="Kraft" /><option value="Vergê" /></datalist>
      <datalist id="dl-estrutura"><option value="Capa dura" /><option value="Capa flexível" /></datalist>
      <datalist id="dl-enc"><option value="Wire-o branco" /></datalist>
      <datalist id="dl-acc"><option value="Bolso plástico" /><option value="Elástico" /><option value="Marcador" /><option value="Divisórias" /></datalist>

      <div className="ad-group"><strong>Dimensões</strong>
        <div className="ad-grid3">
          {Num({ k: "altura", label: "Altura" })}{Num({ k: "largura", label: "Largura" })}{Num({ k: "profundidade", label: "Profundidade" })}
          {Num({ k: "comprimento", label: "Comprimento" })}{Num({ k: "diametro", label: "Diâmetro" })}{Num({ k: "espessura", label: "Espessura" })}
        </div>
        <Field label="Outras medidas"><input value={D.outras || ""} placeholder="Ex.: Tamanho A5 (21 x 15 cm)" onChange={(e) => set("dimensions", { outras: e.target.value })} /></Field>
      </div>

      {Paper({ k: "miolo", title: "Miolo" })}
      {Paper({ k: "capa", title: "Capa", extra: ["aplicacao", "Aplicação (ex.: adesivo)"] })}
      <div className="ad-group"><strong>Materiais</strong>
        <p className="ad-note">Adicione quantos quiser. Nenhum campo é obrigatório. O cliente vê só o que você escrever, sem o nome dos campos.</p>
        {(sp.materiais || []).map((m, i) => {
          const setM = (patch) => onChange({ ...sp, materiais: sp.materiais.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
          return (
            <div key={i} className="ad-group" style={{ background: "#fff" }}>
              <div className="ad-grid2">
                <Field label="Tipo / modelo"><input list="dl-papel" value={m.tipo || ""} onChange={(e) => setM({ tipo: e.target.value })} /></Field>
                <Field label="Gramatura (g/m²)"><input type="number" min="0" value={m.gramatura || ""} onChange={(e) => setM({ gramatura: e.target.value })} /></Field>
                <Field label="Finalidade"><input value={m.finalidade || ""} onChange={(e) => setM({ finalidade: e.target.value })} /></Field>
                <Field label="Observações"><input value={m.obs || ""} onChange={(e) => setM({ obs: e.target.value })} /></Field>
              </div>
              <button type="button" className="ad-btn ghost sm danger" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ ...sp, materiais: sp.materiais.filter((_, j) => j !== i) })}>Remover material</button>
            </div>
          );
        })}
        <button type="button" className="ad-btn ghost" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ ...sp, materiais: [...(sp.materiais || []), { tipo: "", gramatura: "", finalidade: "", obs: "" }] })}>+ Adicionar material</button>
      </div>

      <div className="ad-group"><strong>Laminação</strong>
        <div className="ad-grid2">
          <Field label="Possui laminação?">
            <select value={sp.laminacao?.has || "nao"} onChange={(e) => set("laminacao", { has: e.target.value })}><option value="nao">Não</option><option value="sim">Sim</option></select>
          </Field>
          {sp.laminacao?.has === "sim" && (
            <Field label="Tipo">
              <select value={sp.laminacao?.tipo || "brilho"} onChange={(e) => set("laminacao", { tipo: e.target.value })}><option value="brilho">Brilho comum</option><option value="soft">Fosca soft touch</option></select>
            </Field>
          )}
        </div>
        {sp.laminacao?.has === "sim" && <Field label="Observações"><input value={sp.laminacao?.obs || ""} onChange={(e) => set("laminacao", { obs: e.target.value })} /></Field>}
      </div>

      <div className="ad-group"><strong>Acabamento e estrutura</strong>
        <div className="ad-grid2">
          <Field label="Estrutura"><input list="dl-estrutura" value={sp.estrutura || ""} onChange={(e) => onChange({ ...sp, estrutura: e.target.value })} /></Field>
          <Field label="Espiral / Wire-o">
            <select value={sp.encadernacao?.tipo ? "Wire-o branco" : ""} onChange={(e) => set("encadernacao", { tipo: e.target.value, cor: "" })}>
              <option value="">Não informar</option>
              <option value="Wire-o branco">Wire-o branco</option>
            </select>
          </Field>
        </div>
        <span className="ad-label">Acessórios</span>
        {acc.map((a, i) => (
          <div key={i} className="ad-row">
            <input className="ad-input grow" list="dl-acc" value={a} onChange={(e) => onChange({ ...sp, acessorios: acc.map((x, j) => (j === i ? e.target.value : x)) })} />
            <button type="button" className="ad-icon danger" onClick={() => onChange({ ...sp, acessorios: acc.filter((_, j) => j !== i) })} aria-label="Remover">✕</button>
          </div>
        ))}
        <button type="button" className="ad-link" onClick={() => onChange({ ...sp, acessorios: [...acc, ""] })}>+ Adicionar acessório</button>
        <Field label="Outros acabamentos"><input value={sp.outros_acabamentos || ""} onChange={(e) => onChange({ ...sp, outros_acabamentos: e.target.value })} /></Field>
      </div>

      <div className="ad-group"><strong>Arte</strong>
        <div className="ad-grid2">
          <Field label="Condição">
            <select value={sp.arte?.tipo || ""} onChange={(e) => set("arte", { tipo: e.target.value })}>
              <option value="">Não informar</option><option value="inclusa">Arte inclusa</option><option value="nao">Arte não inclusa</option><option value="custom">Condições personalizadas</option>
            </select>
          </Field>
          {sp.arte?.tipo === "inclusa" && <Field label="Alterações incluídas"><input type="number" min="0" value={sp.arte?.alteracoes || ""} onChange={(e) => set("arte", { alteracoes: e.target.value })} /></Field>}
        </div>
        {sp.arte?.tipo && <Field label={sp.arte.tipo === "custom" ? "Descreva as condições" : "Observações"}><input value={sp.arte?.obs || ""} onChange={(e) => set("arte", { obs: e.target.value })} /></Field>}
      </div>
      <p className="ad-note">Tudo aqui é opcional. Só aparece no catálogo o que for preenchido.</p>
    </div>
  );
}

/* ---------------- Personalização ---------------- */
function CustomFields({ value, onChange, isKit }) {
  const setF = (i, patch) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="ad-groups">
      <datalist id="dl-cf"><option value="Nome" /><option value="Nome para a capa" /><option value="Frase" /><option value="Texto" /></datalist>
      {value.length === 0 && <p className="ad-muted">Sem personalização. Adicione um campo se o cliente precisar informar nome, frase ou texto.</p>}
      {value.map((f, i) => (
        <div key={i} className="ad-group">
          <div className="ad-row">
            <input className="ad-input grow" list="dl-cf" placeholder="Nome do campo (ex.: Nome para a capa)" value={f.label} onChange={(e) => setF(i, { label: e.target.value })} />
            <button type="button" className="ad-icon danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Excluir campo">✕</button>
          </div>
          <Field label="Instrução para o cliente"><input value={f.instruction || ""} placeholder="Ex.: Digite o nome que deverá aparecer na capa." onChange={(e) => setF(i, { instruction: e.target.value })} /></Field>
          <div className="ad-grid2">
            <Field label="Limite de caracteres"><input type="number" min="1" value={f.max || ""} onChange={(e) => setF(i, { max: e.target.value })} /></Field>
            <label className="ad-check"><input type="checkbox" checked={!!f.required} onChange={(e) => setF(i, { required: e.target.checked })} /> Preenchimento obrigatório</label>
          </div>
          <Field label="Frases ou textos sugeridos (um por linha)" hint="Opcional. O cliente escolhe uma sugestão da lista.">
            <textarea rows={3} value={f.suggestions || ""} onChange={(e) => setF(i, { suggestions: e.target.value })} />
          </Field>
          {String(f.suggestions || "").trim() && (
            <label className="ad-check"><input type="checkbox" checked={f.allow_free !== false} onChange={(e) => setF(i, { allow_free: e.target.checked })} /> Cliente também pode escrever o próprio texto</label>
          )}
        </div>
      ))}
      <button type="button" className="ad-btn ghost" onClick={() => onChange([...value, { label: "", instruction: "", required: false, max: "", suggestions: "", allow_free: true }])}>+ Novo campo de personalização</button>
      {isKit && <p className="ad-note">Neste kit, o cliente escolhe se usa o mesmo texto para o kit todo ou um texto para cada unidade.</p>}
    </div>
  );
}

/* ---------------- Formulário ---------------- */
function Editor({ initial, cats, settings, onClose, onSaved }) {
  const initSpecs = { ...EMPTY_SPECS, ...(initial.specs || {}) };
  if (!(initSpecs.materiais || []).length && initSpecs.principal && Object.values(initSpecs.principal).some((v) => String(v || "").trim())) {
    initSpecs.materiais = [{ ...initSpecs.principal }];
  }
  delete initSpecs.principal;
  if (initSpecs.importante === undefined) initSpecs.importante = DEFAULT_IMPORTANT;
  if (!initSpecs.kit) initSpecs.kit = { unit: "fotos", options: initial.kit_qty ? [{ qty: String(initial.kit_qty), price: "" }] : [{ qty: "10", price: "" }, { qty: "20", price: "" }] };
  const [p, setP] = useState({ ...EMPTY, ...initial, specs: initSpecs, custom_fields: initial.custom_fields || [],
    price: initial.price ?? "", promo_price: initial.promo_price ?? "", category_id: initial.category_id || "", kit_qty: initial.kit_qty ?? "", sale_note: initial.sale_note || "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));

  function build(active) {
    const price = Number(p.price);
    const promo = p.promo_price === "" || p.promo_price === null ? null : Number(p.promo_price);
    if (!p.name.trim()) return "Informe o nome do produto.";
    if (!p.category_id) return "Escolha a categoria do produto.";
    if (p.price === "" || !isFinite(price) || price < 0) return "Informe um preço normal válido (zero ou maior).";
    if (promo !== null && (!isFinite(promo) || promo < 0 || promo >= price)) return "O preço promocional precisa ser menor que o preço normal.";
    const kops = (p.specs.kit?.options || []).filter((o) => parseInt(o.qty) > 0);
    if (p.sale_type === "kit" && !kops.length) return "Informe pelo menos uma opção de quantidade do kit.";
    if (kops.some((o) => o.price !== "" && o.price != null && Number(o.price) < 0)) return "Preços do kit não podem ser negativos.";
    const variations = p.variations.filter((g) => g.name.trim()).map((g) => ({ ...g, name: g.name.trim(), values: g.values.filter((v) => v.label.trim()) })).filter((g) => g.values.length);
    if (variations.some((g) => g.values.some((v) => v.price !== "" && v.price != null && Number(v.price) < 0))) return "Preços de variações não podem ser negativos.";
    const options = p.options.filter((g) => g.name.trim()).map((g) => ({ ...g, name: g.name.trim(), choices: g.choices.filter((c) => c.label.trim()) })).filter((g) => g.choices.length);
    if (options.some((g) => g.choices.some((c) => Number(c.extra) < 0))) return "Acréscimos não podem ser negativos.";
    const custom_fields = p.custom_fields.filter((f) => f.label.trim()).map((f) => ({ ...f, label: f.label.trim() }));
    const sp = p.specs;
    const orig = Object.fromEntries(Object.entries(sp._originais || {}).filter(([k]) => p.photos.includes(k)));
    const kit = { unit: (sp.kit?.unit || "").trim() || "unidades", options: kops.map((o) => ({ qty: String(parseInt(o.qty)), price: o.price === "" || o.price == null ? "" : String(Number(o.price)) })) };
    const specs = { ...sp, kit, _originais: orig, acessorios: (sp.acessorios || []).map((a) => a.trim()).filter(Boolean) };
    return {
      name: p.name.trim(), category_id: p.category_id, description: p.description, photos: p.photos.slice(0, MAX_PHOTOS),
      price, promo_price: promo, featured: p.featured, active, stock_enabled: p.stock_enabled, stock: Math.max(0, parseInt(p.stock) || 0),
      sale_type: p.sale_type, kit_qty: p.sale_type === "kit" ? parseInt(kops[0].qty) : null, sale_note: p.sale_type === "other" ? p.sale_note.trim() : "",
      specs, custom_fields, variations, options,
    };
  }

  async function submit(active) {
    const row = build(active);
    if (typeof row === "string") return setErr(row);
    setBusy(true); setErr("");
    const q = p.id ? supabase.from("products").update(row).eq("id", p.id) : supabase.from("products").insert({ ...row, position: Math.floor(Date.now() / 1000) % 1e9 });
    const { data, error } = await q.select().single();
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved(data, active);
  }

  const draft = { ...p, price: Number(p.price) || 0, promo_price: p.promo_price === "" ? null : Number(p.promo_price), kit_qty: parseInt(p.specs.kit?.options?.[0]?.qty) || null, active: true };
  return (
    <div className="ad-editor">
      <div className="ad-editor-head">
        <button type="button" className="ad-btn ghost" style={{ alignSelf: "flex-start" }} onClick={onClose}>Voltar para a lista de produtos</button>
        <h1 className="ad-h1">{p.id ? "Editar produto" : "Novo produto"}</h1>
      </div>
      <Card title="Informações principais">
        <Field label="Nome do produto *"><input value={p.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} /></Field>
        <Field label="Categoria *" hint={cats.length ? "" : "Crie uma categoria na aba Categorias antes de cadastrar produtos."}>
          <select value={p.category_id} onChange={(e) => set({ category_id: e.target.value })}>
            <option value="">Escolha a categoria</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active === false ? " (inativa)" : ""}</option>)}
          </select>
        </Field>
        <Field label="Descrição"><textarea rows={5} value={p.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Prazo de confecção" hint="Ex.: 7 a 10 dias úteis após a confirmação. No site aparece junto o aviso: “É necessário verificar a disponibilidade da agenda da semana.”">
          <input value={p.specs.prazo || ""} maxLength={120} onChange={(e) => set({ specs: { ...p.specs, prazo: e.target.value } })} />
        </Field>
        <Field label="Importante" hint="Aparece em destaque na página do produto. Deixe vazio para não mostrar.">
          <textarea rows={3} value={p.specs.importante} onChange={(e) => set({ specs: { ...p.specs, importante: e.target.value } })} />
        </Field>
      </Card>
      <Card title="Fotografias" desc="Até 10 fotos de apresentação, no formato retangular. Opcional: sem foto, o produto aparece com a inicial do nome.">
        <Photos photos={p.photos} originals={p.specs._originais || {}} onChange={(photos, o) => set({ photos, specs: { ...p.specs, _originais: o } })} />
      </Card>
      <Card title="Vídeos" desc="Até 2 vídeos curtos do produto (MP4 ou MOV, até 50 MB cada). Aparecem na galeria, depois das fotos.">
        <Videos list={p.specs.videos || []} onChange={(videos) => set({ specs: { ...p.specs, videos } })} />
      </Card>
      <Card title="Forma de venda e preço">
        <div className="ad-grid2">
          <Field label="Vendido como">
            <select value={p.sale_type} onChange={(e) => set({ sale_type: e.target.value })}><option value="unit">Unidade</option><option value="kit">Kit</option><option value="other">Outra forma</option></select>
          </Field>
          {p.sale_type === "kit" && <Field label="Nome dos itens do kit" hint="Ex.: fotos, blocos, unidades."><input value={p.specs.kit?.unit || ""} onChange={(e) => set({ specs: { ...p.specs, kit: { ...p.specs.kit, unit: e.target.value } } })} /></Field>}
          {p.sale_type === "other" && <Field label="Descrição da forma de venda"><input placeholder="Ex.: Pacote com 5 blocos" value={p.sale_note} onChange={(e) => set({ sale_note: e.target.value })} /></Field>}
        </div>
        {p.sale_type === "kit" && (() => {
          const k = p.specs.kit || { unit: "", options: [] };
          const setK = (options) => set({ specs: { ...p.specs, kit: { ...k, options } } });
          return (
            <div className="ad-group">
              <strong>Opções de quantidade do kit</strong>
              <p className="ad-note">O cliente escolhe uma delas. Deixe o preço vazio para usar o preço normal do produto.</p>
              {(k.options || []).map((o, i) => (
                <div key={i} className="ad-row">
                  <input className="ad-input" style={{ width: 90 }} type="number" min="1" placeholder="Qtd." value={o.qty} onChange={(e) => setK(k.options.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} aria-label="Quantidade" />
                  <span>{k.unit || "unidades"} —</span>
                  <input className="ad-input" style={{ width: 120 }} type="number" min="0" step="0.01" placeholder="Preço R$" value={o.price} onChange={(e) => setK(k.options.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} aria-label="Preço" />
                  <button type="button" className="ad-btn ghost sm danger" onClick={() => setK(k.options.filter((_, j) => j !== i))}>Remover</button>
                </div>
              ))}
              <button type="button" className="ad-btn ghost" style={{ alignSelf: "flex-start" }} onClick={() => setK([...(k.options || []), { qty: "", price: "" }])}>+ Adicionar opção de kit</button>
            </div>
          );
        })()}
        <div className="ad-grid2">
          <Field label="Preço normal (R$) *"><input type="number" min="0" step="0.01" value={p.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          <Field label="Preço promocional (R$)" hint="Opcional. Deixe vazio quando não houver promoção."><input type="number" min="0" step="0.01" value={p.promo_price} onChange={(e) => set({ promo_price: e.target.value })} /></Field>
        </div>
      </Card>
      <Card title="Exibição e estoque">
        <Toggle label="Produto em destaque" hint="Aparece na seção Destaques no topo do catálogo." checked={p.featured} onChange={(v) => set({ featured: v })} />
        <Toggle label="Controlar estoque" hint="Com estoque zerado, o produto fica indisponível e não entra no carrinho. Como o pedido é fechado no WhatsApp, atualize a quantidade aqui após cada venda." checked={p.stock_enabled} onChange={(v) => set({ stock_enabled: v })} />
        {p.stock_enabled && <Field label="Quantidade disponível"><input type="number" min="0" step="1" value={p.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>}
      </Card>
      <Card title="Especificações técnicas"><Specs value={p.specs} onChange={(specs) => set({ specs })} /></Card>
      <Card title="Personalização"><CustomFields value={p.custom_fields} onChange={(custom_fields) => set({ custom_fields })} isKit={p.sale_type === "kit"} /></Card>
      <Card title="Variações" desc="Cor, modelo, tamanho, miolo… O cliente escolhe uma opção de cada grupo. Cada opção pode ter preço, foto e estoque próprios.">
        <Variations value={p.variations} onChange={(variations) => set({ variations })} photos={p.photos} stockOn={p.stock_enabled} />
      </Card>
      <Card title="Opções adicionais" desc="Embalagem para presente, acabamento extra… Com acréscimo de preço opcional.">
        <Options value={p.options} onChange={(options) => set({ options })} />
      </Card>
      {err && <p className="ad-err" role="alert">{err}</p>}
      <div className="ad-savebar static">
        <span className="ad-muted">{p.active ? "Publicado no catálogo" : "Não publicado"}</span>
        <button type="button" className="ad-btn ghost" onClick={() => setPreview(true)}>Pré-visualizar</button>
        <button type="button" className="ad-btn ghost" onClick={() => submit(false)} disabled={busy}>Salvar como inativo</button>
        <button type="button" className="ad-btn" onClick={() => submit(true)} disabled={busy}>{busy ? "Salvando…" : "Publicar produto"}</button>
      </div>
      {preview && (
        <div className="ad-modal" role="dialog" aria-label="Pré-visualização">
          <div className="ad-modal-bar"><strong>Como o cliente verá</strong><button className="ad-btn" onClick={() => setPreview(false)}>Fechar prévia</button></div>
          <div className="ad-modal-body">
            <ProductView settings={settings} product={draft} categoryName={cats.find((c) => c.id === p.category_id)?.name} preview />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Lista ---------------- */
function Videos({ list, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function add(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusy(true); setErr("");
    try { onChange([...list, await uploadVideo(file)]); } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <div>
      <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
        {list.map((u, i) => (
          <div key={u} style={{ width: 160 }}>
            <video src={u} controls playsInline preload="metadata" style={{ width: "100%", borderRadius: 10, background: "#000", aspectRatio: "3/4", objectFit: "cover" }} />
            <button type="button" className="ad-btn ghost sm danger" style={{ width: "100%", marginTop: ".3rem" }} onClick={() => confirm("Remover este vídeo?") && onChange(list.filter((x) => x !== u))}>Remover</button>
          </div>
        ))}
        {list.length < 2 && (
          <label className="ad-btn ghost" style={{ alignSelf: "flex-start", cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Enviando vídeo…" : "+ Adicionar vídeo"}
            <input type="file" accept="video/mp4,video/quicktime,video/webm" hidden disabled={busy} onChange={add} />
          </label>
        )}
      </div>
      {err && <p className="ad-error">{err}</p>}
    </div>
  );
}

export default function Products({ cats, prods, setProds, setToast, settings, startNew }) {
  const [editing, setEditing] = useState(startNew ? { ...EMPTY } : null);
  const [filter, setFilter] = useState("");
  const [folder, setFolder] = useState(null); // null = lista de categorias; "none" = sem categoria
  const catName = (id) => cats.find((c) => c.id === id)?.name || "Sem categoria";

  async function patch(p, fields, msg) {
    const { data, error } = await supabase.from("products").update(fields).eq("id", p.id).select().single();
    if (error) return setToast(error.message);
    setProds(prods.map((x) => (x.id === p.id ? data : x))); setToast(msg);
  }
  async function duplicate(p) {
    const { id, created_at, ...rest } = p;
    const copy = { ...rest, name: `${p.name} (cópia)`, active: false, featured: false, position: (p.position || 0) + 1 };
    const { data, error } = await supabase.from("products").insert(copy).select().single();
    if (error) return setToast(error.message);
    setProds([...prods, data]); setToast("Produto duplicado (inativo). Edite e publique quando quiser.");
  }
  async function del(p) {
    if (!confirm(`Excluir “${p.name}”? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return setToast(error.message);
    setProds(prods.filter((x) => x.id !== p.id)); setToast("Produto excluído");
  }

  if (editing) {
    return <Editor initial={editing} cats={cats} settings={settings} onClose={() => setEditing(null)}
      onSaved={(d, active) => { setProds(prods.some((x) => x.id === d.id) ? prods.map((x) => (x.id === d.id ? d : x)) : [...prods, d]); setEditing(null); setToast(active ? "Produto publicado" : "Produto salvo como inativo"); }} />;
  }

  const abc = (a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base", numeric: true });
  const list = prods.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase())).sort(abc);
  const inCat = (p, id) => (id === "none" ? !cats.some((c) => c.id === p.category_id) : p.category_id === id);
  const folders = [...cats.map((c) => ({ id: c.id, name: c.name })), { id: "none", name: "Sem categoria" }]
    .map((g) => ({ ...g, all: prods.filter((p) => inCat(p, g.id)) })).filter((g) => g.id !== "none" || g.all.length);
  const showFolders = !folder && !filter;
  return (
    <>
      <div className="ad-titlebar">
        <h1 className="ad-h1">Produtos</h1>
        <button className="ad-btn" onClick={() => setEditing({ ...EMPTY, ...(folder && folder !== "none" ? { category_id: folder } : {}) })}>+ Novo produto</button>
      </div>
      {prods.some((p) => !p.active) && (
        <p className="ad-alert"><strong>{prods.filter((p) => !p.active).length} produto(s) inativo(s) não aparecem para os clientes.</strong> Para publicar: toque em <b>Editar</b> e depois em <b>Publicar produto</b>.</p>
      )}
      <Card title={`${prods.length} produtos — ${prods.filter((p) => p.active).length} ativos`} aside={<input className="ad-input" placeholder="Buscar" value={filter} onChange={(e) => setFilter(e.target.value)} />}>
        {showFolders ? (
          <div className="ad-folders">
            {folders.map((g) => (
              <button key={g.id} className="ad-folder" onClick={() => setFolder(g.id)}>
                <span className="ad-folder-ico" aria-hidden="true">📁</span>
                <strong>{g.name}</strong>
                <span className="ad-muted">{g.all.length} produto(s){g.all.some((p) => !p.active) && ` · ${g.all.filter((p) => !p.active).length} inativo(s)`}</span>
              </button>
            ))}
          </div>
        ) : list.length === 0 ? <p className="ad-muted">Nenhum produto encontrado.</p> : (
          <>
          {folder && !filter && <button className="ad-btn ghost sm" style={{ marginBottom: ".8rem" }} onClick={() => setFolder(null)}>← Todas as categorias</button>}
          <div>
            {folders.filter((g) => filter || g.id === folder).map((g) => {
              const items = list.filter((p) => inCat(p, g.id));
              if (!items.length) return null;
              return (
                <section key={g.id} className="ad-pgroup">
                  <h3>{g.name} <span className="ad-muted">({items.length})</span></h3>
                  <ul className="ad-plist">
                    {items.map((p) => (
                      <li key={p.id} className={p.active ? "" : "inactive"}>
                        <div className="ad-thumb">{p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <span>{p.name[0]}</span>}</div>
                        <div className="ad-pinfo">
                          <strong>{p.name}{p.featured && <span className="ad-pill star">Destaque</span>}{hasPromo(p) && <span className="ad-pill star">Promoção</span>}{!p.active && <span className="ad-pill">Inativo</span>}</strong>
                          <span className="ad-muted">{saleBadge(p) && `${saleBadge(p)} — `}{p.stock_enabled && `estoque: ${p.stock} — `}{(p.photos || []).length} foto(s)</span>
                          <span>{hasPromo(p) ? <><b>{brl(p.promo_price)}</b> <s className="ad-muted">{brl(p.price)}</s></> : brl(p.price)}</span>
                        </div>
                        <div className="ad-pactions">
                          <button className="ad-btn ghost sm" onClick={() => setEditing(p)}>Editar</button>
                          <button className="ad-btn ghost sm" onClick={() => duplicate(p)}>Duplicar</button>
                          <button className="ad-btn ghost sm" onClick={() => patch(p, { active: !p.active }, p.active ? "Produto desativado" : "Produto publicado")}>{p.active ? "Desativar" : "Publicar"}</button>
                          <button className="ad-btn ghost sm" onClick={() => patch(p, { featured: !p.featured }, p.featured ? "Destaque removido" : "Produto destacado")}>{p.featured ? "Tirar destaque" : "Destacar"}</button>
                          {p.active && <a className="ad-btn ghost sm" href={`/produto/${p.id}`} target="_blank" rel="noreferrer">Ver no catálogo</a>}
                          <button className="ad-btn ghost sm danger" onClick={() => del(p)}>Excluir</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          </>
        )}
      </Card>
    </>
  );
}
