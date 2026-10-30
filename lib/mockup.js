// Geração de mockups no navegador (canvas). A arte original nunca é alterada:
// ela só é posicionada, recortada pela área do produto e iluminada por cima.

export const DEFAULT_MOCKUPS = [
  { id: "caneca", name: "Caneca branca 325 ml", kind: "mug", w: 21, h: 9.5, spiral: false },
  { id: "agenda", name: "Agenda personalizada", kind: "book", w: 15, h: 21, spiral: true },
  { id: "planner", name: "Planner", kind: "book", w: 15, h: 21, spiral: true },
  { id: "bloco", name: "Bloquinho personalizado", kind: "book", w: 14, h: 10, spiral: true },
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

function drawBook(ctx, img, t, a) {
  const ratio = t.w / t.h;
  let h = SIZE * 0.72, w = h * ratio;
  if (w > SIZE * 0.68) { w = SIZE * 0.68; h = w / ratio; }
  const landscape = ratio > 1.05;
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2 + 10); ctx.rotate((-3 * Math.PI) / 180);
  const x = -w / 2, y = -h / 2, r = 10;
  // sombra no chão
  ctx.save(); ctx.filter = "blur(26px)"; ctx.fillStyle = "rgba(0,0,0,.28)"; roundRect(ctx, x + 18, y + 30, w, h, r); ctx.fill(); ctx.restore();
  // miolo (folhas) aparecendo na borda
  for (let i = 3; i >= 1; i--) { ctx.fillStyle = i % 2 ? "#F4F2EE" : "#E6E3DD"; roundRect(ctx, x + i * 3, y + i * 4, w, h, r); ctx.fill(); }
  // capa com a arte
  ctx.save(); roundRect(ctx, x, y, w, h, r); ctx.clip();
  ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h);
  placeArt(ctx, img, x, y, w, h, a);
  // luz: brilho suave e sombra na lombada/encadernação
  const gl = ctx.createLinearGradient(x, y, x + w, y + h);
  gl.addColorStop(0, "rgba(255,255,255,.18)"); gl.addColorStop(0.45, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.10)");
  ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
  const edge = landscape ? ctx.createLinearGradient(0, y, 0, y + 40) : ctx.createLinearGradient(x, 0, x + 40, 0);
  edge.addColorStop(0, "rgba(0,0,0,.22)"); edge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = edge; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1.5; roundRect(ctx, x, y, w, h, r); ctx.stroke();
  // espiral (wire-o)
  if (t.spiral) {
    const n = Math.round((landscape ? w : h) / 30);
    for (let i = 0; i < n; i++) {
      const p = ((i + 0.5) / n) * (landscape ? w : h);
      ctx.save();
      if (landscape) ctx.translate(x + p, y); else ctx.translate(x, y + p);
      if (landscape) ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(14, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.lineCap = "round";
      ctx.strokeStyle = "#7A7A7A"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(14, -3); ctx.bezierCurveTo(-4, -10, -16, -4, -12, 6); ctx.stroke();
      ctx.strokeStyle = "#D9D9D9"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -4); ctx.bezierCurveTo(-3, -11, -15, -5, -12, 4); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawMug(ctx, img, t, a) {
  // área de estampa (largura = volta da caneca); metade dela fica de frente
  const BW = 560, BH = Math.round(BW * 1.12), cx = SIZE / 2 - 50, top = (SIZE - BH) / 2 + 20, ry = 34;
  const print = document.createElement("canvas");
  print.width = 2000; print.height = Math.round(2000 * (t.h / t.w));
  const pc = print.getContext("2d");
  pc.fillStyle = "#fff"; pc.fillRect(0, 0, print.width, print.height);
  placeArt(pc, img, 0, 0, print.width, print.height, a);
  const L = cx - BW / 2, R = cx + BW / 2;
  // sombra
  ctx.save(); ctx.filter = "blur(24px)"; ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath(); ctx.ellipse(cx + 30, top + BH + 10, BW * 0.62, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // alça (à direita)
  ctx.save(); ctx.lineCap = "round";
  ctx.strokeStyle = "#D8D6D2"; ctx.lineWidth = 58;
  ctx.beginPath(); ctx.moveTo(R - 20, top + BH * 0.22); ctx.bezierCurveTo(R + 210, top + BH * 0.18, R + 210, top + BH * 0.78, R - 20, top + BH * 0.74); ctx.stroke();
  ctx.strokeStyle = "#F7F6F3"; ctx.lineWidth = 34;
  ctx.beginPath(); ctx.moveTo(R - 20, top + BH * 0.25); ctx.bezierCurveTo(R + 182, top + BH * 0.22, R + 182, top + BH * 0.74, R - 20, top + BH * 0.71); ctx.stroke();
  ctx.restore();
  // corpo
  const body = () => { ctx.beginPath(); ctx.moveTo(L, top); ctx.ellipse(cx, top, BW / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(R, top + BH); ctx.ellipse(cx, top + BH, BW / 2, ry, 0, 0, Math.PI, false); ctx.closePath(); };
  ctx.save(); body(); ctx.fillStyle = "#FBFAF8"; ctx.fill(); ctx.clip();
  // estampa enrolada no cilindro: cada coluna vem do ponto certo da volta
  const pTop = top + BH * 0.06, pH = BH * 0.88;
  for (let i = 0; i < BW; i++) {
    const nx = (i + 0.5) / BW * 2 - 1;
    const th = Math.asin(Math.max(-1, Math.min(1, nx)));
    const u = 0.5 + th / (2 * Math.PI);
    const u2 = 0.5 + Math.asin(Math.max(-1, Math.min(1, (i + 1.5) / BW * 2 - 1))) / (2 * Math.PI);
    const sx = u * print.width, sw = Math.max(1, (u2 - u) * print.width);
    const dy = ry * Math.sqrt(Math.max(0, 1 - nx * nx));
    ctx.drawImage(print, sx, 0, sw, print.height, L + i, pTop + dy, 1.6, pH);
  }
  // sombreamento cilíndrico e reflexo
  const sh = ctx.createLinearGradient(L, 0, R, 0);
  sh.addColorStop(0, "rgba(0,0,0,.30)"); sh.addColorStop(0.18, "rgba(0,0,0,.06)"); sh.addColorStop(0.32, "rgba(255,255,255,.30)");
  sh.addColorStop(0.42, "rgba(255,255,255,0)"); sh.addColorStop(0.8, "rgba(0,0,0,.08)"); sh.addColorStop(1, "rgba(0,0,0,.32)");
  ctx.fillStyle = sh; ctx.fillRect(L, top - ry, BW, BH + ry * 2);
  ctx.restore();
  // boca da caneca
  ctx.save();
  ctx.fillStyle = "#EDEBE7"; ctx.beginPath(); ctx.ellipse(cx, top, BW / 2, ry, 0, 0, Math.PI * 2); ctx.fill();
  const inner = ctx.createLinearGradient(0, top - ry, 0, top + ry);
  inner.addColorStop(0, "#CFCCC6"); inner.addColorStop(1, "#F2F0EC");
  ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(cx, top + 3, BW / 2 - 12, ry - 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.10)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, top, BW / 2, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
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
