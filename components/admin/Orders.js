"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { brl } from "@/lib/data";
import { Card } from "./ui";

export const STATUS = {
  novo: "Novo", aprovado: "Aprovado", producao: "Em produção", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado",
};
const FLOW = ["novo", "aprovado", "producao", "pronto", "entregue"];

export default function Orders({ setToast, onCount }) {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("abertos");
  const [open, setOpen] = useState(null);

  async function load() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) { setErr(error.message); setOrders([]); return; }
    setOrders(data); onCount?.(data.filter((o) => o.status === "novo").length);
  }
  useEffect(() => { load(); }, []);

  async function update(o, fields, msg) {
    const { data, error } = await supabase.from("orders").update(fields).eq("id", o.id).select().single();
    if (error) return setToast(error.message);
    const next = orders.map((x) => (x.id === o.id ? data : x));
    setOrders(next); onCount?.(next.filter((x) => x.status === "novo").length);
    if (msg) setToast(msg);
  }
  async function del(o) {
    if (!confirm(`Excluir o pedido de ${o.customer}? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    if (error) return setToast(error.message);
    const next = orders.filter((x) => x.id !== o.id);
    setOrders(next); onCount?.(next.filter((x) => x.status === "novo").length); setToast("Pedido excluído");
  }

  if (orders === null) return <p className="ad-muted">Carregando pedidos…</p>;
  if (err && /relation|does not exist|schema cache/i.test(err)) {
    return (
      <>
        <h1 className="ad-h1">Pedidos</h1>
        <p className="ad-alert">A tabela de pedidos ainda não foi criada. Rode o arquivo <b>supabase/migration_pedidos.sql</b> no SQL Editor do Supabase e recarregue esta página.</p>
      </>
    );
  }

  const counts = Object.fromEntries(Object.keys(STATUS).map((k) => [k, orders.filter((o) => o.status === k).length]));
  const list = orders.filter((o) => filter === "todos" ? true : filter === "abertos" ? !["entregue", "cancelado"].includes(o.status) : o.status === filter);
  const fmt = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const day = (d) => (d ? d.split("-").reverse().join("/") : "—");

  return (
    <>
      <div className="ad-titlebar">
        <h1 className="ad-h1">Pedidos</h1>
        <button className="ad-btn ghost" onClick={load}>Atualizar</button>
      </div>
      <div className="ad-filters">
        {[["abertos", "Em aberto"], ...Object.entries(STATUS), ["todos", "Todos"]].map(([k, l]) => (
          <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
            {l}{counts[k] !== undefined && ` (${counts[k]})`}
          </button>
        ))}
      </div>
      <Card title={`${list.length} pedido(s)`} desc="Os pedidos entram aqui automaticamente quando o cliente toca em “Enviar pedido pelo WhatsApp”.">
        {list.length === 0 ? <p className="ad-muted">Nenhum pedido nesta lista.</p> : (
          <ul className="ad-orders">
            {list.map((o) => (
              <li key={o.id} className={`st-${o.status}`}>
                <button className="ad-order-head" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <span className={`ad-st st-${o.status}`}>{STATUS[o.status]}</span>
                  <strong>{o.customer}</strong>
                  <span className="ad-muted">{fmt(o.created_at)} · para {day(o.wanted_date)}</span>
                  <b>{brl(o.total)}</b>
                </button>
                {open === o.id && (
                  <div className="ad-order-body">
                    {o.items.map((it, i) => (
                      <div key={i} className="ad-order-item">
                        <strong>Item {i + 1}: {it.name}</strong>
                        <span>Quantidade: {it.label}</span>
                        {it.lines.filter((l) => !/^Kit:/.test(l)).map((l, j) => <span key={j}>{l.replace(/::/g, ":")}</span>)}
                        <span>Valor: {brl(it.price * it.qty)}</span>
                      </div>
                    ))}
                    <dl className="ad-order-info">
                      <div><dt>Recebimento</dt><dd>{o.delivery || "—"}</dd></div>
                      <div><dt>Pagamento</dt><dd>{o.payment || "—"}</dd></div>
                      <div><dt>Condição</dt><dd>{o.condition || "—"}</dd></div>
                      <div><dt>Data desejada / do evento</dt><dd>{day(o.wanted_date)}</dd></div>
                      {o.theme && <div><dt>Tema</dt><dd>{o.theme}</dd></div>}
                      {o.doubts && <div><dt>Dúvidas</dt><dd>{o.doubts}</dd></div>}
                    </dl>
                    <label className="ad-field"><span>Anotações internas (o cliente não vê)</span>
                      <textarea rows={2} defaultValue={o.notes} onBlur={(e) => e.target.value !== o.notes && update(o, { notes: e.target.value }, "Anotação salva")} />
                    </label>
                    <div className="ad-row">
                      {o.status === "novo" && <button className="ad-btn" onClick={() => update(o, { status: "aprovado" }, "Pedido aprovado")}>Aprovar pedido</button>}
                      {FLOW.includes(o.status) && o.status !== "novo" && o.status !== "entregue" && (
                        <button className="ad-btn" onClick={() => { const n = FLOW[FLOW.indexOf(o.status) + 1]; update(o, { status: n }, `Pedido: ${STATUS[n]}`); }}>
                          Marcar como {STATUS[FLOW[FLOW.indexOf(o.status) + 1]]}
                        </button>
                      )}
                      <select className="ad-input" style={{ width: "auto" }} value={o.status} onChange={(e) => update(o, { status: e.target.value }, `Pedido: ${STATUS[e.target.value]}`)} aria-label="Situação">
                        {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                      <button className="ad-btn ghost" onClick={async () => { await navigator.clipboard.writeText(o.message); setToast("Mensagem copiada"); }}>Copiar mensagem</button>
                      {o.status !== "cancelado" && <button className="ad-btn ghost danger" onClick={() => update(o, { status: "cancelado" }, "Pedido cancelado")}>Cancelar</button>}
                      <button className="ad-btn ghost danger" onClick={() => del(o)}>Excluir</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
