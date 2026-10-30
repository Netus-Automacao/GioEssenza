"use client";
import { useEffect, useState } from "react";
import Catalog from "@/components/Catalog";
import { DAYS, contrast, cssVars, FONTS, BODY_FONTS, WEIGHT_LABEL, fontsHref, fontFaceCss, titleFamily, bodyFamily } from "@/lib/data";
import { uploadFont, uploadImage } from "@/lib/supabase";
import Cropper from "./Cropper";
import { Toggle, Field, ColorField, ImagePicker, Card } from "./ui";
import { LINK_TYPES, LinkIcon } from "@/components/Icons";

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
          <CropPhoto value={s.logo} original={s.logo_original} ratio={1} round label="Enviar logotipo"
            onSave={(logo, logo_original) => save({ ...s, logo, logo_original })} />
          <p className="ad-note">Depois de escolher a imagem, enquadre dentro do círculo. O logotipo é salvo automaticamente.</p>
          <Field label={`Tamanho do logo no catálogo: ${Number(s.logo_size) || 185}px`} hint="Arraste e veja na prévia ao lado. Depois toque em Salvar alterações.">
            <input type="range" min="100" max="260" step="5" value={Number(s.logo_size) || 185} onChange={(e) => set({ logo_size: Number(e.target.value) })} />
          </Field>
        </Card>
        <Card title="Informações">
          <div className="ad-grid2">
            <Field label="Nome da loja"><input value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} /></Field>
            <Field label="Slogan"><input value={s.slogan} onChange={(e) => set({ slogan: e.target.value })} maxLength={80} /></Field>
          </div>
          <Field label="WhatsApp para pedidos" hint={digits.length < 12 ? "Inclua o código do país e o DDD. Exemplo: 5541987152125." : `Os pedidos vão para +${digits}.`}>
            <input inputMode="tel" value={s.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d+ ()-]/g, "") })} />
          </Field>
          <Field label="Endereço da loja" hint="Aparece no rodapé do site, com link para abrir no mapa. Ex.: Rua das Flores, 123 – Centro, Curitiba – PR">
            <input value={s.address || ""} maxLength={200} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label={`Descrição da loja (${s.description.length}/500)`} hint="Aparece logo abaixo do nome, no topo do catálogo.">
            <textarea rows={4} maxLength={500} value={s.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </Card>
        <Card title="Redes sociais e links" desc="Aparecem como botões logo abaixo do WhatsApp, na página inicial.">
          {(s.links || []).map((l, i) => {
            const setL = (patch) => set({ links: s.links.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="ad-group">
                <div className="ad-grid2">
                  <Field label="Ícone">
                    <select value={l.type} onChange={(e) => setL({ type: e.target.value, label: l.label && l.label !== LINK_TYPES[l.type] ? l.label : LINK_TYPES[e.target.value] })}>
                      {Object.entries(LINK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Texto do botão"><input value={l.label} maxLength={30} onChange={(e) => setL({ label: e.target.value })} /></Field>
                </div>
                <Field label="Link (endereço completo)"><input type="url" inputMode="url" placeholder="https://..." value={l.url} onChange={(e) => setL({ url: e.target.value.trim() })} /></Field>
                <div className="ad-row">
                  <span className="ad-muted" style={{ display: "inline-flex", gap: ".4rem", alignItems: "center" }}><LinkIcon type={l.type} /> Prévia do ícone</span>
                  <button type="button" className="ad-btn ghost sm danger" onClick={() => set({ links: s.links.filter((_, j) => j !== i) })}>Remover</button>
                </div>
              </div>
            );
          })}
          <button type="button" className="ad-btn ghost" style={{ alignSelf: "flex-start" }} onClick={() => set({ links: [...(s.links || []), { type: "link", label: "", url: "" }] })}>+ Adicionar link</button>
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
            <Field label={`Tamanho da letra do título: ${Number(b.title_size) || 26}px`} hint="A frase fica limitada a 2 linhas. Se cortar, diminua a letra ou encurte o texto.">
              <input type="range" min="16" max="44" step="1" value={Number(b.title_size) || 26} onChange={(e) => setB({ title_size: Number(e.target.value) })} />
            </Field>
            <div className="ad-grid2">
              <ColorField label="Cor da frase" value={b.title_color || "#FFFFFF"} onChange={(title_color) => setB({ title_color })} />
              <div />
            </div>
            <Toggle label="Sombra na frase" hint="Ajuda a ler a frase sobre o fundo." checked={!!b.title_shadow} onChange={(v) => setB({ title_shadow: v })} />
            {b.title_shadow && (
              <div className="ad-grid2">
                <ColorField label="Cor da sombra da frase" value={b.shadow_color || "#000000"} onChange={(shadow_color) => setB({ shadow_color })} />
                <Field label={`Intensidade da sombra: ${Number(b.shadow_strength) || 0}%`}>
                  <input type="range" min="0" max="100" step="1" value={Number(b.shadow_strength) || 0} onChange={(e) => setB({ shadow_strength: Number(e.target.value) })} />
                </Field>
              </div>
            )}
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
        <Card title="Sombra das imagens" desc="Sombra das fotos dos produtos, da foto do Sobre nós e do logo.">
          <div className="ad-grid2">
            <ColorField label="Cor da sombra" value={s.shadow.color} onChange={(color) => set({ shadow: { ...s.shadow, color } })} />
            <Field label={`Intensidade: ${s.shadow.strength}%`} hint="0% = sem sombra. Quanto maior, mais escura.">
              <input type="range" min="0" max="70" step="1" value={s.shadow.strength} onChange={(e) => set({ shadow: { ...s.shadow, strength: Number(e.target.value) } })} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "1rem", padding: ".5rem 0" }}>
            {[0, 1].map((i) => <div key={i} style={{ width: 90, height: 110, borderRadius: 10, background: "#E9E4D8", boxShadow: `0 8px 22px ${cssVars(c, f, s.shadow)["--sh1"]}, 0 2px 6px ${cssVars(c, f, s.shadow)["--sh2"]}` }} />)}
          </div>
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
  const setH = (patch) => set({ hours: { ...h, holiday: { ...h.holiday, ...patch } } });
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
          <div className={`ad-day${h.holiday.open ? "" : " off"}`}>
            <label className="ad-check"><input type="checkbox" checked={h.holiday.open} onChange={(e) => setH({ open: e.target.checked })} /> Feriados</label>
            <input type="time" value={h.holiday.start} disabled={!h.holiday.open} onChange={(e) => setH({ start: e.target.value })} aria-label="Abre em feriados" />
            <span>às</span>
            <input type="time" value={h.holiday.end} disabled={!h.holiday.open} onChange={(e) => setH({ end: e.target.value })} aria-label="Fecha em feriados" />
            {!h.holiday.open && <em>Fechado</em>}
          </div>
        </div>
        <Toggle label="Mostrar a linha “Feriados” no catálogo" checked={h.holiday.show} onChange={(v) => setH({ show: v })} />
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

export function TabSobre({ s, set, save, prods, cats }) {
  const a = s.about;
  const setA = (patch) => set({ about: { ...a, ...patch } });
  return (
    <div className="ad-split">
      <div>
        <h1 className="ad-h1">Sobre nós</h1>
        <Card title="Exibição">
          <Toggle label="Mostrar a seção “Sobre nós” no catálogo" checked={a.enabled} onChange={(v) => setA({ enabled: v })} />
        </Card>
        <Card title="Foto" desc="Uma foto sua ou do ateliê. Depois de escolher, enquadre do jeito que quiser. Salva automaticamente.">
          <AboutPhoto a={a} onSave={(patch) => save({ ...s, about: { ...a, ...patch } })} />
        </Card>
        <Card title="Texto">
          <Field label="Título"><input value={a.title} maxLength={80} onChange={(e) => setA({ title: e.target.value })} /></Field>
          <Field label="Sobre quem está por trás da empresa" hint="Conte sua história, a ideia e o porquê da empresa. Use Enter para separar parágrafos.">
            <textarea rows={8} maxLength={2000} value={a.text} onChange={(e) => setA({ text: e.target.value })} />
          </Field>
        </Card>
      </div>
      <Preview s={s} prods={prods} cats={cats} />
    </div>
  );
}

export function TabPoliticas({ s, set }) {
  const p = s.policies;
  const setP = (patch) => set({ policies: { ...p, ...patch } });
  return (
    <>
      <h1 className="ad-h1">Políticas da loja</h1>
      <Card title="Políticas" desc="Aparecem num botão no rodapé do catálogo, que abre uma página só com este texto. Deixe vazio para esconder o botão.">
        <Field label="Nome do botão"><input value={p.title} maxLength={40} onChange={(e) => setP({ title: e.target.value })} /></Field>
        <Field label="Texto das políticas" hint="Prazos, trocas, pagamentos, encomendas… Use Enter para separar parágrafos.">
          <textarea rows={14} maxLength={10000} value={p.text} onChange={(e) => setP({ text: e.target.value })} />
        </Field>
      </Card>
    </>
  );
}

export function TabPagamento({ s, set }) {
  const p = s.payments;
  const setP = (patch) => set({ payments: { ...p, ...patch } });
  return (
    <>
      <h1 className="ad-h1">Formas de pagamento</h1>
      <Card title="Exibição">
        <Toggle label="Mostrar formas de pagamento no catálogo" hint="Aparece na página inicial, junto de Entrega e retirada." checked={p.show} onChange={(v) => setP({ show: v })} />
      </Card>
      <Card title="Formas que aceitamos" desc="Marque só as que a loja aceita.">
        <Toggle label="Pix" checked={p.pix} onChange={(v) => setP({ pix: v })} />
        <Toggle label="Cartão de crédito via link de pagamento" hint="Aparece com o aviso “possui taxa da operadora”." checked={p.credit_link} onChange={(v) => setP({ credit_link: v })} />
        <Toggle label="Cartão de débito" checked={p.debit} onChange={(v) => setP({ debit: v })} />
        <Toggle label="Dinheiro" checked={p.cash} onChange={(v) => setP({ cash: v })} />
      </Card>
      <Card title="Condições de pagamento">
        <Toggle label="Sinal de 50% na confirmação do pedido e 50% na retirada" checked={p.half} onChange={(v) => setP({ half: v })} />
        <Toggle label="Pagamento integral na confirmação do pedido" checked={p.full} onChange={(v) => setP({ full: v })} />
        <Field label="Observação (opcional)" hint="Ex.: chave Pix, prazo para pagamento…">
          <textarea rows={3} maxLength={300} value={p.note} onChange={(e) => setP({ note: e.target.value })} />
        </Field>
      </Card>
    </>
  );
}

function CropPhoto({ value, original, ratio, round, onSave, label = "Enviar foto" }) {
  const [job, setJob] = useState(null);
  const [err, setErr] = useState("");
  async function done(cropped) {
    const url = await uploadImage(cropped);
    const orig = job.file ? await uploadImage(job.file) : original || value;
    onSave(url, orig);
    if (job.file) URL.revokeObjectURL(job.src);
    setJob(null);
  }
  return (
    <div className="ad-img">
      <div className="ad-img-prev" style={{ width: round ? 120 : 140, aspectRatio: `${1}/${ratio}`, borderRadius: round ? "50%" : 10 }}>{value ? <img src={value} alt="" /> : <span>Sem imagem</span>}</div>
      <div className="ad-img-actions">
        <label className="ad-btn">{value ? "Trocar imagem" : label}
          <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setErr("Use JPG, PNG ou WebP.");
            setErr(""); setJob({ src: URL.createObjectURL(f), file: f });
          }} />
        </label>
        {value && <button type="button" className="ad-btn ghost" onClick={() => setJob({ src: original || value })}>Enquadrar</button>}
        {value && <button type="button" className="ad-btn ghost" onClick={() => onSave("", "")}>Remover</button>}
        {err && <small className="ad-err">{err}</small>}
      </div>
      {job && <Cropper src={job.src} ratio={ratio} round={round} onCancel={() => setJob(null)} onDone={done} />}
    </div>
  );
}

