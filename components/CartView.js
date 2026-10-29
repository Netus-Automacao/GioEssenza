"use client";
import Link from "next/link";
import { useState } from "react";
import { brl, cssVars, waLink, saleLabel } from "@/lib/data";
import { useCart, setQty, removeItem, clearCart } from "@/lib/cart";
import { WaIcon } from "./Icons";

export default function CartView({ settings: s }) {
  const items = useCart();
  const modes = [s.delivery.app && "Entrega por aplicativo, solicitado pelo cliente.", s.delivery.pickup && "Retirada pelo cliente."].filter(Boolean);
  const [mode, setMode] = useState("");
  const [sent, setSent] = useState(false);
  const total = (items || []).reduce((a, x) => a + x.price * x.qty, 0);
  const wa = s.whatsapp_enabled && s.whatsapp;

  function send() {
    const out = [`Olá! Gostaria de solicitar um pedido na *${s.name}* com os seguintes produtos:`, ""];
    items.forEach((x, i) => {
      out.push(`${i + 1}. *${x.name}*`, `Quantidade: ${saleLabel(x, x.qty)}`, ...x.lines,
        `Valor: ${brl(x.price)}${x.qty > 1 ? ` cada — subtotal ${brl(x.price * x.qty)}` : ""}`, "");
    });
    out.push(`*Total dos produtos: ${brl(total)}*`);
    if (mode) out.push(`Recebimento: ${mode}`);
    out.push("", "Gostaria de dar continuidade ao atendimento.");
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
                    {x.sale_type === "kit" && x.kit_qty && <small>Kit com {x.kit_qty} unidades</small>}
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
            {modes.length > 0 && (
              <fieldset className="pick">
                <legend>Como prefere receber? <em>(opcional)</em></legend>
                <div className="pills">{modes.map((m) => <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(mode === m ? "" : m)}>{m}</button>)}</div>
                <p className="hint">O transporte é contratado e pago pelo cliente. {s.delivery.pickup_note}</p>
              </fieldset>
            )}
            <div className="cart-total"><span>Total dos produtos</span><strong>{brl(total)}</strong></div>
            <p className="hint">Valores sem entrega. O pedido é confirmado no atendimento pelo WhatsApp.</p>
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
