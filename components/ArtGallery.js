"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// grade com carregamento progressivo: busca mais modelos quando o fim da lista aparece na tela
// baixa o modelo como JPG direto no aparelho
// marca d'água em mosaico: só no arquivo baixado, nunca nas imagens do catálogo
function watermark(x, w, h, text) {
  const fs = Math.max(14, Math.round(w / 30));
  x.save();
  x.font = `600 ${fs}px system-ui, sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle";
  const stepX = x.measureText(text).width + fs * 3, stepY = fs * 4.2;
  x.translate(w / 2, h / 2); x.rotate(-Math.PI / 6);
  const R = Math.hypot(w, h);
  for (let yy = -R, row = 0; yy < R; yy += stepY, row++) {
    for (let xx = -R + (row % 2) * stepX / 2; xx < R; xx += stepX) {
      x.lineWidth = Math.max(1, fs / 10); x.strokeStyle = "rgba(0,0,0,.10)"; x.strokeText(text, xx, yy);
      x.fillStyle = "rgba(255,255,255,.30)"; x.fillText(text, xx, yy);
    }
  }
  x.restore();
}

async function saveImage(url, n, setMsg, mark) {
  try {
    setMsg(n);
    const img = await new Promise((ok, bad) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0);
    if (mark) watermark(x, c.width, c.height, mark);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.92));
    const name = `modelo-${String(n).padStart(2, "0")}.jpg`;
    const file = new File([blob], name, { type: "image/jpeg" });
    // download direto em todos os aparelhos (sem abrir a tela de compartilhar)
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch { window.open(url, "_blank"); }
  setMsg(null);
}

export default function ArtGallery({ galleryId, initial, total, pageSize, mark = "" }) {
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [saving, setSaving] = useState(null);
  const end = useRef(null);
  const done = items.length >= total;

  useEffect(() => {
    if (done || !end.current) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loading) return;
      setLoading(true);
      const from = items.length;
      const { data } = await supabase.from("art_items").select("id,thumb,mockup").eq("gallery_id", galleryId).eq("published", true)
        .order("position").order("created_at").range(from, from + pageSize - 1);
      setItems((x) => [...x, ...(data || []).filter((d) => !x.some((y) => y.id === d.id))]);
      setLoading(false);
    }, { rootMargin: "600px" });
    io.observe(end.current);
    return () => io.disconnect();
  }, [items.length, done, loading, galleryId, pageSize]);

  useEffect(() => {
    if (zoom === null) return;
    const k = (e) => { if (e.key === "Escape") setZoom(null); if (e.key === "ArrowRight") setZoom((z) => Math.min(items.length - 1, z + 1)); if (e.key === "ArrowLeft") setZoom((z) => Math.max(0, z - 1)); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [zoom, items.length]);

  if (!items.length) return <p className="empty">Em breve, novos modelos nesta galeria.</p>;
  return (
    <>
      <div className="art-grid">
        {items.map((it, i) => (
          <figure key={it.id} onClick={() => setZoom(i)}>
            <img src={it.thumb || it.mockup} alt={`Modelo ${i + 1}`} loading="lazy" decoding="async" />
            <figcaption>Modelo {String(i + 1).padStart(2, "0")}</figcaption>
            <button type="button" className="art-save" disabled={saving === i + 1} onClick={(e) => { e.stopPropagation(); saveImage(it.mockup || it.thumb, i + 1, setSaving, mark); }}>
              {saving === i + 1 ? "Salvando…" : "⬇ Salvar imagem"}
            </button>
          </figure>
        ))}
      </div>
      {!done && <div ref={end} className="art-more">{loading ? "Carregando mais modelos…" : ""}</div>}
      {zoom !== null && items[zoom] && (
        <div className="art-zoom" onClick={() => setZoom(null)} role="dialog" aria-label={`Modelo ${zoom + 1}`}>
          <img src={items[zoom].mockup || items[zoom].thumb} alt={`Modelo ${zoom + 1}`} onClick={(e) => e.stopPropagation()} />
          <p>Modelo {String(zoom + 1).padStart(2, "0")} — toque fora para fechar</p>
          <button type="button" className="art-save big" onClick={(e) => { e.stopPropagation(); saveImage(items[zoom].mockup || items[zoom].thumb, zoom + 1, setSaving, mark); }}>⬇ Salvar imagem</button>
          {zoom > 0 && <button className="gal-nav prev" onClick={(e) => { e.stopPropagation(); setZoom(zoom - 1); }} aria-label="Anterior">‹</button>}
          {zoom < items.length - 1 && <button className="gal-nav next" onClick={(e) => { e.stopPropagation(); setZoom(zoom + 1); }} aria-label="Próximo">›</button>}
        </div>
      )}
    </>
  );
}
