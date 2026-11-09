// src/components/ui/ProductThumb.tsx
// Miniature d'un produit dans un tableau : un clic affiche la photo en grand, au premier plan.
// Fermeture : croix, clic à côté de la photo ou touche Échap.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ANIMATIONS = `
@keyframes shopm-lightbox-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes shopm-lightbox-zoom { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
@media (prefers-reduced-motion: reduce) {
  .shopm-lightbox, .shopm-lightbox figure { animation: none !important; }
}`;

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";   // la page ne défile pas derrière
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return createPortal(
    <div
      className="shopm-lightbox"
      role="dialog" aria-modal="true" aria-label={alt}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, padding: 16,
        background: "rgba(15,23,42,0.78)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "shopm-lightbox-fade 0.18s ease-out", cursor: "zoom-out",
      }}
    >
      <style>{ANIMATIONS}</style>
      <figure
        onClick={e => e.stopPropagation()}
        style={{
          margin: 0, position: "relative", cursor: "default",
          animation: "shopm-lightbox-zoom 0.2s ease-out",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}
      >
        <img src={src} alt={alt} style={{
          maxWidth: "min(92vw, 900px)", maxHeight: "80vh", objectFit: "contain",
          borderRadius: 14, background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }} />
        {alt && <figcaption style={{ color: "#F8FAFC", fontSize: 14.5, fontWeight: 600, textAlign: "center" }}>{alt}</figcaption>}
        <button
          type="button" aria-label="Fermer" onClick={onClose} autoFocus
          style={{
            position: "absolute", top: -14, right: -14, width: 36, height: 36, borderRadius: 18,
            border: "none", background: "#fff", color: "#0F172A", fontSize: 20, lineHeight: "36px",
            cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
          }}
        >×</button>
      </figure>
    </div>,
    document.body,
  );
}

export function ProductThumb({ src, alt = "", style }: { src: string; alt?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={alt ? `Agrandir la photo : ${alt}` : "Agrandir la photo"}
        onClick={e => { e.stopPropagation(); setOpen(true); }}   // ne pas ouvrir la ligne du tableau
        style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", flexShrink: 0, display: "flex" }}
      >
        <img src={src} alt={alt} style={style} />
      </button>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
