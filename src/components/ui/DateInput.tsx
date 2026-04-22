// Saisie de date DD/MM/YYYY + icône calendrier natif — stocke en ISO YYYY-MM-DD
import { useState, useEffect, useRef } from "react";

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

function displayToIso(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}`);
  if (isNaN(date.getTime())) return "";
  return `${y}-${m}-${d}`;
}

interface Props {
  value: string;           // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  max?: string;
  min?: string;
  style?: React.CSSProperties;
}

export function DateInput({ value, onChange, max, min, style }: Props) {
  const [text, setText]     = useState(isoToDisplay(value));
  const [focused, setFocused] = useState(false);
  const pickerRef           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d/]/g, "");
    if (v.length === 2 && text.length === 1) v += "/";
    else if (v.length === 5 && text.length === 4) v += "/";
    setText(v);
    const iso = displayToIso(v);
    if (!iso) return;
    if (max && iso > max) return;
    if (min && iso < min) return;
    onChange(iso);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (!iso) return;
    onChange(iso);
    setText(isoToDisplay(iso));
  };

  const openPicker = () => {
    try { pickerRef.current?.showPicker(); }
    catch { pickerRef.current?.click(); }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="JJ/MM/AAAA"
        maxLength={10}
        style={{
          padding: "8px 36px 8px 12px",
          border: `1px solid ${focused ? "#3B82F6" : "#E2E8F0"}`,
          borderRadius: 9, fontSize: 13.5, color: "#374151",
          outline: "none", fontFamily: "inherit", width: 148,
          background: "#fff", ...style,
        }}
      />
      {/* Icône calendrier */}
      <button
        type="button"
        onClick={openPicker}
        style={{
          position: "absolute", right: 8, background: "none", border: "none",
          cursor: "pointer", padding: 0, color: "#94A3B8", lineHeight: 1,
          display: "flex", alignItems: "center",
        }}
        title="Ouvrir le calendrier"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
      {/* Picker natif caché */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        max={max}
        min={min}
        onChange={handlePickerChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        tabIndex={-1}
      />
    </div>
  );
}
