"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brl, waLink, openStatus, hasPromo, productAvailable, DAYS, cssVars, hourLabel, saleBadge } from "@/lib/data";
import { WaIcon } from "./Icons";
import CartButton from "./CartButton";

export function Price({ p }) {
  const ranged = (p.variations || []).some((g) => g.values.some((v) => v.price !== "" && v.price != null && (g.price_mode === "add" ? Number(v.price) > 0 : Number(v.price) !== Number(p.price))));
  if (hasPromo(p)) return <div className="price"><strong>{brl(p.promo_price)}</strong><s>{brl(p.price)}</s></div>;
  return <div className="price"><strong>{ranged && <small>a partir de </small>}{brl(p.price)}</strong></div>;
}

export function Cover({ s }) {
  const b = s.banner;
  const img = b.enabled && b.type === "image" && b.image;
  const text = b.enabled && (b.title || b.subtitle);
  const style = !b.enabled ? { background: "linear-gradient(120deg, var(--primary), var(--accent))" } : img ? { backgroundImage: `url(${b.image})` } : { background: b.color };
  return (
    <header className={`cover${text ? " has-text" : ""}${img ? " is-img" : ""}`} style={style}>
      {text && <div className="cover-text">{b.title && <h2>{b.title}</h2>}{b.subtitle && <p>{b.subtitle}</p>}</div>}
    </header>
  );
}

function Card({ p, preview }) {
  const off = hasPromo(p) ? Math.round((1 - p.promo_price / p.price) * 100) : 0;
  const inner = (
    <>
      <div className="card-img">
        {p.photos?.[0] ? <img src={p.photos[0]} alt={p.name} loading="lazy" /> : <span className="ph">{p.name.charAt(0)}</span>}
        <div className="badges">
          {off > 0 && <span className="badge promo">−{off}%</span>}
          {!productAvailable(p) && <span className="badge out">Indisponível</span>}
        </div>
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        {saleBadge(p) && <p className="card-sale">{saleBadge(p)}</p>}
        <Price p={p} />
        <span className="card-cta">Ver produto</span>
      </div>
    </>
  );
  return preview ? <div className="card">{inner}</div> : <Link href={`/produto/${p.id}`} className="card">{inner}</Link>;
}

const Grid = ({ items, preview }) => <div className="grid">{items.map((p) => <Card key={p.id} p={p} preview={preview} />)}</div>;

