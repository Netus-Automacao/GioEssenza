export const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const weekday = (open) => ({ open, start: "09:00", end: "19:00" });

export const DEFAULT_SETTINGS = {
  active: true,
  name: "Gio Essenza",
  slogan: "Papelaria com Significado",
  whatsapp: "5541987152125",
  whatsapp_enabled: true,
  description: "Agendas, cadernetas, planners e cadernos encadernados à mão, com capa personalizada no tema que você escolher.",
  logo: "",
  public_url: "",
  banner: { enabled: true, type: "color", color: "#55663C", image: "", title: "Ideias que ganham forma, momentos com mais significado.", subtitle: "" },
  colors: { primary: "#55663C", accent: "#A9B98C", background: "#FBF7F0", text: "#3D4A2A", title: "#3F5226" },
  fonts: { title: "Playfair Display", body: "Figtree", titleWeight: "700" },
  hours: { show: true, days: [weekday(false), weekday(true), weekday(true), weekday(true), weekday(true), weekday(true), weekday(false)] },
  delivery: { app: true, pickup: true, pickup_note: "Retiradas de segunda a sexta, das 15h às 19h, mediante agendamento prévio." },
};

export function withDefaults(s) {
  const d = DEFAULT_SETTINGS;
  s = s || {};
  return {
    ...d, ...s,
    banner: { ...d.banner, ...(s.banner || {}) },
    colors: { ...d.colors, ...(s.colors || {}) },
    fonts: { ...d.fonts, ...(s.fonts || {}) },
    hours: { ...d.hours, ...(s.hours || {}), days: s.hours?.days?.length === 7 ? s.hours.days : d.hours.days },
    delivery: { ...d.delivery, ...(s.delivery || {}) },
  };
}

