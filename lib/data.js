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
  colors: { primary: "#55663C", accent: "#A9B98C", background: "#FBF7F0", text: "#3D4A2A" },
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
export function cssVars(c) {
  return {
    "--primary": c.primary, "--accent": c.accent, "--bg": c.background, "--text": c.text,
    "--on-primary": contrast(c.primary, "#FFFFFF") >= contrast(c.primary, "#1F2416") ? "#FFFFFF" : "#1F2416",
  };
}
