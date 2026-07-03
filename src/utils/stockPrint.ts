import type { Stock } from "../types/stock";

const fmt = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

export function printStockReport(stocks: Stock[], shopName = ""): void {
  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const thStyle = `text-align:left;padding:9px 12px;background:#F1F5F9;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #E2E8F0`;

  const locationLabel = (loc: string) => loc === "MAGASIN" ? "Magasin" : "Boutique";

  const rows = stocks.map(s => {
    const price = s.product_selling_price ? fmt(s.product_selling_price) : "—";
    return `<tr style="border-bottom:1px solid #E2E8F0;page-break-inside:avoid">
      <td style="padding:9px 12px;font-weight:600;color:#0F172A">${(s.product_name ?? "").replace(/</g, "&lt;")}</td>
      <td style="padding:9px 12px;color:#64748B">${price}</td>
      <td style="padding:9px 12px;font-weight:700;color:#0F172A">${s.quantity}</td>
      <td style="padding:9px 12px;color:#64748B">${locationLabel(s.location)}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title></title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; font-size: 13px; background: #fff; padding: 1.8cm 1.5cm; }
  @page { size: A4; margin: 0; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  table { page-break-inside: auto; width: 100%; border-collapse: collapse; font-size: 13px; }
</style>
</head>
<body>

<!-- En-tête -->
<div style="border-bottom:2px solid #1D4ED8;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end">
  <div>
    <div style="font-size:20px;font-weight:800;color:#1D4ED8;letter-spacing:-.5px">ShopM</div>
    <div style="font-size:11px;color:#64748B;margin-top:2px">Gestion commerciale</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:15px;font-weight:700;color:#0F172A">Rapport de stock</div>
    <div style="font-size:12px;color:#64748B;margin-top:2px">${shopName}</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:1px">${date}</div>
  </div>
</div>

<!-- Tableau stock -->
<table>
  <thead>
    <tr>
      <th style="${thStyle}">Produit</th>
      <th style="${thStyle}">Prix unitaire</th>
      <th style="${thStyle}">Quantité</th>
      <th style="${thStyle}">Emplacement</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4" style="padding:10px 12px;font-size:11px;color:#94A3B8;border-top:2px solid #E2E8F0">
        ${stocks.length} article${stocks.length > 1 ? "s" : ""} — Généré le ${date}
      </td>
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
