"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brl, waLink, openStatus, hasPromo, productAvailable, DAYS, cssVars, hourLabel, saleBadge, paymentLists } from "@/lib/data";
import { WaIcon, LinkIcon } from "./Icons";
import CartButton from "./CartButton";

export function Price({ p }) {
  const kp = (p.specs?.kit?.options || []).map((o) => o.price).filter((v) => v !== "" && v != null).map(Number);
  if (p.sale_type === "kit" && kp.length) {
    const min = Math.min(...kp, ...(kp.length < (p.specs.kit.options || []).length ? [Number(p.price)] : []));
    const many = new Set([...kp, Number(p.price)]).size > 1;
    return <div className="price"><strong>{many && <small>a partir de </small>}{brl(min)}</strong></div>;
  }
  const ranged = (p.variations || []).some((g) => g.values.some((v) => v.price !== "" && v.price != null && (g.price_mode === "add" ? Number(v.price) > 0 : Number(v.price) !== Number(p.price))));
  if (hasPromo(p)) return <div className="price"><strong>{brl(p.promo_price)}</strong><s>{brl(p.price)}</s></div>;
  return <div className="price"><strong>{ranged && <small>a partir de </small>}{brl(p.price)}</strong></div>;
}

/* Topo: faixa colorida com o logotipo redondo sobreposto e a frase abaixo */
export function Hero({ s }) {
  const b = s.banner;
  const img = b.enabled && b.type === "image" && b.image;
  const band = !b.enabled ? { background: "linear-gradient(120deg, var(--primary), var(--accent))" } : img ? { backgroundImage: `url(${b.image})` } : { background: b.color };
  const text = b.enabled && (b.title || b.subtitle);
  return (
    <header className={`hero${img ? " is-img" : ""}${b.enabled ? "" : " no-band"}`}>
      <div className="hero-band" style={b.enabled ? band : undefined}>
        <div className="hero-logo">{s.logo ? <img src={s.logo} alt={`Logo ${s.name}`} /> : <span>{s.name}</span>}</div>
        {text && (
          <div className="hero-text">
            {b.title && <h2 style={{ fontSize: `${Number(b.title_size) || 26}px` }}>{b.title}</h2>}
            {b.subtitle && <p>{b.subtitle}</p>}
          </div>
        )}
      </div>
    </header>
  );
}

function Card({ p, preview, compact }) {
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
        <h3 className="card-name">{p.name}</h3>
        <p className="card-sale">{saleBadge(p) || "\u00a0"}</p>
        <Price p={p} />
        <span className="card-cta">{compact ? "Ver" : "Ver produto"}</span>
      </div>
    </>
  );
  const cls = `card${compact ? " compact" : ""}`;
  return preview ? <div className={cls}>{inner}</div> : <Link href={`/produto/${p.id}`} className={cls}>{inner}</Link>;
}

const Grid = ({ items, preview, compact }) => (
  <div className={compact ? "grid grid3" : "grid"}>{items.map((p) => <Card key={p.id} p={p} preview={preview} compact={compact} />)}</div>
);