export const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function waLink(number, text) {
  const n = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function hourLabel(t) {
  const [h, m] = String(t).split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
}

export function openStatus(hours) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const t = `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
  const d = hours.days[wd];
  return !!(d && d.open && t >= d.start && t < d.end);
}

export const hasPromo = (p) => p.promo_price !== null && p.promo_price !== undefined && p.promo_price !== "" && Number(p.promo_price) < Number(p.price);
export const basePrice = (p) => (hasPromo(p) ? Number(p.promo_price) : Number(p.price));
export const productAvailable = (p) => !p.stock_enabled || Number(p.stock) > 0;
export const valueAvailable = (p, v) => v.available !== false && !(p.stock_enabled && v.stock !== "" && v.stock !== null && v.stock !== undefined && Number(v.stock) <= 0);

/* ---------- cores ---------- */
export function hexToRgbArr(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export const hexToRgb = (hex) => `rgb(${hexToRgbArr(hex).join(", ")})`;
export function parseColor(v) {
  v = String(v).trim();
  let m = v.match(/^#?([0-9a-f]{3})$/i);
  if (m) return ("#" + m[1].split("").map((c) => c + c).join("")).toUpperCase();
  m = v.match(/^#?([0-9a-f]{6})$/i);
  if (m) return ("#" + m[1]).toUpperCase();
  m = v.match(/^(?:rgb\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
  if (m && m.slice(1).every((n) => Number(n) <= 255)) return ("#" + m.slice(1).map((n) => Number(n).toString(16).padStart(2, "0")).join("")).toUpperCase();
  return null;
}
function lum(hex) {
  return hexToRgbArr(hex).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
export const FONTS = {
  "Tenor Sans": [400], "Playfair Display": [400, 500, 600, 700, 800], "Cormorant Garamond": [400, 500, 600, 700], "Lora": [400, 500, 600, 700],
  "Libre Baskerville": [400, 700], "Cinzel": [400, 500, 600, 700], "Marcellus": [400], "DM Serif Display": [400],
  "Montserrat": [400, 500, 600, 700, 800], "Poppins": [400, 500, 600, 700], "Raleway": [400, 500, 600, 700],
  "Quicksand": [400, 500, 600, 700], "Nunito": [400, 500, 600, 700, 800], "Figtree": [400, 500, 600, 700],
  "Lato": [400, 700], "Open Sans": [400, 500, 600, 700], "Dancing Script": [400, 500, 600, 700],
};
export const BODY_FONTS = ["Tenor Sans", "Figtree", "Nunito", "Lato", "Open Sans", "Poppins", "Montserrat", "Raleway", "Quicksand", "Lora"];
export const WEIGHT_LABEL = { 400: "Normal", 500: "Médio", 600: "Seminegrito", 700: "Negrito", 800: "Extranegrito" };
export function fontsHref(families) {
  const q = [...new Set(families)].filter((f) => FONTS[f]).map((f) => `family=${f.replace(/ /g, "+")}:wght@${FONTS[f].join(";")}`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

/* fontes enviadas pela loja (arquivo próprio) */
export const titleFamily = (f) => (f.titleFile ? "GioTitulo" : f.title);
export const bodyFamily = (f) => (f.bodyFile ? "GioTexto" : f.body);
export function fontFaceCss(f = {}) {
  const fmt = (u) => ({ woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" }[u.split("?")[0].split(".").pop().toLowerCase()] || "truetype");
  return [f.titleFile && `@font-face{font-family:'GioTitulo';src:url('${f.titleFile}') format('${fmt(f.titleFile)}');font-display:swap}`,
    f.bodyFile && `@font-face{font-family:'GioTexto';src:url('${f.bodyFile}') format('${fmt(f.bodyFile)}');font-display:swap}`].filter(Boolean).join("");
}

export function cssVars(c, f = DEFAULT_SETTINGS.fonts) {
  return {
    "--f-display": `'${titleFamily(f)}', Georgia, serif`, "--f-body": `'${bodyFamily(f)}', system-ui, sans-serif`,
    "--title-weight": f.titleWeight, "--title": c.title || c.primary,
    "--primary": c.primary, "--accent": c.accent, "--bg": c.background, "--text": c.text,
    "--on-primary": contrast(c.primary, "#FFFFFF") >= contrast(c.primary, "#1F2416") ? "#FFFFFF" : "#1F2416",
  };
}

/* ---------- v2: preço, estoque, venda, especificações ---------- */
export const filled = (v) => v !== undefined && v !== null && v !== false && String(v).trim() !== "" && String(v).trim() !== "0";

export function unitPrice(p, sel = {}, opt = {}) {
  let v = basePrice(p);
  (p.variations || []).forEach((g, gi) => {
    const val = g.values[sel[gi]];
    if (val && val.price !== "" && val.price != null) v = g.price_mode === "add" ? v + Number(val.price) : Number(val.price);
  });
  (p.options || []).forEach((g, gi) => (opt[gi] || []).forEach((ci) => { v += Number(g.choices[ci]?.extra || 0); }));
  return Math.max(0, v);
}

export function maxQty(p, sel = {}) {
  if (!p.stock_enabled) return null;
  let m = Number(p.stock) || 0;
  (p.variations || []).forEach((g, gi) => {
    const v = g.values[sel[gi]];
    if (v && v.stock !== "" && v.stock != null) m = Math.min(m, Number(v.stock));
  });
  return m;
}

export function saleLabel(p, qty = 1) {
  if (p.sale_type === "kit" && Number(p.kit_qty) > 0) return `${qty} kit${qty > 1 ? "s" : ""} com ${p.kit_qty} unidades`;
  if (p.sale_type === "other" && filled(p.sale_note)) return `${qty} × ${p.sale_note}`;
  return `${qty} unidade${qty > 1 ? "s" : ""}`;
}
export const saleBadge = (p) =>
  p.sale_type === "kit" && Number(p.kit_qty) > 0 ? `Kit com ${p.kit_qty} unidades` : p.sale_type === "other" && filled(p.sale_note) ? p.sale_note : "";

export function specSections(s = {}) {
  const out = [];
  const d = s.dimensions || {};
  const dims = [["Altura", "altura"], ["Largura", "largura"], ["Profundidade", "profundidade"], ["Comprimento", "comprimento"], ["Diâmetro", "diametro"], ["Espessura", "espessura"]]
    .filter(([, k]) => filled(d[k])).map(([l, k]) => `${l}: ${String(d[k]).replace(".", ",")} cm`);
  if (filled(d.outras)) dims.push(d.outras);
  if (dims.length) out.push({ title: "Dimensões", items: dims });

  const mat = [];
  const paper = (label, m, extra = []) => {
    if (!m || m.uses === false) return;
    const parts = [m.tipo, filled(m.gramatura) && `${m.gramatura} g/m²`, ...extra.map(([l, v]) => filled(v) && `${l}: ${v}`)].filter(filled);
    if (parts.length || filled(m.obs)) mat.push(`${label}: ${parts.join(", ")}${filled(m.obs) ? `${parts.length ? " — " : ""}${m.obs}` : ""}`);
  };
  paper("Miolo", s.miolo);
  paper("Capa", s.capa, [["aplicação", s.capa?.aplicacao]]);
  paper("Item principal", s.principal, [["finalidade", s.principal?.finalidade]]);
  if (mat.length) out.push({ title: "Materiais", items: mat });

  const fin = [];
  const L = s.laminacao || {};
  if (L.has === "sim") fin.push(`Laminação ${L.tipo === "soft" ? "fosca soft touch" : "brilho comum"}${filled(L.obs) ? ` — ${L.obs}` : ""}`);
  if (filled(s.estrutura)) fin.push(s.estrutura);
  const E = s.encadernacao || {};
  if (filled(E.tipo)) fin.push(`Encadernação: ${E.tipo}${filled(E.cor) ? ` (${E.cor})` : ""}`);
  (s.acessorios || []).filter(filled).forEach((a) => fin.push(a));
  if (filled(s.outros_acabamentos)) fin.push(s.outros_acabamentos);
  if (fin.length) out.push({ title: "Acabamento", items: fin });

  const A = s.arte || {};
  const art = [];
  if (A.tipo === "inclusa") art.push(`Arte inclusa${filled(A.alteracoes) ? `, com até ${A.alteracoes} ${Number(A.alteracoes) === 1 ? "alteração" : "alterações"}` : ""}`);
  if (A.tipo === "nao") art.push("Arte não inclusa");
  if (filled(A.obs)) art.push(A.obs);
  if (art.length) out.push({ title: "Arte", items: art });
  return out;
}
