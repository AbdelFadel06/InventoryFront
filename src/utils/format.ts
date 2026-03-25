// src/utils/format.ts
export const formatPrice = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `${num.toLocaleString("fr-FR")} F`;
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
  });
};

/**
 * Normalise un numéro béninois vers le nouveau format (+229 01XXXXXXXX).
 * Ancien format : +229XXXXXXXX (8 chiffres) → +22901XXXXXXXX
 */
export const normalizeBeninPhone = (phone: string): string => {
  if (!phone) return phone;
  const s = phone.replace(/\s|-/g, "");
  // Déjà nouveau format : +229 01 + 8 chiffres
  if (/^\+22901\d{8}$/.test(s)) return s;
  // Ancien format : +229 + 8 chiffres ne commençant pas par 01
  if (/^\+229\d{8}$/.test(s)) return `+22901${s.slice(4)}`;
  // Format local sans indicatif : 8 chiffres
  if (/^\d{8}$/.test(s)) return `+22901${s}`;
  // Format local nouveau : 01 + 8 chiffres
  if (/^01\d{8}$/.test(s)) return `+229${s}`;
  return s;
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
};
