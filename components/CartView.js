"use client";
import Link from "next/link";
import { useState } from "react";
import { brl, cssVars, waLink, saleLabel, paymentLists } from "@/lib/data";
import { useCart, setQty, removeItem, clearCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { WaIcon } from "./Icons";

export default function CartView({ settings: s }) {
  const items = useCart();
  const modes = [s.delivery.app && "Entrega por aplicativo", s.delivery.pickup && "Retirada"].filter(Boolean);
  const [mode, setMode] = useState("");
  const pay = s.payments.show ? paymentLists(s.payments) : { methods: [], conditions: [] };
  const payShort = { "Pix": "Pix", "Cartão de débito": "Débito", "Dinheiro": "Dinheiro" };
  const [method, setMethod] = useState("");
  const [cond, setCond] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [theme, setTheme] = useState("");
  const [doubts, setDoubts] = useState("");
  const [sent, setSent] = useState(false);
  const total = (items || []).reduce((a, x) => a + x.price * x.qty, 0);
  const wa = s.whatsapp_enabled && s.whatsapp;

  const [err, setErr] = useState("");
  function send() {
    setErr("");
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return setErr("Informe seu nome e sobrenome.");
    if (modes.length && !mode) return setErr("Escolha como prefere receber o pedido.");
    if (pay.methods.length && !method) return setErr("Escolha a forma de pagamento.");
    if (!date) return setErr("Informe a data desejada ou do evento.");
    const L = "━━━━━━━━━━━━━";
    const out = [`Olá, *${s.name}*! 😊`, "Gostaria de fazer um pedido.", "", `👤 *Cliente:* ${name.trim()}`, "", L, "*DADOS DO PEDIDO*", ""];
    items.forEach((x, i) => {
      out.push(`• *Item ${i + 1}: ${x.name}*`, `• *Quantidade:* ${saleLabel(x, x.qty)}`);
      x.lines.filter((l) => !/^Kit:/.test(l)).forEach((l) => {
        const t = l.replace(/::/g, ":"); const i2 = t.indexOf(":");
        out.push(i2 > 0 ? `• *${t.slice(0, i2).trim()}:* ${t.slice(i2 + 1).trim()}` : `• ${t}`);
      });
      out.push(x.qty > 1 ? `• *Valor:* ${brl(x.price)} cada (subtotal ${brl(x.price * x.qty)})` : `• *Valor:* ${brl(x.price)}`, "");
    });
    out.push(L, `*VALOR TOTAL: ${brl(total)}*`, "");
    if (mode) out.push(`• *Recebimento:* ${mode}`);
    if (method) out.push(`• *Pagamento:* ${method}`);
    if (pay.conditions.length) out.push(`• *Condição:* ${pay.conditions.join(" ou ")}`);
    if (date) out.push(`• *Data desejada / do evento:* ${date.split("-").reverse().join("/")}`);
    if (theme.trim()) out.push(`• *Tema para confecção:* ${theme.trim()}`);
    if (doubts.trim()) out.push(`• *Dúvidas:* ${doubts.trim()}`);
    out.push("", "", "Aguardo a confirmação do pedido. Obrigado(a)!");
    const message = out.join("\n");
    window.open(waLink(s.whatsapp, message), "_blank");
    // registra o pedido no painel e esvazia o carrinho
    const order = {
      customer: name.trim(), total, delivery: mode, payment: method, condition: pay.conditions.join(" ou "),
      wanted_date: date || null, theme: theme.trim(), doubts: doubts.trim(), message,
      items: items.map((x) => ({ id: x.id, name: x.name, qty: x.qty, price: x.price, lines: x.lines, photo: x.photo, label: saleLabel(x, x.qty) })),
    };
    supabase.from("orders").insert(order).then(() => {}, () => {});
    clearCart();
    setSent(true);
  }

  return (
    <main className="cat" style={cssVars(s.colors, s.fonts, s.shadow)}>
      <nav className="pbar"><Link href="/" className="nav-btn">Catálogo</Link></nav>
      <section className="block cart">
        <h1 className="sec-title">Seu carrinho</h1>
        {sent && (
          <div className="sent-ok">
            <strong>Pedido enviado! 🎉</strong>
            <p>Confirme o envio da mensagem no WhatsApp. Em breve retornaremos com a confirmação.</p>
          </div>
        )}
        {items === null ? null : items.length === 0 ? (
          <div className="empty"><p>Seu carrinho está vazio.</p><Link className="btn" href="/">Ver produtos</Link></div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((x) => (
                <li key={x.key}>
                  <div className="cart-img">{x.photo ? <img src={x.photo} alt="" /> : <span className="ph">{x.name.charAt(0)}</span>}</div>
                  <div className="cart-info">
                    <Link href={`/produto/${x.id}`}><strong>{x.name}</strong></Link>
                    {x.sale_type === "kit" && x.kit_qty && <small>Kit com {x.kit_qty} {x.kit_unit || "unidades"}</small>}
                    {x.lines.map((l, i) => <small key={i}>{l}</small>)}
                    <div className="cart-row">
                      <div className="qty">
                        <button onClick={() => setQty(x.key, x.qty - 1)} aria-label="Diminuir">−</button>
                        <span>{x.qty}</span>
                        <button onClick={() => setQty(x.key, x.qty + 1)} disabled={x.max != null && x.qty >= x.max} aria-label="Aumentar">+</button>
                      </div>
                      <strong>{brl(x.price * x.qty)}</strong>
                    </div>
                    <button className="link-btn" onClick={() => removeItem(x.key)}>Remover</button>
                  </div>
                </li>
              ))}
            </ul>
            <fieldset className="pick">
              <legend>Nome e sobrenome</legend>
              <input className="opt-input" value={name} maxLength={100} autoComplete="name" placeholder="Seu nome completo" onChange={(e) => { setName(e.target.value); setErr(""); }} />
            </fieldset>
            {modes.length > 0 && (
              <fieldset className="pick">
                <legend>Como prefere receber?</legend>
                <div className="pills">{modes.map((m) => <button key={m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); setErr(""); }}>{m}</button>)}</div>
                {mode && (
                  <div className="mode-info">
                    {mode === "Retirada" ? s.delivery.pickup_text : s.delivery.app_text}
                  </div>
                )}
              </fieldset>
            )}
            {pay.methods.length > 0 && (
              <fieldset className="pick">
                <legend>Escolha a forma de pagamento</legend>
                <div className="pills">{pay.methods.map((m) => {
                  const label = payShort[m] || "Link de pagamento – crédito (possui taxa da operadora)";
                  return <button key={m} className={method === label ? "on" : ""} onClick={() => { setMethod(label); setErr(""); }}>{label}</button>;
                })}</div>
              </fieldset>
            )}
            {pay.conditions.length > 0 && (
              <p className="pay-alert" role="note">
                <span aria-hidden="true">⚠️</span>
                {pay.conditions.length === 1 && s.payments.full
                  ? "Para confirmar o pedido, é necessário o pagamento integral."
                  : `${pay.conditions.join(" ou ")}.`}
              </p>
            )}
            <fieldset className="pick">
              <legend>Data desejada ou do evento</legend>
              <input className="opt-input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setErr(""); }} />
            </fieldset>
            <fieldset className="pick">
              <legend>Tema para confecção do produto <em>(opcional)</em></legend>
              <input className="opt-input" value={theme} maxLength={200} placeholder="Ex.: floral, Stitch, tons de rosa…" onChange={(e) => { setTheme(e.target.value); setErr(""); }} />
            </fieldset>
            <fieldset className="pick">
              <legend>Dúvidas <em>(opcional)</em></legend>
              <textarea className="opt-input" rows={3} maxLength={400} value={doubts} placeholder="Escreva aqui se tiver alguma dúvida" onChange={(e) => setDoubts(e.target.value)} />
            </fieldset>
            <div className="cart-total"><span>Total dos produtos</span><strong>{brl(total)}</strong></div>
            <p className="hint">O pedido é confirmado no atendimento pelo WhatsApp.</p>
            {err && <p className="err" role="alert">{err}</p>}
            {wa && <button className="btn block" onClick={send}><WaIcon /> Enviar pedido pelo WhatsApp</button>}
            <Link href="/" className="btn ghost block">Continuar comprando</Link>
          </>
        )}
      </section>
    </main>
  );
}
