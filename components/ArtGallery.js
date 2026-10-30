"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// grade com carregamento progressivo: busca mais modelos quando o fim da lista aparece na tela
export default function ArtGallery({ galleryId, initial, total, pageSize }) {
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(null);
  const end = useRef(null);
  const done = items.length >= total;

  useEffect(() => {
    if (done || !end.current) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loading) return;
      setLoading(true);
      const from = items.length;
      const { data } = await supabase.from("art_items").select("id,thumb,mockup").eq("gallery_id", galleryId)
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
          </figure>
        ))}
      </div>
      {!done && <div ref={end} className="art-more">{loading ? "Carregando mais modelos…" : ""}</div>}
      {zoom !== null && items[zoom] && (
        <div className="art-zoom" onClick={() => setZoom(null)} role="dialog" aria-label={`Modelo ${zoom + 1}`}>
          <img src={items[zoom].mockup || items[zoom].thumb} alt={`Modelo ${zoom + 1}`} onClick={(e) => e.stopPropagation()} />
          <p>Modelo {String(zoom + 1).padStart(2, "0")} — toque fora para fechar</p>
          {zoom > 0 && <button className="gal-nav prev" onClick={(e) => { e.stopPropagation(); setZoom(zoom - 1); }} aria-label="Anterior">‹</button>}
          {zoom < items.length - 1 && <button className="gal-nav next" onClick={(e) => { e.stopPropagation(); setZoom(zoom + 1); }} aria-label="Próximo">›</button>}
        </div>
      )}
    </>
  );
}
