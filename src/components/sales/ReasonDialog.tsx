// src/components/sales/ReasonDialog.tsx
import { useState, type ReactNode } from "react";

/** Fenêtre de confirmation avec un texte obligatoire (motif d'annulation, note de clôture). */
export default function ReasonDialog({ title, children, label, placeholder, confirmLabel, danger, onConfirm, onClose }: {
  title: string;
  children?: ReactNode;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  danger?: boolean;
  /** Renvoie un message d'erreur à afficher, ou rien si tout s'est bien passé. */
  onConfirm: (text: string) => Promise<string | void>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) { setError("Ce champ est obligatoire."); return; }
    setSending(true);
    setError(null);
    const failure = await onConfirm(text.trim());
    if (failure) { setError(failure); setSending(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, padding: 22,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{title}</div>
        {children && <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>{children}</div>}
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "#334155" }}>
          {label}
          <textarea
            autoFocus rows={3} value={text} placeholder={placeholder}
            onChange={e => setText(e.target.value)}
            style={{
              padding: "10px 12px", borderRadius: 10, border: "1px solid #E2E8F0", resize: "vertical",
              fontSize: 14, fontFamily: "inherit", fontWeight: 400,
            }}
          />
        </label>
        {error && <div role="alert" style={{ fontSize: 13, color: "#B91C1C" }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff",
            cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
          }}>
            Retour
          </button>
          <button onClick={submit} disabled={sending} style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            background: sending ? "#94A3B8" : danger ? "#DC2626" : "#047857", color: "#fff",
            cursor: sending ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
          }}>
            {sending ? "Envoi..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
