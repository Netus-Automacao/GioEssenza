"use client";
import { useEffect, useRef, useState } from "react";

const RATIO = 4 / 3; // altura ÷ largura → formato retangular 3:4, igual à câmera do celular
const MAX_W = 1600;  // largura máxima salva (mantém a qualidade)

export default function Cropper({ src, onCancel, onDone, step, ratio = RATIO }) {
  const R = ratio;
  const box = useRef();
  const drag = useRef(null);
  const [img, setImg] = useState(null);
  const [err, setErr] = useState("");
  const [W, setW] = useState(320);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.onerror = () => setErr("Não foi possível abrir esta imagem.");
    i.src = src;
  }, [src]);
  useEffect(() => {
    const m = () => setW(box.current?.clientWidth || 320);
    m(); window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);

  const H = W * R;
  const base = img ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : 1;
  const sc = base * zoom;
  const dw = img ? img.naturalWidth * sc : 0;
  const dh = img ? img.naturalHeight * sc : 0;
  const clamp = (p, w = dw, h = dh) => ({ x: Math.min(0, Math.max(W - w, p.x)), y: Math.min(0, Math.max(H - h, p.y)) });

  useEffect(() => { if (img) { setZoom(1); const b = Math.max(W / img.naturalWidth, H / img.naturalHeight); const w = img.naturalWidth * b, h = img.naturalHeight * b; setPos({ x: (W - w) / 2, y: (H - h) / 2 }); } }, [img, W]);

  function changeZoom(z) {
    z = Math.min(4, Math.max(1, z));
    const nsc = base * z;
    const cx = (W / 2 - pos.x) / sc, cy = (H / 2 - pos.y) / sc;
    setZoom(z);
    setPos(clamp({ x: W / 2 - cx * nsc, y: H / 2 - cy * nsc }, img.naturalWidth * nsc, img.naturalHeight * nsc));
  }
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }; };
  const move = (e) => { const d = drag.current; if (d) setPos(clamp({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy })); };
  const up = () => { drag.current = null; };

  async function save() {
    setBusy(true); setErr("");
    try {
      const sx = -pos.x / sc, sy = -pos.y / sc, sw = W / sc, sh = H / sc;
      const ow = Math.round(Math.min(sw, MAX_W)), oh = Math.round(ow * R);
      const c = document.createElement("canvas");
      c.width = ow; c.height = oh;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);
      const blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Falha ao gerar a imagem."))), "image/jpeg", 0.92));
      await onDone(new File([blob], "foto.jpg", { type: "image/jpeg" }));
    } catch (x) { setErr(x.message || "Não foi possível salvar o enquadramento."); }
    setBusy(false);
  }

  return (
    <div className="ad-modal crop" role="dialog" aria-label="Enquadrar foto">
      <div className="crop-panel">
        <h2>Enquadrar foto{step ? ` (${step})` : ""}</h2>
        <p className="ad-muted">Arraste a foto com o dedo para escolher o que aparece. Use o zoom para aproximar. É assim que o cliente vai ver.</p>
        <div className="crop-box" ref={box} style={{ height: H }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {img ? <img src={src} alt="" draggable={false} style={{ width: dw, height: dh, transform: `translate(${pos.x}px, ${pos.y}px)` }} />
            : <span style={{ color: "#fff", padding: "1rem", display: "block" }}>{err || "Carregando…"}</span>}
          <div className="crop-grid" />
        </div>
        <div className="ad-row">
          <button type="button" className="ad-btn ghost" onClick={() => changeZoom(zoom - 0.25)} disabled={!img}>− Zoom</button>
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="grow" style={{ flex: 1 }} aria-label="Zoom" disabled={!img} />
          <button type="button" className="ad-btn ghost" onClick={() => changeZoom(zoom + 0.25)} disabled={!img}>+ Zoom</button>
        </div>
        {err && img && <p className="ad-err">{err}</p>}
        <div className="ad-row end">
          <button type="button" className="ad-btn ghost" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className="ad-btn" onClick={save} disabled={!img || busy}>{busy ? "Salvando…" : "Usar esta foto"}</button>
        </div>
      </div>
    </div>
  );
}
