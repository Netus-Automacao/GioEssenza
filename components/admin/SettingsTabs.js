"use client";
import { useEffect, useState } from "react";
import Catalog from "@/components/Catalog";
import { DAYS, contrast, FONTS, BODY_FONTS, WEIGHT_LABEL, fontsHref, fontFaceCss, titleFamily, bodyFamily } from "@/lib/data";
import { uploadFont } from "@/lib/supabase";
import { Toggle, Field, ColorField, ImagePicker, Card } from "./ui";

const SAMPLE = [
  { id: "a", name: "Agenda personalizada", price: 105, promo_price: 89, featured: true, photos: [], active: true },
  { id: "b", name: "Caderneta de vacinação", price: 65, photos: [], active: true },
  { id: "c", name: "Planner vertical", price: 87, photos: [], active: true },
  { id: "d", name: "Bloco de anotações", price: 27, photos: [], active: true },
];

function Preview({ s, prods, cats }) {
  return (
    <div className="ad-preview">
      <div className="ad-phone"><div className="ad-phone-screen">
        <Catalog settings={{ ...s, active: true }} categories={cats} products={prods?.some((p) => p.active) ? prods : SAMPLE} preview />
      </div></div>
      <p>Prévia no celular — atualiza enquanto você edita.</p>
    </div>
  );
}

const useOrigin = () => { const [o, setO] = useState(""); useEffect(() => setO(window.location.origin), []); return o; };

export function TabGeral({ s, set, save, prods, setToast, setTab }) {
  const origin = useOrigin();
  const url = s.public_url || origin;
  const activeCount = prods.filter((p) => p.active).length;
  return (
    <>
      <h1 className="ad-h1">Geral</h1>
      <Card title="Situação do catálogo" desc="Quando desativado, os clientes veem uma mensagem de catálogo temporariamente indisponível.">
        <Toggle label={s.active ? "Catálogo ativo" : "Catálogo desativado"} hint={s.active ? "Qualquer pessoa com o link vê seus produtos." : "Ninguém consegue ver os produtos agora."}
          checked={s.active} onChange={(v) => save({ ...s, active: v })} />
      </Card>
      <Card title="Resumo">
        <dl className="ad-summary">
          <div><dt>Loja</dt><dd>{s.name}</dd></div>
          <div><dt>Situação</dt><dd><span className={`ad-pill ${s.active ? "on" : ""}`}>{s.active ? "Ativo" : "Inativo"}</span></dd></div>
          <div><dt>Produtos</dt><dd>{activeCount} ativos de {prods.length} cadastrados</dd></div>
          <div><dt>Endereço</dt><dd className="ad-url">{url}</dd></div>
        </dl>
        <div className="ad-row">
          <a className="ad-btn" href="/" target="_blank" rel="noreferrer">Abrir catálogo</a>
          <button className="ad-btn ghost" onClick={async () => { await navigator.clipboard.writeText(url); setToast("Endereço copiado"); }}>Copiar endereço</button>
          <button className="ad-btn ghost" onClick={() => setTab("produtos", { newProduct: true })}>+ Novo produto</button>
          <button className="ad-btn ghost" onClick={() => setTab("produtos")}>Gerenciar produtos</button>
        </div>
      </Card>
    </>
  );
}

