// src/components/sales/IconAction.tsx
import { useState } from "react";

export const ACTION_ICONS = {
  check:  "M20 6L9 17l-5-5",
  cancel: "M12 22a10 10 0 100-20 10 10 0 000 20z M4.93 4.93l14.14 14.14",
  edit:   "M12 20h9 M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z",
  flag:   "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
};

const TONES = {
  green: { color: "#047857", background: "#ECFDF5", border: "#A7F3D0" },
  red:   { color: "#DC2626", background: "#FEF2F2", border: "#FECACA" },
  blue:  { color: "#1D4ED8", background: "#EFF6FF", border: "#BFDBFE" },
  amber: { color: "#B45309", background: "#FFFBEB", border: "#FDE68A" },
};

/** Bouton icône avec son libellé en bulle au survol (et au focus clavier). */
export default function IconAction({ icon, label, tone, onClick, disabled, size = 34 }: {
  icon: keyof typeof ACTION_ICONS;
  label: string;
  tone: keyof typeof TONES;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(false);
  const t = TONES[tone];
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        style={{
          width: size, height: size, borderRadius: 9, border: `1px solid ${t.border}`,
          background: disabled ? "#F1F5F9" : t.background, color: disabled ? "#94A3B8" : t.color,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ACTION_ICONS[icon]} />
        </svg>
      </button>
      {hover && (
        <span role="tooltip" style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          padding: "4px 8px", borderRadius: 6, background: "#0F172A", color: "#fff",
          fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10,
        }}>
          {label}
        </span>
      )}
    </span>
  );
}
