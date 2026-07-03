import type { Product } from "../types/product";

const UNIT_LABELS: Record<string, string> = {
  piece: "Pièce", kg: "Kg", g: "Gramme", l: "Litre",
  ml: "ml", m: "Mètre", cm: "cm", box: "Boîte", pack: "Pack", other: "Autre",
};

function stockStatus(p: Product): { label: string; color: string } {
  if ((p.current_stock ?? 0) === 0) return { label: "Rupture", color: "#DC2626" };
  if (p.is_low_stock) return { label: "Stock bas", color: "#D97706" };
  return { label: "OK", color: "#16A34A" };
}

export function printStockReport(products: Product[], shopName = ""): void {
  const date = new Date().toLocaleDateString("fr-FR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const rows = products.map(p => {
    const { label, color } = stockStatus(p);
    return `<tr>
      <td>${p.name.replace(/</g, "&lt;")}</td>
      <td style="font-family:monospace;font-size:11px">${p.sku}</td>
      <td style="text-align:center;font-weight:700;font-size:13px">${p.current_stock ?? 0}</td>
      <td style="text-align:center;color:#64748B">${p.minimum_stock}</td>
      <td style="text-align:center;color:#64748B">${UNIT_LABELS[p.unit] ?? p.unit}</td>
      <td style="text-align:center;font-weight:700;color:${color}">${label}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport de Stock</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #0F172A; padding: 16mm 18mm; }
  h1 { font-size: 20pt; font-weight: 700; margin-bottom: 3px; }
  .meta { color: #64748B; font-size: 10pt; margin-bottom: 18px; border-bottom: 2px solid #1D4ED8; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #1D4ED8; color: #fff; padding: 9px 11px;
    text-align: left; font-size: 10pt; font-weight: 600;
  }
  tbody td { padding: 8px 11px; border-bottom: 1px solid #E2E8F0; font-size: 10pt; }
  tbody tr:nth-child(even) td { background: #F8FAFC; }
  tfoot td { padding: 10px 11px; font-size: 10pt; color: #64748B; border-top: 2px solid #E2E8F0; }
  @media print {
    @page { margin: 12mm 15mm; size: A4 portrait; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>Rapport de Stock</h1>
<p class="meta">${shopName ? `<strong>${shopName}</strong> &nbsp;·&nbsp;` : ""}${date} &nbsp;·&nbsp; ${products.length} produit${products.length > 1 ? "s" : ""}</p>
<table>
  <thead>
    <tr>
      <th>Produit</th>
      <th>SKU</th>
      <th style="text-align:center">Stock actuel</th>
      <th style="text-align:center">Stock min.</th>
      <th style="text-align:center">Unité</th>
      <th style="text-align:center">Statut</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="6">Généré le ${date}${shopName ? ` — ${shopName}` : ""} — ${products.length} produit${products.length > 1 ? "s" : ""}</td>
    </tr>
  </tfoot>
</table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) return;
  w.onload = () => {
    w.print();
    URL.revokeObjectURL(url);
  };
}
