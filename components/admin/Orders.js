"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { brl } from "@/lib/data";
import { Card } from "./ui";

export const STATUS = {
  novo: "Novo", aprovado: "Aprovado", producao: "Em produção", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado",
};
const FLOW = ["novo", "aprovado", "producao", "pronto", "entregue"];

const first = (n) => String(n || "").trim().split(/\s+/)[0] || "";
const fill = (tpl, o) => String(tpl || "").replaceAll("{nome}", first(o.customer)).replaceAll("{nome_completo}", o.customer || "");

export default function Orders({ setToast, onCount, settings, saveSettings }) {
  const tpls = settings.order_msgs;
  const [compose, setCompose] = useState(null); // { o, st, text }
  const [editTpl, setEditTpl] = useState(false);
  const [tplDraft, setTplDraft] = useState(tpls);
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
  // abre o WhatsApp primeiro (no toque do botão, para o navegador não bloquear) e depois salva a etapa
  // muda a etapa; se o pedido tem WhatsApp, abre a mensagem para você revisar/escrever antes de enviar
  function advance(o, st) {
    if (st === "novo") return update(o, { status: st }, `Pedido: ${STATUS[st]}`);
    setCompose({ o, st, text: fill(tpls[st] || "", o) });
  }
  function sendCompose(withMsg) {
    const { o, st, text } = compose;
    if (withMsg === "copy") { navigator.clipboard.writeText(text); setToast("Mensagem copiada"); }
    else if (withMsg) window.open(`https://api.whatsapp.com/send?phone=${o.phone.replace(/\D/g, "")}&text=${encodeURIComponent(text)}`, "_blank");
    if (st !== o.status) update(o, { status: st }, `Pedido: ${STATUS[st]}`);
    setCompose(null);
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
      <Card title="Mensagens para o cliente" desc="Textos que aparecem prontos ao mudar a etapa do pedido. Você também pode editar a mensagem na hora, antes de enviar."
        aside={<button className="ad-btn ghost sm" onClick={() => { setTplDraft(tpls); setEditTpl(!editTpl); }}>{editTpl ? "Fechar" : "Editar mensagens"}</button>}>
        {editTpl && (
          <>
            <p className="ad-note">Use <b>{"{nome}"}</b> para o primeiro nome do cliente ou <b>{"{nome_completo}"}</b>. Use *asteriscos* para negrito no WhatsApp.</p>
            {Object.entries(STATUS).filter(([k]) => k !== "novo").map(([k, l]) => (
              <label key={k} className="ad-field"><span>Pedido {l.toLowerCase()}</span>
                <textarea rows={4} value={tplDraft[k] || ""} onChange={(e) => setTplDraft({ ...tplDraft, [k]: e.target.value })} />
              </label>
            ))}
            <div className="ad-row end">
              <button className="ad-btn" onClick={async () => { await saveSettings({ ...settings, order_msgs: tplDraft }); setEditTpl(false); }}>Salvar mensagens</button>
            </div>
          </>
        )}
      </Card>
      {compose && (
        <div className="ad-modal crop" role="dialog" aria-label="Mensagem para o cliente">
          <div className="crop-panel">
            <h2>Pedido {STATUS[compose.st].toLowerCase()} — mensagem para {first(compose.o.customer)}</h2>
            <p className="ad-muted">{compose.o.phone ? "Escreva ou ajuste a mensagem. Ao tocar em enviar, o WhatsApp abre com este texto." : "Este pedido não tem WhatsApp do cliente. Escreva a mensagem e copie para enviar."}</p>
            <textarea className="ad-input" rows={8} value={compose.text} onChange={(e) => setCompose({ ...compose, text: e.target.value })} />
            <div className="ad-row end">
              <button className="ad-btn ghost" onClick={() => setCompose(null)}>Cancelar</button>
              {compose.st !== compose.o.status && <button className="ad-btn ghost" onClick={() => sendCompose(false)}>Só mudar a etapa</button>}
              {compose.o.phone
                ? <button className="ad-btn" onClick={() => sendCompose(true)} disabled={!compose.text.trim()}>Enviar no WhatsApp</button>
                : <button className="ad-btn" onClick={() => sendCompose("copy")} disabled={!compose.text.trim()}>Copiar mensagem</button>}
            </div>
          </div>
        </div>
      )}
      <div className="ad-filters">
        {[["abertos", "Em aberto"], ...Object.entries(STATUS), ["todos", "Todos"]].map(([k, l]) => (
          <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
            {l}{counts[k] !== undefined && ` (${counts[k]})`}
          </button>
        ))}
      </div>
      <Card title={`${list.length} pedido(s)`} desc="Os pedidos entram aqui automaticamente. Ao aprovar ou mudar de etapa, o WhatsApp abre com a mensagem pronta para o cliente — é só tocar em enviar.">
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
                      <div><dt>WhatsApp</dt><dd>{o.phone ? `+${o.phone}` : "—"}</dd></div>
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
                      {o.status === "novo" && <button className="ad-btn" onClick={() => advance(o, "aprovado")}>Aprovar pedido</button>}
                      {FLOW.includes(o.status) && o.status !== "novo" && o.status !== "entregue" && (
                        <button className="ad-btn" onClick={() => advance(o, FLOW[FLOW.indexOf(o.status) + 1])}>
                          Marcar como {STATUS[FLOW[FLOW.indexOf(o.status) + 1]]}
                        </button>
                      )}
                      <select className="ad-input" style={{ width: "auto" }} value={o.status} onChange={(e) => advance(o, e.target.value)} aria-label="Situação">
                        {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                      {o.status !== "novo" && <button className="ad-btn ghost" onClick={() => advance(o, o.status)}>Enviar mensagem ({STATUS[o.status].toLowerCase()})</button>}
                      <button className="ad-btn ghost" onClick={async () => { await navigator.clipboard.writeText(o.message); setToast("Pedido copiado"); }}>Copiar pedido</button>
                      {o.phone && <a className="ad-btn ghost" href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Conversar no WhatsApp</a>}
                      {o.status !== "cancelado" && <button className="ad-btn ghost danger" onClick={() => advance(o, "cancelado")}>Cancelar</button>}
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
