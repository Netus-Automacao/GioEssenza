"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { brl, hasPromo, productAvailable, valueAvailable, cssVars, unitPrice, maxQty, saleBadge, specSections, filled } from "@/lib/data";
import { addToCart } from "@/lib/cart";
import CartButton from "./CartButton";

const suggestions = (f) => String(f.suggestions || "").split("\n").map((x) => x.trim()).filter(Boolean);

export default function ProductView({ settings: s, product: p, categoryName, preview = false }) {
  const groups = p.variations || [];
  const options = p.options || [];
  const fields = p.custom_fields || [];
  const isKit = p.sale_type === "kit" && Number(p.kit_qty) > 1;

  const [idx, setIdx] = useState(0);
  const [touch, setTouch] = useState(null);
  const [sel, setSel] = useState({});
  const [opt, setOpt] = useState({});
  const [txt, setTxt] = useState({});         // texto de opção adicional "g-c"
  const [mode, setMode] = useState({});       // campo -> "single" | "each"
  const [cf, setCf] = useState({});           // "campo-unidade" -> texto
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [added, setAdded] = useState(false);

  const price = useMemo(() => unitPrice(p, sel, opt), [sel, opt, p]);
  const max = maxQty(p, sel);
  const available = productAvailable(p) && (max == null || max > 0);
  const specs = specSections(p.specs);
  const badge = saleBadge(p);
  const photos = [...new Set([...(p.photos || []), ...groups.flatMap((g) => g.values.map((v) => v.photo).filter(Boolean))])];
  const units = (fi) => (isKit && mode[fi] === "each" ? Number(p.kit_qty) : 1);

  function pickValue(gi, vi) {
    setSel({ ...sel, [gi]: vi }); setErr(""); setAdded(false);
    const ph = groups[gi].values[vi].photo; if (ph && photos.indexOf(ph) >= 0) setIdx(photos.indexOf(ph));
  }
  function toggleChoice(gi, ci) {
    const g = options[gi]; const cur = opt[gi] || [];
    const next = g.multiple ? (cur.includes(ci) ? cur.filter((x) => x !== ci) : [...cur, ci]) : (cur.includes(ci) && !g.required ? [] : [ci]);
    setOpt({ ...opt, [gi]: next }); setErr(""); setAdded(false);
  }

  function add() {
    for (let gi = 0; gi < groups.length; gi++) if (sel[gi] === undefined) return setErr(`Escolha uma opção em “${groups[gi].name}”.`);
    for (let gi = 0; gi < options.length; gi++) {
      const g = options[gi]; const cur = opt[gi] || [];
      if (g.required && !cur.length) return setErr(`Escolha uma opção em “${g.name}”.`);
      for (const ci of cur) if (g.choices[ci].input && !String(txt[`${gi}-${ci}`] || "").trim()) return setErr(`Preencha o campo de “${g.choices[ci].label}”.`);
    }
    for (let fi = 0; fi < fields.length; fi++) {
      if (!fields[fi].required) continue;
      for (let u = 0; u < units(fi); u++) if (!String(cf[`${fi}-${u}`] || "").trim()) return setErr(`Preencha “${fields[fi].label}”${units(fi) > 1 ? ` da unidade ${u + 1}` : ""}.`);
    }
    if (max != null && qty > max) return setErr(`Só há ${max} disponível(is).`);

    const lines = [];
    groups.forEach((g, gi) => lines.push(`${g.name}: ${g.values[sel[gi]].label}`));
    options.forEach((g, gi) => (opt[gi] || []).forEach((ci) => {
      const c = g.choices[ci]; const t = txt[`${gi}-${ci}`];
      lines.push(`${g.name}: ${c.label}${t ? ` — ${t.trim()}` : ""}${Number(c.extra) ? ` (+${brl(c.extra)})` : ""}`);
    }));
    fields.forEach((f, fi) => {
      const n = units(fi);
      const vals = Array.from({ length: n }, (_, u) => String(cf[`${fi}-${u}`] || "").trim());
      if (!vals.some(Boolean)) return;
      if (n === 1) lines.push(`${f.label}: ${vals[0]}${isKit ? " (igual para todo o kit)" : ""}`);
      else vals.forEach((v, u) => v && lines.push(`${f.label} — unidade ${u + 1}: ${v}`));
    });
    const key = JSON.stringify([p.id, lines]);
    addToCart({ key, id: p.id, name: p.name, photo: p.photos?.[0] || null, qty, max, price, lines, sale_type: p.sale_type || "unit", kit_qty: p.kit_qty || null, sale_note: p.sale_note || "" });
    setAdded(true); setErr("");
  }

  const Back = preview ? "span" : Link;
  const n = photos.length;
  const go = (d) => n > 1 && setIdx((idx + d + n) % n);
  return (
    <main className={`cat${preview ? " is-preview" : ""}`} style={cssVars(s.colors, s.fonts)}>
      <nav className="pbar">
        <Back href="/" className="nav-btn">Catálogo</Back>
        {!preview && <CartButton />}
      </nav>
      <article className="prod">
        <div className="gallery">
          <div className="gallery-main" onTouchStart={(e) => setTouch(e.touches[0].clientX)}
            onTouchEnd={(e) => { if (touch !== null) { const dx = e.changedTouches[0].clientX - touch; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); setTouch(null); } }}>
            {photos[idx] ? <img src={photos[idx]} alt={`${p.name} — foto ${idx + 1}`} /> : <span className="ph big">{p.name?.charAt(0)}</span>}
            {n > 1 && (
              <>
                <button className="gal-nav prev" onClick={() => go(-1)} aria-label="Foto anterior">‹</button>
                <button className="gal-nav next" onClick={() => go(1)} aria-label="Próxima foto">›</button>
                <span className="gal-count">{idx + 1} / {n}</span>
              </>
            )}
          </div>
          {n > 1 && (
            <div className="thumbs">{photos.map((u, i) => (
              <button key={u} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} aria-label={`Ver foto ${i + 1}`}><img src={u} alt="" /></button>
            ))}</div>
          )}
          {n > 1 && <p className="hint center">Toque nas miniaturas ou deslize a foto para ver todas.</p>}
        </div>
        <div className="prod-info">
          {categoryName && <p className="pcat">{categoryName}</p>}
          <h1>{p.name}</h1>
          {badge && <p className="sale-badge">{badge}</p>}
          <div className="price big">
            <strong>{brl(price)}</strong>
            {hasPromo(p) && <><s>{brl(p.price)}</s><span className="badge promo">Promoção</span></>}
          </div>
          {!available && <p className="unavail">Produto indisponível no momento.</p>}

          {groups.map((g, gi) => (
            <fieldset key={gi} className="pick">
              <legend>{g.name}</legend>
              <div className="pills">{g.values.map((v, vi) => {
                const ok = valueAvailable(p, v);
                const pr = v.price !== "" && v.price != null ? (g.price_mode === "add" ? `+${brl(v.price)}` : brl(v.price)) : "";
                return (
                  <button key={vi} disabled={!ok} className={sel[gi] === vi ? "on" : ""} onClick={() => pickValue(gi, vi)}>
                    {v.label}{pr && <small>{pr}</small>}{!ok && <small>esgotado</small>}
                  </button>
                );
              })}</div>
            </fieldset>
          ))}

          {options.map((g, gi) => (
            <fieldset key={gi} className="pick">
              <legend>{g.name}{!g.required && <em> (opcional)</em>}{g.multiple && <em> — pode escolher mais de uma</em>}</legend>
              <div className="pills">{g.choices.map((c, ci) => (
                <button key={ci} className={(opt[gi] || []).includes(ci) ? "on" : ""} onClick={() => toggleChoice(gi, ci)}>
                  {c.label}{Number(c.extra) > 0 && <small>+{brl(c.extra)}</small>}
                </button>
              ))}</div>
              {g.choices.map((c, ci) => c.input && (opt[gi] || []).includes(ci) && (
                <input key={ci} className="opt-input" placeholder={`Escreva aqui: ${c.label.toLowerCase()}`} value={txt[`${gi}-${ci}`] || ""}
                  onChange={(e) => setTxt({ ...txt, [`${gi}-${ci}`]: e.target.value })} maxLength={120} />
              ))}
            </fieldset>
          ))}

          {fields.map((f, fi) => {
            const sug = suggestions(f);
            const n = units(fi);
            return (
              <fieldset key={fi} className="pick">
                <legend>{f.label}{!f.required && <em> (opcional)</em>}</legend>
                {filled(f.instruction) && <p className="hint">{f.instruction}</p>}
                {isKit && (
                  <div className="pills">
                    <button className={mode[fi] !== "each" ? "on" : ""} onClick={() => setMode({ ...mode, [fi]: "single" })}>Mesmo texto para o kit todo</button>
                    <button className={mode[fi] === "each" ? "on" : ""} onClick={() => setMode({ ...mode, [fi]: "each" })}>Um texto para cada unidade ({p.kit_qty})</button>
                  </div>
                )}
                {sug.length > 0 && <datalist id={`sug-${fi}`}>{sug.map((x) => <option key={x} value={x} />)}</datalist>}
                {Array.from({ length: n }, (_, u) => {
                  const k = `${fi}-${u}`; const val = cf[k] || "";
                  const set = (v) => { setCf({ ...cf, [k]: v }); setErr(""); setAdded(false); };
                  return (
                    <div key={u} className="cf-row">
                      {n > 1 && <span>Unidade {u + 1}</span>}
                      {sug.length > 0 && f.allow_free === false ? (
                        <select className="opt-input" value={val} onChange={(e) => set(e.target.value)}>
                          <option value="">Escolha uma opção</option>
                          {sug.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      ) : (
                        <input className="opt-input" list={sug.length ? `sug-${fi}` : undefined} value={val} maxLength={Number(f.max) || 200}
                          placeholder={sug.length ? "Escolha uma sugestão ou escreva" : "Escreva aqui"} onChange={(e) => set(e.target.value)} />
                      )}
                      {Number(f.max) > 0 && <small className="count">{val.length}/{f.max}</small>}
                    </div>
                  );
                })}
              </fieldset>
            );
          })}

          {err && <p className="err" role="alert">{err}</p>}
          {available && (
            <div className="buy">
              <div className="qty" aria-label="Quantidade">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuir">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(max == null ? qty + 1 : Math.min(max, qty + 1))} aria-label="Aumentar">+</button>
              </div>
              <button className="btn grow" onClick={add} disabled={preview}>Adicionar ao carrinho · {brl(price * qty)}</button>
            </div>
          )}
          {added && <p className="ok">Adicionado ao carrinho. <Link href="/carrinho">Ver carrinho</Link> ou continue escolhendo.</p>}

          {p.description && <div className="pdesc">{p.description.split("\n").map((l, i) => <p key={i}>{l}</p>)}</div>}
          {specs.length > 0 && (
            <dl className="specs">
              {specs.map((sec) => (
                <div key={sec.title}><dt>{sec.title}</dt>{sec.items.map((it, i) => <dd key={i}>{it}</dd>)}</div>
              ))}
            </dl>
          )}
        </div>
      </article>
    </main>
  );
}