export function TabIdentidade({ s, set, save, setToast, prods, cats }) {
  const origin = useOrigin();
  const digits = s.whatsapp.replace(/\D/g, "");
  return (
    <div className="ad-split">
      <div>
        <h1 className="ad-h1">Identidade da loja</h1>
        <Card title="Logotipo" desc="Imagens quadradas ficam melhores.">
          <ImagePicker value={s.logo} onChange={(logo) => save({ ...s, logo })} label="Enviar logotipo" square />
          <p className="ad-note">O logotipo é salvo automaticamente assim que termina de enviar.</p>
        </Card>
        <Card title="Informações">
          <div className="ad-grid2">
            <Field label="Nome da loja"><input value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} /></Field>
            <Field label="Slogan"><input value={s.slogan} onChange={(e) => set({ slogan: e.target.value })} maxLength={80} /></Field>
          </div>
          <Field label="WhatsApp para pedidos" hint={digits.length < 12 ? "Inclua o código do país e o DDD. Exemplo: 5541987152125." : `Os pedidos vão para +${digits}.`}>
            <input inputMode="tel" value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d+ ()-]/g, "") })} />
          </Field>
          <Field label={`Descrição da loja (${s.description.length}/500)`} hint="Aparece logo abaixo do nome, no topo do catálogo.">
            <textarea rows={4} maxLength={500} value={s.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </Card>
        <Card title="Botões do WhatsApp" desc="Botão de contato na página inicial e botão de pedido em cada produto.">
          <Toggle label="Mostrar botões do WhatsApp" checked={s.whatsapp_enabled} onChange={(v) => set({ whatsapp_enabled: v })} />
        </Card>
        <Card title="Endereço do catálogo" desc="O endereço usado ao copiar e compartilhar o catálogo.">
          <Field label="Endereço público" hint={`Deixe vazio para usar o endereço atual (${origin}). Para um domínio próprio, como gioessenza.com.br, registre o domínio e adicione-o ao projeto na Vercel; depois cole-o aqui.`}>
            <input type="url" placeholder={origin} value={s.public_url} onChange={(e) => set({ public_url: e.target.value.trim() })} />
          </Field>
          <button className="ad-btn ghost" onClick={async () => { await navigator.clipboard.writeText(s.public_url || origin); setToast("Endereço copiado"); }}>Copiar endereço</button>
        </Card>
      </div>
      <Preview s={s} prods={prods} cats={cats} />
    </div>
  );
}

export function TabBanner({ s, set, save, prods, cats }) {
  const b = s.banner;
  const setB = (patch) => set({ banner: { ...b, ...patch } });
  return (
    <div className="ad-split">
      <div>
        <h1 className="ad-h1">Banner de destaque</h1>
        <Card title="Exibição">
          <Toggle label="Mostrar banner" hint="Sem banner, o topo usa um degradê da cor principal com a cor de destaque." checked={b.enabled} onChange={(v) => setB({ enabled: v })} />
        </Card>
        {b.enabled && (
          <Card title="Fundo">
            <div className="ad-seg" role="radiogroup">
              <button className={b.type === "color" ? "on" : ""} onClick={() => setB({ type: "color" })}>Cor sólida</button>
              <button className={b.type === "image" ? "on" : ""} onClick={() => setB({ type: "image" })}>Imagem</button>
            </div>
            {b.type === "color" ? <ColorField label="Cor de fundo" value={b.color} onChange={(color) => setB({ color })} />
              : <ImagePicker value={b.image} onChange={(image) => save({ ...s, banner: { ...b, image } })} label="Enviar imagem do banner" />}
            {b.type === "image" && <p className="ad-note">Use uma imagem horizontal (ex.: 1600 × 600 px). Ela é recortada no centro para caber no celular e no computador.</p>}
          </Card>
        )}
        {b.enabled && (
          <Card title="Textos" desc="Os dois campos são opcionais.">
            <Field label="Título principal"><input value={b.title} onChange={(e) => setB({ title: e.target.value })} maxLength={90} /></Field>
            <Field label="Subtítulo"><input value={b.subtitle} placeholder="Ex.: Encomendas de Natal abertas" onChange={(e) => setB({ subtitle: e.target.value })} maxLength={120} /></Field>
          </Card>
        )}
      </div>
      <Preview s={s} prods={prods} cats={cats} />
    </div>
  );
}

