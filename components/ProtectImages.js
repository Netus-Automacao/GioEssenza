"use client";
import { useEffect } from "react";

// bloqueia o menu do toque longo (e do botão direito) no site e no painel,
// para não interromper zoom, sliders e arrastes. Campos de texto continuam com copiar/colar.
export default function ProtectImages() {
  useEffect(() => {
    const editable = (t) => t instanceof Element && t.closest("input:not([type=range]), textarea, [contenteditable=true]");
    const block = (e) => { if (!editable(e.target)) e.preventDefault(); };
    const noDrag = (e) => { if (e.target instanceof HTMLImageElement || e.target instanceof HTMLCanvasElement) e.preventDefault(); };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", noDrag);
    return () => { document.removeEventListener("contextmenu", block); document.removeEventListener("dragstart", noDrag); };
  }, []);
  return null;
}
