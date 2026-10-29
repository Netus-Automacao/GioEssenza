"use client";
import Link from "next/link";
import { useState } from "react";
import { brl, cssVars, waLink, saleLabel, paymentLists } from "@/lib/data";
import { useCart, setQty, removeItem, clearCart } from "@/lib/cart";
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
  const [obs, setObs] = useState("");
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
    if (pay.conditions.length && !cond) return setErr("Escolha a condição de pagamento.");
    const L = "━━━━━━━━━━━━";
    const out = [`Olá, *${s.name}*! 😊`, "Gostaria de fazer um pedido pelo catálogo.", ""];
    if (name.trim()) out.push(`👤 *Cliente:* ${name.trim()}`, "");
    out.push(L, "🛍️ *PEDIDO*", "");
    items.forEach((x, i) => {
      out.push(`*${i + 1}. ${x.name}*`, `• Quantidade: ${saleLabel(x, x.qty)}`);
      x.lines.forEach((l) => out.push(`• ${l}`));
      if (x.prazo) out.push(`• Prazo de confecção: ${x.prazo}`);
      out.push(x.qty > 1 ? `• Valor: ${brl(x.price)} cada — subtotal ${brl(x.price * x.qty)}` : `• Valor: ${brl(x.price)}`, "");
    });
    out.push(L, `💰 *Total dos produtos: ${brl(total)}*`, "");
    if (mode) out.push(`🚚 *Recebimento:* ${mode}`);
    if (method) out.push(`💳 *Pagamento:* ${method}`);
    if (cond) out.push(`📌 *Condição:* ${cond}`);
    if (obs.trim()) out.push(`📝 *Observações:* ${obs.trim()}`);
    out.push("", "Aguardo a confirmação da agenda e do valor final. Obrigado(a)!");
    window.open(waLink(s.whatsapp, out.join("\n")), "_blank");
    setSent(true);
  }

  return (
    <main className="cat" style={cssVars(s.colors, s.fonts)}>
      <nav className="pbar"><Link href="/" className="nav-btn">Catálogo</Link></nav>
      <section className="block cart">
        <h1 className="sec-title">Seu carrinho</h1>
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
                <p className="hint">{[s.delivery.app && s.delivery.app_text, s.delivery.pickup && s.delivery.pickup_text].filter(Boolean).join(" ")}</p>
              </fieldset>
            )}
            {pay.methods.length > 0 && (
              <fieldset className="pick">
                <legend>Forma de pagamento</legend>
                <div className="pills">{pay.methods.map((m) => {
                  const label = payShort[m] || "Link de pagamento – crédito (possui taxa da operadora)";
                  return <button key={m} className={method === label ? "on" : ""} onClick={() => { setMethod(label); setErr(""); }}>{label}</button>;
                })}</div>
              </fieldset>
            )}
            {pay.conditions.length > 0 && (
              <fieldset className="pick">
                <legend>Condição de pagamento</legend>
                <div className="pills">{pay.conditions.map((m) => <button key={m} className={cond === m ? "on" : ""} onClick={() => { setCond(m); setErr(""); }}>{m}</button>)}</div>
              </fieldset>
            )}
            <fieldset className="pick">
              <legend>Observações</legend>
              <textarea className="opt-input" rows={3} maxLength={400} value={obs} placeholder="Data desejada, tema, dúvidas… (se não houver, deixe em branco)" onChange={(e) => setObs(e.target.value)} />
            </fieldset>
            <div className="cart-total"><span>Total dos produtos</span><strong>{brl(total)}</strong></div>
            <p className="hint">Valores sem entrega. O pedido é confirmado no atendimento pelo WhatsApp.</p>
            {err && <p className="err" role="alert">{err}</p>}
            {wa && <button className="btn block" onClick={send}><WaIcon /> Enviar pedido pelo WhatsApp</button>}
            <Link href="/" className="btn ghost block">Continuar comprando</Link>
            {sent && (
              <p className="ok">Confirme o envio da mensagem no WhatsApp. Já enviou?{" "}
                <button className="link-btn" onClick={() => { clearCart(); setSent(false); }}>Esvaziar carrinho</button></p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
