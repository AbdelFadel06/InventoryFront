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