export default function Catalog({ settings: s, categories = [], products = [], preview = false }) {
  const [cat, setCat] = useState(null);   // null = início; "all" = todos; id = uma categoria
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  const top = useRef();

  useEffect(() => {
    if (preview) return;
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) setCat(c);
  }, []);
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
  const loose = visible.filter((p) => !cats.some((c) => c.id === p.category_id));
  const featured = visible.filter((p) => p.featured);
  const results = q ? visible.filter((p) => `${p.name} ${p.description || ""}`.toLowerCase().includes(q.toLowerCase())) : [];
  const current = cats.find((c) => c.id === cat);
  const wa = s.whatsapp_enabled && s.whatsapp;
  const vars = cssVars(s.colors, s.fonts);

  function choose(id) {
    setCat(id); setQ("");
    if (!preview) {
      window.history.replaceState(null, "", id ? `/?c=${id}` : "/");
      setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    }
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

  const chips = cats.length > 1 && (
    <nav className="chips" aria-label="Categorias">
      <button className={!cat ? "on" : ""} onClick={() => choose(null)}>Início</button>
      {cats.map((c) => <button key={c.id} className={cat === c.id ? "on" : ""} onClick={() => choose(c.id)}>{c.name}</button>)}
      <button className={cat === "all" ? "on" : ""} onClick={() => choose("all")}>Todos</button>
    </nav>
  );

  let body;
  if (!visible.length) body = <p className="empty">Em breve, novos produtos por aqui.</p>;
  else if (q) body = results.length ? <Grid items={results} preview={preview} /> : <p className="empty">Nenhum produto encontrado para “{q}”.</p>;
  else if (current) body = <><h3 className="cat-title">{current.name}</h3><Grid items={current.items} preview={preview} /></>;
  else if (cat === "all" || cats.length === 0) body = <Grid items={visible} preview={preview} />;
  else body = (
    <>
      {cats.map((c) => (
        <section key={c.id} className="cat-sec">
          <div className="cat-sec-head">
            <h3>{c.name}</h3>
            {c.items.length > 3 && <button className="link-btn" onClick={() => choose(c.id)}>Ver tudo ({c.items.length})</button>}
          </div>
          <Grid items={c.items.slice(0, 3)} preview={preview} compact />
          {c.items.length > 3 && <button className="btn ghost block see-more" onClick={() => choose(c.id)}>Ver mais produtos de {c.name}</button>}
        </section>
      ))}
      {loose.length > 0 && (
        <section className="cat-sec">
          <div className="cat-sec-head"><h3>Outros produtos</h3></div>
          <Grid items={loose} preview={preview} compact />
        </section>
      )}
    </>
  );

  const pay = paymentLists(s.payments);
  const showPay = s.payments.show && (pay.methods.length || pay.conditions.length);
  const about = s.about;
  const showAbout = about.enabled && (about.text || about.photo);

  return (
    <main className={`cat${preview ? " is-preview" : ""}`} style={vars}>
      <div className="topbar">{preview ? <span className="nav-btn">Carrinho</span> : <CartButton />}</div>
      <Hero s={s} />
      <section className="ident">
        <h1>{s.name}</h1>
        {s.slogan && <p className="slogan">{s.slogan}</p>}
        {s.hours.show && open !== null && <span className={`status ${open ? "on" : "off"}`}>{open ? "Aberto agora" : "Fechado agora"}</span>}
        {s.description && <p className="desc">{s.description}</p>}
        <div className="ident-actions">
          {wa && <a className="btn" href={waLink(s.whatsapp, `Olá! Vim pelo catálogo da ${s.name}.`)} target="_blank" rel="noreferrer"><WaIcon /> Chamar no WhatsApp</a>}
          <button className="btn ghost" onClick={share}>{copied ? "Link copiado" : "Compartilhar"}</button>
        </div>
        {(s.links || []).filter((l) => l.url).length > 0 && (
          <div className="social">
            {s.links.filter((l) => l.url).map((l, i) => (
              <a key={i} className="social-btn" href={l.url} target="_blank" rel="noreferrer"><LinkIcon type={l.type} /> {l.label || l.type}</a>
            ))}
          </div>
        )}
      </section>

      {featured.length > 0 && !cat && !q && (
        <section className="block">
          <h2 className="sec-title">Destaques</h2>
          <Grid items={featured} preview={preview} />
        </section>
      )}

      <section className="block" ref={top}>
        <h2 className="sec-title">Nossos produtos</h2>
        {visible.length > 0 && (
          <input className="search" type="search" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar produto" />
        )}
        {!q && chips}
        {body}
      </section>

      {showAbout && (
        <section className="about">
          {about.photo && <div className="about-photo"><img src={about.photo} alt="" /></div>}
          {about.title && <h2>{about.title}</h2>}
          {about.text && <div className="about-text">{about.text.split("\n").filter(Boolean).map((l, i) => <p key={i}>{l}</p>)}</div>}
        </section>
      )}

      {(s.hours.show || delivery.length > 0 || showPay) && (
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
          {showPay && (
            <div>
              <h2 className="sec-title">Formas de pagamento</h2>
              {pay.methods.length > 0 && <div className="deliv"><strong>Aceitamos</strong><ul className="pay-list">{pay.methods.map((m) => <li key={m}>{m}</li>)}</ul></div>}
              {pay.conditions.length > 0 && <div className="deliv"><strong>Condições</strong><ul className="pay-list">{pay.conditions.map((m) => <li key={m}>{m}</li>)}</ul></div>}
              {s.payments.note && <p className="hint">{s.payments.note}</p>}
            </div>
          )}
        </section>
      )}

      <footer className="foot">
        {s.policies.text && (preview ? <span className="btn ghost">{s.policies.title}</span> : <Link className="btn ghost" href="/politicas">{s.policies.title || "Políticas da loja"}</Link>)}
        <p>{s.name}{s.slogan ? ` — ${s.slogan}` : ""}</p>
      </footer>
      {wa && <a className="wa-float" href={waLink(s.whatsapp, `Olá! Vim pelo catálogo da ${s.name}.`)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WaIcon size={26} /></a>}
    </main>
  );
}
