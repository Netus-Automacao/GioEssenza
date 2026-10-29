"use client";
import { useEffect, useRef, useState } from "react";
import { parseColor, hexToRgb } from "@/lib/data";
import { uploadImage } from "@/lib/supabase";

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="ad-toggle">
      <span><strong>{label}</strong>{hint && <em>{hint}</em>}</span>
      <input type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function Field({ label, hint, children, wide }) {
  return <label className={`ad-field${wide ? " wide" : ""}`}><span>{label}</span>{children}{hint && <em>{hint}</em>}</label>;
}

export function ColorField({ label, hint, value, onChange }) {
  const [txt, setTxt] = useState(value);
  useEffect(() => setTxt(value), [value]);
  const commit = (v) => { const h = parseColor(v); if (h) onChange(h); else setTxt(value); };
  return (
    <Field label={label} hint={hint}>
      <div className="ad-color">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={`${label} — seletor`} />
        <input value={txt} onChange={(e) => setTxt(e.target.value)} onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit(e.target.value))} aria-label={`${label} — código`} />
        <small>{hexToRgb(value)}</small>
      </div>
    </Field>
  );
}

export function ImagePicker({ value, onChange, label = "Enviar imagem", square }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setErr("");
    try { onChange(await uploadImage(f)); } catch (x) { setErr(x.message); }
    setBusy(false); e.target.value = "";
  }
  return (
    <div className="ad-img">
      <div className={`ad-img-prev${square ? " sq" : ""}`}>{value ? <img src={value} alt="" /> : <span>Sem imagem</span>}</div>
      <div className="ad-img-actions">
        <button type="button" className="ad-btn" onClick={() => ref.current.click()} disabled={busy}>{busy ? "Enviando…" : value ? "Trocar imagem" : label}</button>
        {value && <button type="button" className="ad-btn ghost" onClick={() => onChange("")}>Remover</button>}
        <small>JPG, PNG ou WebP, até 8 MB.</small>
        {err && <small className="ad-err">{err}</small>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    </div>
  );
}

export function Card({ title, desc, children, aside }) {
  return <section className="ad-card"><header><div><h2>{title}</h2>{desc && <p>{desc}</p>}</div>{aside}</header>{children}</section>;
}
