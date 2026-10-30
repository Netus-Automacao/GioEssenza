// Geração de mockups no navegador (canvas). A arte original nunca é alterada:
// ela só é posicionada, recortada pela área do produto e iluminada por cima.

export const DEFAULT_MOCKUPS = [
  { id: "caneca", name: "Caneca branca 325 ml", kind: "mug", w: 21, h: 9.5, spiral: false },
  { id: "agenda", name: "Agenda personalizada", kind: "book", w: 15, h: 21, spiral: true, rings: 15, side: "left" },
  { id: "planner", name: "Planner", kind: "book", w: 15, h: 21, spiral: true, rings: 15, side: "left" },
  { id: "bloco", name: "Bloquinho personalizado", kind: "book", w: 10, h: 14, spiral: true, rings: 6, side: "top" },
];
export const DEFAULT_ADJUST = { scale: 1, x: 0, y: 0, fit: "cover" };
const SIZE = 1200;

export function loadImage(src) {
  return new Promise((ok, bad) => {
    const img = new Image();
    if (typeof src === "string" && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => bad(new Error("Não foi possível abrir a imagem."));
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

// desenha a arte dentro de um retângulo (preencher ou caber) com escala e deslocamento
function placeArt(ctx, img, x, y, w, h, a) {
  const base = a.fit === "contain" ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height);
  const s = base * (a.scale || 1);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2 + (a.x || 0) * w, y + (h - dh) / 2 + (a.y || 0) * h, dw, dh);
}

function background(ctx) {
  const g = ctx.createRadialGradient(SIZE / 2, SIZE * 0.42, 50, SIZE / 2, SIZE / 2, SIZE * 0.75);
  g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#ECE9E3");
  ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// um anel de wire-o: furo preto na capa + dois arames paralelos saindo para fora
function wireRing(ctx, len, depth, ext = 1.25) {
  const hole = len * 0.5, bar = Math.max(3, hole * 0.16), gap = hole * 0.42;
  ctx.fillStyle = "#151515"; roundRect(ctx, 0, -hole / 2, depth, hole, 2); ctx.fill();
  for (const off of [-gap / 2 - bar / 2, gap / 2 - bar / 2]) {
    const g = ctx.createLinearGradient(0, off, 0, off + bar);
    g.addColorStop(0, "#8D8D8D"); g.addColorStop(0.45, "#F2F2F2"); g.addColorStop(1, "#9A9A9A");
    ctx.fillStyle = g; roundRect(ctx, -depth * ext, off, depth * ext + depth * 0.75, bar, bar / 2); ctx.fill();
  }
}

function drawBook(ctx, img, t, a) {
  const ratio = t.w / t.h;
  const side = t.side || (ratio > 1.05 ? "top" : "left");
  const rings = Math.max(1, Math.round(t.rings || (side === "top" ? 6 : 15)));
  const room = t.spiral ? 0.08 : 0;
  let h = SIZE * (0.78 - (side === "top" ? room : 0)), w = h * ratio;
  if (w > SIZE * (0.72 - (side === "left" ? room : 0))) { w = SIZE * (0.72 - (side === "left" ? room : 0)); h = w / ratio; }
  const x = (SIZE - w) / 2 + (t.spiral && side === "left" ? SIZE * 0.03 : 0);
  const y = (SIZE - h) / 2 + (t.spiral && side === "top" ? SIZE * 0.03 : 0);
  // sombra e borda branca (miolo)
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 30; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x, y, w, h); ctx.restore();
  const m = Math.max(4, w * 0.012);
  ctx.save(); ctx.beginPath(); ctx.rect(x + m, y + m, w - 2 * m, h - 2 * m); ctx.clip();
  ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h);
  placeArt(ctx, img, x + m, y + m, w - 2 * m, h - 2 * m, a);
  const gl = ctx.createLinearGradient(x, y, x + w, y + h);
  gl.addColorStop(0, "rgba(255,255,255,.10)"); gl.addColorStop(0.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.06)");
  ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
  ctx.restore();
  if (!t.spiral) return;
  const along = side === "top" ? w : h;
  const pitch = along / rings, depth = Math.min(pitch * 0.55, along * 0.045, 34);
  const ringLen = Math.min(pitch * 0.9, side === "top" ? w * 0.13 : pitch);
  for (let i = 0; i < rings; i++) {
    const p = (i + 0.5) * pitch;
    ctx.save();
    if (side === "top") { ctx.translate(x + p, y + m * 0.6); ctx.rotate(Math.PI / 2); }
    else ctx.translate(x + m * 0.6, y + p);
    wireRing(ctx, ringLen, depth, side === "top" ? 2.2 : 1.25);
    ctx.restore();
  }
}

// uma caneca: mostra a metade da estampa centrada em uCenter; alça à esquerda (-1) ou à direita (1)
function oneMug(ctx, print, cx, top, BW, handle, uCenter) {
  const BH = Math.round(BW * 1.12), ry = Math.round(BW * 0.06);
  const L = cx - BW / 2, R = cx + BW / 2;
  ctx.save(); ctx.filter = "blur(20px)"; ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath(); ctx.ellipse(cx + handle * BW * 0.08, top + BH + ry * 0.4, BW * 0.62, ry * 1.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // alça
  const E = handle > 0 ? R - 18 : L + 18, k = handle * BW * 0.38;
  ctx.save(); ctx.lineCap = "round";
  ctx.strokeStyle = "#D6D4D0"; ctx.lineWidth = BW * 0.1;
  ctx.beginPath(); ctx.moveTo(E, top + BH * 0.22); ctx.bezierCurveTo(E + k, top + BH * 0.18, E + k, top + BH * 0.78, E, top + BH * 0.74); ctx.stroke();
  ctx.strokeStyle = "#F7F6F3"; ctx.lineWidth = BW * 0.06;
  ctx.beginPath(); ctx.moveTo(E, top + BH * 0.25); ctx.bezierCurveTo(E + k * 0.87, top + BH * 0.22, E + k * 0.87, top + BH * 0.74, E, top + BH * 0.71); ctx.stroke();
  ctx.restore();
  // corpo com a estampa enrolada no cilindro
  ctx.save();
  ctx.beginPath(); ctx.moveTo(L, top); ctx.ellipse(cx, top, BW / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(R, top + BH); ctx.ellipse(cx, top + BH, BW / 2, ry, 0, 0, Math.PI, false); ctx.closePath();
  ctx.fillStyle = "#FBFAF8"; ctx.fill(); ctx.clip();
  const pTop = top + BH * 0.06, pH = BH * 0.88;
  const col = (i) => { const nx = Math.max(-1, Math.min(1, (i + 0.5) / BW * 2 - 1)); return ((uCenter + Math.asin(nx) / (2 * Math.PI)) % 1 + 1) % 1; };
  for (let i = 0; i < BW; i++) {
    const nx = (i + 0.5) / BW * 2 - 1;
    const u = col(i), u2 = col(i + 1);
    const sw = Math.max(1, ((u2 - u + 1) % 1) * print.width);
    const dy = ry * Math.sqrt(Math.max(0, 1 - nx * nx));
    ctx.drawImage(print, u * print.width, 0, Math.min(sw, print.width - u * print.width), print.height, L + i, pTop + dy, 1.6, pH);
  }
  const sh = ctx.createLinearGradient(L, 0, R, 0);
  const hl = handle > 0 ? 0.32 : 0.68;
  sh.addColorStop(0, "rgba(0,0,0,.28)"); sh.addColorStop(0.16, "rgba(0,0,0,.05)");
  sh.addColorStop(hl - 0.06, "rgba(255,255,255,0)"); sh.addColorStop(hl, "rgba(255,255,255,.30)"); sh.addColorStop(hl + 0.08, "rgba(255,255,255,0)");
  sh.addColorStop(0.84, "rgba(0,0,0,.06)"); sh.addColorStop(1, "rgba(0,0,0,.30)");
  ctx.fillStyle = sh; ctx.fillRect(L, top - ry, BW, BH + ry * 2);
  ctx.restore();
  // boca
  ctx.save();
  ctx.fillStyle = "#EDEBE7"; ctx.beginPath(); ctx.ellipse(cx, top, BW / 2, ry, 0, 0, Math.PI * 2); ctx.fill();
  const inner = ctx.createLinearGradient(0, top - ry, 0, top + ry);
  inner.addColorStop(0, "#CFCCC6"); inner.addColorStop(1, "#F2F0EC");
  ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(cx, top + 2, BW / 2 - BW * 0.022, ry * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.10)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, top, BW / 2, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// caneca: frente e verso (duas canecas, alça de cada lado), mostrando a estampa inteira
function drawMug(ctx, img, t, a) {
  const print = document.createElement("canvas");
  print.width = 2400; print.height = Math.round(2400 * (t.h / t.w));
  const pc = print.getContext("2d");
  pc.fillStyle = "#fff"; pc.fillRect(0, 0, print.width, print.height);
  placeArt(pc, img, 0, 0, print.width, print.height, a);
  const BW = 400;
  oneMug(ctx, print, 325, 360, BW, -1, 0.25); // alça à esquerda: primeira metade da estampa
  oneMug(ctx, print, 860, 300, BW, 1, 0.75);  // alça à direita: segunda metade
}

// desenha o mockup completo e devolve o canvas
export function renderMockup(img, type, adjust = DEFAULT_ADJUST) {
  const c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d");
  background(ctx);
  const a = { ...DEFAULT_ADJUST, ...adjust };
  if (!type) { // sem mockup: só a arte, inteira
    const s = Math.min((SIZE * 0.9) / img.width, (SIZE * 0.9) / img.height);
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  if (type.kind === "mug") drawMug(ctx, img, type, a); else drawBook(ctx, img, type, a);
  return c;
}

export function toBlob(canvas, type = "image/jpeg", quality = 0.9) {
  return new Promise((ok) => canvas.toBlob(ok, type, quality));
}
export async function thumbOf(canvas, max = 520) {
  const s = Math.min(1, max / Math.max(canvas.width, canvas.height));
  const t = document.createElement("canvas"); t.width = Math.round(canvas.width * s); t.height = Math.round(canvas.height * s);
  t.getContext("2d").drawImage(canvas, 0, 0, t.width, t.height);
  return (await toBlob(t, "image/webp", 0.82)) || toBlob(t, "image/jpeg", 0.82);
}
