"use client";
import { useEffect } from "react";

// impede "salvar imagem" pelo toque longo / botão direito e o arrastar das fotos do catálogo
export default function ProtectImages() {
  useEffect(() => {
    const block = (e) => { if (e.target instanceof HTMLImageElement && e.target.closest(".cat")) e.preventDefault(); };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => { document.removeEventListener("contextmenu", block); document.removeEventListener("dragstart", block); };
  }, []);
  return null;
}
