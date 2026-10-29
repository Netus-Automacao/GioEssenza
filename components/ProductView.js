"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { brl, waLink, basePrice, hasPromo, productAvailable, valueAvailable, cssVars } from "@/lib/data";
import { WaIcon } from "./Icons";

export default function ProductView({ settings: s, product: p }) {
  const groups = p.variations || [];
  const options = p.options || [];
  const [photo, setPhoto] = useState(p.photos?.[0] || null);
  const [sel, setSel] = useState({});        // grupo -> índice do valor
  const [opt, setOpt] = useState({});        // grupo -> [índices]
  const [txt, setTxt] = useState({});        // "g-c" -> texto
  const [err, setErr] = useState("");
  const available = productAvailable(p);
  const wa = s.whatsapp_enabled && s.whatsapp;

  const price = useMemo(() => {
    let v = basePrice(p);
    groups.forEach((g, gi) => { const val = g.values[sel[gi]]; if (val && val.price !== "" && val.price != null) v = Number(val.price); });
    options.forEach((g, gi) => (opt[gi] || []).forEach((ci) => { v += Number(g.choices[ci]?.extra || 0); }));
    return v;
  }, [sel, opt]);

  function pickValue(gi, vi) {
    setSel({ ...sel, [gi]: vi }); setErr("");
    const ph = groups[gi].values[vi].photo; if (ph) setPhoto(ph);
  }
  function toggleChoice(gi, ci) {
    const g = options[gi]; const cur = opt[gi] || [];
    let next = g.multiple ? (cur.includes(ci) ? cur.filter((x) => x !== ci) : [...cur, ci]) : (cur.includes(ci) && !g.required ? [] : [ci]);
    setOpt({ ...opt, [gi]: next }); setErr("");
  }

  function order() {
    for (let gi = 0; gi < groups.length; gi++) if (sel[gi] === undefined) return setErr(`Escolha uma opção em “${groups[gi].name}”.`);
    for (let gi = 0; gi < options.length; gi++) {
      const g = options[gi]; const cur = opt[gi] || [];
      if (g.required && !cur.length) return setErr(`Escolha uma opção em “${g.name}”.`);
      for (const ci of cur) if (g.choices[ci].input && !String(txt[`${gi}-${ci}`] || "").trim()) return setErr(`Preencha o campo de “${g.choices[ci].label}”.`);
    }
    const lines = [`Olá! Tenho interesse no produto *${p.name}*.`];
    groups.forEach((g, gi) => lines.push(`• ${g.name}: ${g.values[sel[gi]].label}`));
    options.forEach((g, gi) => (opt[gi] || []).forEach((ci) => {
      const c = g.choices[ci]; const t = txt[`${gi}-${ci}`];
      lines.push(`• ${g.name}: ${c.label}${t ? ` — ${t.trim()}` : ""}${Number(c.extra) ? ` (+${brl(c.extra)})` : ""}`);
    }));
    lines.push(`Valor: ${brl(price)}`, "", "Gostaria de mais informações para realizar meu pedido.");
    window.open(waLink(s.whatsapp, lines.join("\n")), "_blank");
  }

  const photos = [...new Set([...(p.photos || []), ...groups.flatMap((g) => g.values.map((v) => v.photo).filter(Boolean))])];

  return (
    <main className="cat" style={cssVars(s.colors)}>
      <nav className="pbar">
        <Link href="/" className="back">← Voltar ao catálogo</Link>
        <Link href="/" className="pbar-brand">{s.logo && <img src={s.logo} alt="" />}<span>{s.name}</span></Link>
      </nav>
      <article className="prod">
        <div className="gallery">
          <div className="gallery-main">{photo ? <img src={photo} alt={p.name} /> : <span className="ph big">{p.name.charAt(0)}</span>}</div>
          {photos.length > 1 && (
            <div className="thumbs">{photos.map((u) => (
              <button key={u} className={u === photo ? "on" : ""} onClick={() => setPhoto(u)} aria-label="Ver foto"><img src={u} alt="" /></button>
            ))}</div>
          )}
        </div>
        <div className="prod-info">
          <h1>{p.name}</h1>
          <div className="price big">
            <strong>{brl(price)}</strong>
            {hasPromo(p) && Object.keys(sel).length === 0 && <><s>{brl(p.price)}</s><span className="badge promo">Promoção</span></>}
          </div>
          {!available && <p className="unavail">Produto indisponível no momento.</p>}

          {groups.map((g, gi) => (
            <fieldset key={gi} className="pick">
              <legend>{g.name}</legend>
              <div className="pills">{g.values.map((v, vi) => {
                const ok = valueAvailable(p, v);
                return (
                  <button key={vi} disabled={!ok} className={sel[gi] === vi ? "on" : ""} onClick={() => pickValue(gi, vi)}>
                    {v.label}{v.price !== "" && v.price != null && <small>{brl(v.price)}</small>}{!ok && <small>esgotado</small>}
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

          {err && <p className="err" role="alert">{err}</p>}
          {wa && available && <button className="btn block" onClick={order}><WaIcon /> Pedir pelo WhatsApp</button>}
          {wa && !available && <a className="btn ghost block" href={waLink(s.whatsapp, `Olá! O produto ${p.name} vai voltar a ficar disponível?`)} target="_blank" rel="noreferrer">Perguntar disponibilidade</a>}

          {p.description && <div className="pdesc">{p.description.split("\n").map((l, i) => <p key={i}>{l}</p>)}</div>}
        </div>
      </article>
    </main>
  );
}