export default function Catalog({ settings: s, categories = [], products = [], preview = false }) {
  const [cat, setCat] = useState(null);   // null = lista de categorias; "all" = todos; id = uma categoria
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  const top = useRef();

  useEffect(() => {
    const f = () => setOpen(openStatus(s.hours));
    f();
    const t = setInterval(f, 60000);
    return () => clearInterval(t);
  }, [s.hours]);

  const visible = products.filter((p) => p.active !== false);
  const cats = categories.filter((c) => c.active !== false)
    .map((c) => ({ ...c, items: visible.filter((p) => p.category_id === c.id) }))
    .filter((c) => c.items.length);
  const featured = visible.filter((p) => p.featured);
  const results = q ? visible.filter((p) => `${p.name} ${p.description || ""}`.toLowerCase().includes(q.toLowerCase())) : [];
  const current = cats.find((c) => c.id === cat);
  const wa = s.whatsapp_enabled && s.whatsapp;
  const vars = cssVars(s.colors, s.fonts);

  function choose(id) {
    setCat(id); setQ("");
    if (!preview) setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }
  async function share() {
    const url = s.public_url || window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: s.name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  }

  if (!s.active && !preview) {
    return (
      <main className="cat" style={vars}>
        <div className="closed-page">
          {s.logo && <img src={s.logo} alt="" className="closed-logo" />}
          <h1>{s.name}</h1>
          <p>O catálogo está temporariamente indisponível. Volte em breve.</p>
          {wa && <a className="btn" href={waLink(s.whatsapp)} target="_blank" rel="noreferrer"><WaIcon /> Falar no WhatsApp</a>}
        </div>
      </main>
    );
  }

  const delivery = [
    s.delivery.app && { t: "Entrega por aplicativo", d: s.delivery.app_text },
    s.delivery.pickup && { t: "Retiradas", d: s.delivery.pickup_text },
  ].filter(Boolean);

  // o que mostrar na seção de produtos
  let body;
  if (!visible.length) body = <p className="empty">Em breve, novos produtos por aqui.</p>;
  else if (q) body = results.length ? <Grid items={results} preview={preview} /> : <p className="empty">Nenhum produto encontrado para “{q}”.</p>;
  else if (cat === "all" || cats.length <= 1) body = <Grid items={visible} preview={preview} />;
  else if (current) body = <Grid items={current.items} preview={preview} />;
  else body = (
    <>
      <div className="cat-grid">
        {cats.map((c) => {
          const ph = c.items.find((p) => p.photos?.[0])?.photos[0];
          return (
            <button key={c.id} className="cat-tile" onClick={() => choose(c.id)}>
              <span className="cat-tile-img">{ph ? <img src={ph} alt="" /> : <span className="ph">{c.name.charAt(0)}</span>}</span>
              <span className="cat-tile-name">{c.name}</span>
              <span className="cat-tile-count">{c.items.length} {c.items.length === 1 ? "produto" : "produtos"}</span>
            </button>
          );
        })}
      </div>
      <button className="btn ghost block" onClick={() => choose("all")}>Ver todos os produtos</button>
    </>
  );

  return (
    <main className={`cat${preview ? " is-preview" : ""}`} style={vars}>
      <div className="topbar">{preview ? <span className="nav-btn">Carrinho</span> : <CartButton />}</div>
      <Cover s={s} />
      <section className="ident">
        <div className="logo">{s.logo ? <img src={s.logo} alt={`Logo ${s.name}`} /> : <span>{s.name}</span>}</div>
        <h1>{s.name}</h1>
        {s.slogan && <p className="slogan">{s.slogan}</p>}
        {s.hours.show && open !== null && <span className={`status ${open ? "on" : "off"}`}>{open ? "Aberto agora" : "Fechado agora"}</span>}
        {s.description && <p className="desc">{s.description}</p>}
        <div className="ident-actions">
          {wa && <a className="btn" href={waLink(s.whatsapp, `Olá! Vim pelo catálogo da ${s.name}.`)} target="_blank" rel="noreferrer"><WaIcon /> Chamar no WhatsApp</a>}
          <button className="btn ghost" onClick={share}>{copied ? "Link copiado" : "Compartilhar"}</button>
        </div>
      </section>

      {featured.length > 0 && !cat && !q && (
        <section className="block">
          <h2 className="sec-title">Destaques</h2>
          <Grid items={featured} preview={preview} />
        </section>
      )}

      <section className="block" ref={top}>
        <h2 className="sec-title">{current ? current.name : cat === "all" ? "Todos os produtos" : "Nossos produtos"}</h2>
        {(current || cat === "all") && !q && (
          <button className="btn block back-cats" onClick={() => choose(null)}>Ver todas as categorias</button>
        )}
        {visible.length > 0 && (
          <input className="search" type="search" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar produto" />
        )}
        {cats.length > 1 && !cat && !q && <p className="hint">Escolha uma categoria:</p>}
        {body}
      </section>

      {(s.hours.show || delivery.length > 0) && (
        <section className="block info">
          {s.hours.show && (
            <div>
              <h2 className="sec-title">Horário de atendimento</h2>
              <ul className="hours">
                {s.hours.days.map((d, i) => (
                  <li key={i}><span>{DAYS[i]}</span><span>{d.open ? `${hourLabel(d.start)} às ${hourLabel(d.end)}` : "Fechado"}</span></li>
                ))}
              </ul>
            </div>
          )}
          {delivery.length > 0 && (
            <div>
              <h2 className="sec-title">Entrega e retirada</h2>
              {delivery.map((x) => <div className="deliv" key={x.t}><strong>{x.t}</strong><p>{x.d}</p></div>)}
            </div>
          )}
        </section>
      )}

      <footer className="foot">{s.name}{s.slogan ? ` — ${s.slogan}` : ""}</footer>
      {wa && <a className="wa-float" href={waLink(s.whatsapp, `Olá! Vim pelo catálogo da ${s.name}.`)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WaIcon size={26} /></a>}
    </main>
  );
}