export function TabCores({ s, set, prods, cats }) {
  const c = s.colors;
  const f = s.fonts;
  const setC = (patch) => set({ colors: { ...c, ...patch } });
  const setF = (patch) => set({ fonts: { ...f, ...patch } });
  const r = contrast(c.text, c.background);
  const rt = contrast(c.title || c.primary, c.background);
  const native = f.titleFile ? [400] : FONTS[f.title] || [400];
  const weights = [400, 500, 600, 700, 800];
  const pickTitle = (t) => setF({ title: t });
  const [fontErr, setFontErr] = useState("");
  const [fontBusy, setFontBusy] = useState("");
  async function sendFont(e, key) {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setFontErr(""); setFontBusy(key);
    try { setF({ [key]: await uploadFont(file), [key + "Name"]: file.name.replace(/\.[^.]+$/, "") }); } catch (x) { setFontErr(x.message); }
    setFontBusy("");
  }
  return (
    <div className="ad-split">
      <div>
        <h1 className="ad-h1">Cores e fontes</h1>
        <Card title="Cores do catálogo" desc="Escolha no seletor ou digite o código hexadecimal (#55663C) ou RGB (85, 102, 60).">
          <div className="ad-grid2">
            <ColorField label="Cor principal" hint="Botões, preços, categorias e navegação." value={c.primary} onChange={(primary) => setC({ primary })} />
            <ColorField label="Cor de destaque" hint="Degradê da capa e elementos de destaque." value={c.accent} onChange={(accent) => setC({ accent })} />
            <ColorField label="Cor de fundo" hint="Fundo das páginas e seções." value={c.background} onChange={(background) => setC({ background })} />
            <ColorField label="Cor do texto" hint="Descrições, textos e bordas." value={c.text} onChange={(text) => setC({ text })} />
            <ColorField label="Cor dos títulos" hint="Nome da loja, nome dos produtos e subtítulos." value={c.title || c.primary} onChange={(title) => setC({ title })} />
          </div>
          <div className="ad-gradient" style={{ background: `linear-gradient(120deg, ${c.primary}, ${c.accent})` }}><span>Degradê principal + destaque</span></div>
          <p className={`ad-note${r < 4.5 ? " warn" : ""}`}>
            Contraste entre texto e fundo: {r.toFixed(1)}:1 — {r >= 7 ? "excelente" : r >= 4.5 ? "boa leitura" : "baixo; escolha um texto mais escuro ou um fundo mais claro"}.
          </p>
          {rt < 3 && <p className="ad-note warn">A cor dos títulos está muito clara para o fundo. Escolha um tom mais escuro.</p>}
        </Card>
        <Card title="Fontes" desc="Uma fonte para títulos e subtítulos (nome da loja, nome do produto, seções) e outra para os demais textos.">
          <link rel="stylesheet" href={fontsHref(Object.keys(FONTS))} />
          {fontFaceCss(f) && <style dangerouslySetInnerHTML={{ __html: fontFaceCss(f) }} />}
          <div className="ad-grid2">
            <Field label="Fonte dos títulos e subtítulos">
              <select value={f.titleFile ? "__file" : f.title} onChange={(e) => e.target.value !== "__file" && setF({ title: e.target.value, titleFile: "" })}>
                {f.titleFile && <option value="__file">{f.titleFileName || "Fonte enviada"} (arquivo)</option>}
                {Object.keys(FONTS).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Espessura dos títulos" hint={!native.includes(Number(f.titleWeight)) ? "Esta fonte não tem essa espessura própria; o navegador engrossa as letras automaticamente." : "Negrito destaca mais os títulos."}>
              <select value={f.titleWeight} onChange={(e) => setF({ titleWeight: e.target.value })}>
                {weights.map((w) => <option key={w} value={String(w)}>{WEIGHT_LABEL[w]}</option>)}
              </select>
            </Field>
            <Field label="Fonte dos textos">
              <select value={f.bodyFile ? "__file" : f.body} onChange={(e) => e.target.value !== "__file" && setF({ body: e.target.value, bodyFile: "" })}>
                {f.bodyFile && <option value="__file">{f.bodyFileName || "Fonte enviada"} (arquivo)</option>}
                {BODY_FONTS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <div className="ad-group">
            <strong>Usar uma fonte própria (arquivo)</strong>
            <p className="ad-note">Para fontes que não estão na lista, como as da Canva ou compradas. Envie o arquivo .ttf, .otf, .woff ou .woff2 — só use fontes que você tem licença para usar na internet.</p>
            <div className="ad-row">
              <label className="ad-btn ghost">{fontBusy === "titleFile" ? "Enviando…" : "Enviar fonte dos títulos"}<input type="file" hidden accept=".ttf,.otf,.woff,.woff2" onChange={(e) => sendFont(e, "titleFile")} /></label>
              <label className="ad-btn ghost">{fontBusy === "bodyFile" ? "Enviando…" : "Enviar fonte dos textos"}<input type="file" hidden accept=".ttf,.otf,.woff,.woff2" onChange={(e) => sendFont(e, "bodyFile")} /></label>
            </div>
            {fontErr && <p className="ad-err">{fontErr}</p>}
          </div>
          <div className="ad-font-sample">
            <p style={{ fontFamily: `'${titleFamily(f)}', serif`, fontWeight: f.titleWeight, color: c.title || c.primary, fontSize: "1.5rem" }}>Agenda personalizada</p>
            <p style={{ fontFamily: `'${titleFamily(f)}', serif`, fontWeight: f.titleWeight, color: c.title || c.primary, fontSize: "1.05rem" }}>Miolo</p>
            <p style={{ fontFamily: `'${bodyFamily(f)}', sans-serif`, color: c.text, lineHeight: 1.5 }}>Capa dura personalizada no tema que você escolher, com espiral wire-o e elástico.</p>
          </div>
        </Card>
      </div>
      <Preview s={s} prods={prods} cats={cats} />
    </div>
  );
}

export function TabHorarios({ s, set }) {
  const h = s.hours;
  const setDay = (i, patch) => set({ hours: { ...h, days: h.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) } });
  return (
    <>
      <h1 className="ad-h1">Horário de funcionamento</h1>
      <Card title="Exibição">
        <Toggle label="Mostrar horários no catálogo" hint="Mostra a tabela de horários e o aviso “Aberto agora / Fechado agora”." checked={h.show} onChange={(v) => set({ hours: { ...h, show: v } })} />
      </Card>
      <Card title="Dias da semana">
        <div className="ad-days">
          {h.days.map((d, i) => (
            <div key={i} className={`ad-day${d.open ? "" : " off"}`}>
              <label className="ad-check"><input type="checkbox" checked={d.open} onChange={(e) => setDay(i, { open: e.target.checked })} /> {DAYS[i]}</label>
              <input type="time" value={d.start} disabled={!d.open} onChange={(e) => setDay(i, { start: e.target.value })} aria-label={`Abre ${DAYS[i]}`} />
              <span>às</span>
              <input type="time" value={d.end} disabled={!d.open} onChange={(e) => setDay(i, { end: e.target.value })} aria-label={`Fecha ${DAYS[i]}`} />
              {!d.open && <em>Fechado</em>}
              {d.open && d.end <= d.start && <em className="ad-err">O horário final precisa ser depois do inicial.</em>}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function TabEntrega({ s, set }) {
  const d = s.delivery;
  const setD = (patch) => set({ delivery: { ...d, ...patch } });
  return (
    <>
      <h1 className="ad-h1">Entrega e retirada</h1>
      <Card title="Modalidades" desc="Só as modalidades ativadas aparecem no catálogo. O texto de cada uma é exatamente o que o cliente vê.">
        <Toggle label="Entrega por aplicativo" hint="O cliente chama o app e paga a corrida." checked={d.app} onChange={(v) => setD({ app: v })} />
        {d.app && (
          <Field label="Texto da entrega por aplicativo">
            <textarea rows={3} maxLength={300} value={d.app_text} onChange={(e) => setD({ app_text: e.target.value })} />
          </Field>
        )}
        <Toggle label="Retiradas" hint="O cliente retira pessoalmente." checked={d.pickup} onChange={(v) => setD({ pickup: v })} />
        {d.pickup && (
          <Field label="Texto das retiradas">
            <textarea rows={3} maxLength={300} value={d.pickup_text} onChange={(e) => setD({ pickup_text: e.target.value })} />
          </Field>
        )}
      </Card>
    </>
  );
}