function AboutPhoto({ a, onSave }) {
  const [job, setJob] = useState(null); // { src, file? }
  const [err, setErr] = useState("");
  async function done(cropped) {
    const url = await uploadImage(cropped);
    const original = job.file ? await uploadImage(job.file) : a.photo_original || a.photo;
    onSave({ photo: url, photo_original: original });
    if (job.file) URL.revokeObjectURL(job.src);
    setJob(null);
  }
  return (
    <div className="ad-img">
      <div className="ad-img-prev" style={{ width: 140, aspectRatio: "4/5" }}>{a.photo ? <img src={a.photo} alt="" /> : <span>Sem foto</span>}</div>
      <div className="ad-img-actions">
        <label className="ad-btn">{a.photo ? "Trocar foto" : "Enviar foto"}
          <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setErr("Use JPG, PNG ou WebP.");
            setErr(""); setJob({ src: URL.createObjectURL(f), file: f });
          }} />
        </label>
        {a.photo && <button type="button" className="ad-btn ghost" onClick={() => setJob({ src: a.photo_original || a.photo })}>Enquadrar</button>}
        {a.photo && <button type="button" className="ad-btn ghost" onClick={() => onSave({ photo: "", photo_original: "" })}>Remover</button>}
        {err && <small className="ad-err">{err}</small>}
      </div>
      {job && <Cropper src={job.src} ratio={5 / 4} onCancel={() => setJob(null)} onDone={done} />}
    </div>
  );
}
