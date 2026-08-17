// src/utils/productPrint.ts
import type { Product } from '../types/product';
import JsBarcode from 'jsbarcode';

// ── Helpers ───────────────────────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openAndPrint(html: string, delay: number) {
  const w = window.open('', '_blank', 'width=960,height=750');
  if (!w) { alert('Autorisez les popups pour imprimer.'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), delay);
}

// EAN-13 via canvas — même logique que barcodePrint.ts
function generateEAN13Url(code: string, height = 55): string | null {
  if (!code) return null;
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'EAN13',
      width: 2,
      height,
      displayValue: true,
      fontSize: 11,
      textMargin: 2,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ── Category grouping ─────────────────────────────────────────────

function groupByPrefix(products: Product[]): [string, Product[]][] {
  const count: Record<string, number> = {};
  for (const p of products) {
    const words = p.name.trim().split(/\s+/);
    if (words.length >= 2) {
      const k = words.slice(0, 2).join(' ').toLowerCase();
      count[k] = (count[k] || 0) + 1;
    }
  }
  const groups: Record<string, Product[]> = {};
  for (const p of products) {
    const words = p.name.trim().split(/\s+/);
    let key: string;
    if (words.length >= 2) {
      const two = words.slice(0, 2).join(' ').toLowerCase();
      key = count[two] >= 2 ? two : words[0].toLowerCase();
    } else {
      key = words[0].toLowerCase();
    }
    const label = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!groups[label]) groups[label] = [];
    groups[label].push(p);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'fr'));
}

// ── Impression liste (feuille de vente) ──────────────────────────

const ROW_H = 66; // px — assez pour 3 lignes manuscrites

export function printProductList(products: Product[], shopName = 'ShopM') {
  const thStyle = [
    'text-align:left', 'padding:9px 12px', 'background:#F1F5F9',
    'font-size:11px', 'font-weight:700', 'color:#475569',
    'text-transform:uppercase', 'letter-spacing:.04em',
    'border-bottom:2px solid #E2E8F0',
  ].join(';');

  const rows = products.map(p => `
    <tr style="border-bottom:1px solid #E2E8F0;page-break-inside:avoid">
      <td style="padding:9px 12px;font-weight:600;color:#0F172A;vertical-align:middle">${escHtml(p.name)}</td>
      <td style="padding:0;border-right:2px solid #94A3B8">
        <div style="height:${ROW_H}px;display:flex;flex-direction:column">
          <div style="flex:1;border-bottom:1px dashed #CBD5E1"></div>
          <div style="flex:1;border-bottom:1px dashed #CBD5E1"></div>
          <div style="flex:1"></div>
        </div>
      </td>
      <td></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Feuille de vente — ${escHtml(shopName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; font-size: 13px; background: #fff; padding: 1.8cm 1.5cm; }
  @page { size: A4; margin: 0; }
  tr  { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  table { page-break-inside: auto; width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
</style>
</head>
<body>

<div style="border-bottom:2px solid #1D4ED8;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end">
  <div>
    <div style="font-size:20px;font-weight:800;color:#1D4ED8;letter-spacing:-.5px">ShopM</div>
    <div style="font-size:11px;color:#64748B;margin-top:2px">Gestion commerciale</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:15px;font-weight:700;color:#0F172A">Feuille de vente</div>
    <div style="font-size:12px;color:#64748B;margin-top:2px">${escHtml(shopName)}</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:1px">Date : ___________________________</div>
  </div>
</div>

<table>
  <colgroup>
    <col>
    <col style="width:50%">
    <col style="width:13%">
  </colgroup>
  <thead>
    <tr>
      <th style="${thStyle}">Désignation</th>
      <th style="${thStyle};text-align:center">Quantité vendue</th>
      <th style="${thStyle};text-align:center">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="3" style="padding:10px 12px;font-size:11px;color:#94A3B8;border-top:2px solid #E2E8F0">
        Caissier : ___________________________
      </td>
    </tr>
  </tfoot>
</table>

</body>
</html>`;

  openAndPrint(html, 500);
}

// ── Impression catalogue ──────────────────────────────────────────

export function printProductCatalog(products: Product[], shopName = 'ShopM') {
  const grouped = groupByPrefix(products);
  const totalPages = grouped.reduce((sum, [, ps]) => sum + Math.ceil(ps.length / 4), 0);

  // Pré-générer tous les barcodes EAN-13 (canvas → data URL) avant d'ouvrir la popup
  const barcodeUrls = new Map<number, string>();
  for (const p of products) {
    const code = p.barcode || '';
    if (code) {
      const url = generateEAN13Url(code);
      if (url) barcodeUrls.set(p.id, url);
    }
  }

  // Page de couverture
  const cover = `
    <div class="page cover">
      <div class="cover-inner">
        <div class="cover-shop">${escHtml(shopName.toUpperCase())}</div>
        <div class="cover-rule"></div>
        <div class="cover-sub">Catalogue des articles</div>
        <div class="cover-count">${products.length}&nbsp;référence${products.length > 1 ? 's' : ''}&nbsp;&middot;&nbsp;Usage interne</div>
      </div>
    </div>`;

  // Pages produits
  let pageNum = 0;
  let pages = '';

  for (const [cat, catProducts] of grouped) {
    for (let i = 0; i < catProducts.length; i += 4) {
      pageNum++;
      const chunk = catProducts.slice(i, i + 4);

      const cards = chunk.map(p => {
        const bcUrl = barcodeUrls.get(p.id);
        return `
          <div class="card">
            <div class="card-img">
              ${p.primary_image
                ? `<img src="${p.primary_image}" alt="${escHtml(p.name)}"
                        onerror="this.parentNode.innerHTML='<div class=\\'img-ph\\'>&#9633;</div>'"/>`
                : `<div class="img-ph">&#9633;</div>`}
            </div>
            <div class="card-info">
              <div class="card-name">${escHtml(p.name.toUpperCase())}</div>
              ${bcUrl
                ? `<div class="card-bc"><img src="${bcUrl}" alt="barcode" class="bc-img"/></div>`
                : (p.sku ? `<div class="card-ref">Réf : ${escHtml(p.sku)}</div>` : '')}
            </div>
          </div>`;
      }).join('');

      const blanks = Array(4 - chunk.length).fill('<div class="card card-blank"></div>').join('');

      pages += `
        <div class="page">
          <div class="page-hd">
            <div class="hd-shop">${escHtml(shopName.toUpperCase())}</div>
            <div class="hd-cat">${escHtml(cat.toUpperCase())}</div>
          </div>
          <div class="hd-rule"></div>
          <div class="grid">${cards}${blanks}</div>
          <div class="page-foot">PAGE ${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</div>
        </div>`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Catalogue — ${escHtml(shopName)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif;
         background: #f0ede6;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .page {
    width: 210mm; height: 297mm;
    padding: 10mm 10mm 8mm;
    background: #f0ede6;
    page-break-after: always;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }

  /* Couverture */
  .cover { justify-content: center; align-items: center; }
  .cover-inner { text-align: center; }
  .cover-shop  { font-size: 36pt; font-weight: 700; letter-spacing: 0.1em; color: #1a1a1a; }
  .cover-rule  { width: 55mm; border: none; border-top: 0.6px solid #9a9486; margin: 8mm auto; }
  .cover-sub   { font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt;
                 letter-spacing: 0.38em; color: #6b6559; }
  .cover-count { font-family: Arial, Helvetica, sans-serif; font-size: 7pt;
                 letter-spacing: 0.22em; color: #9a9486; margin-top: 10mm; }

  /* En-tête page produit */
  .page-hd { display: flex; justify-content: space-between; align-items: baseline; flex-shrink: 0; }
  .hd-shop { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; font-weight: 700;
             letter-spacing: 0.14em; color: #1a1a1a; }
  .hd-cat  { font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt;
             letter-spacing: 0.28em; color: #7a7264; }
  .hd-rule { border: none; border-top: 0.4px solid #b8b2a8; margin: 2.5mm 0; flex-shrink: 0; }

  /* Grille 2×2 */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 4mm;
    flex: 1;
    min-height: 0;
  }

  /* Carte */
  .card { background: #fff; border: 0.5px solid #ccc9c1;
          display: flex; flex-direction: column; overflow: hidden; }
  .card-blank { background: transparent; border: none; }

  .card-img {
    flex: 1; min-height: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; background: #faf9f7;
  }
  .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .img-ph { font-size: 32pt; color: #d4cfc8; }

  .card-info {
    padding: 3mm 4mm 3.5mm;
    display: flex; flex-direction: column; align-items: center; gap: 1.5mm;
    flex-shrink: 0;
    border-top: 0.4px solid #e8e5e0;
  }
  .card-name {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 7.5pt; font-weight: 700;
    text-align: center; color: #1a1a1a;
    letter-spacing: 0.05em; line-height: 1.3;
  }
  .card-bc  { width: 100%; display: flex; justify-content: center; }
  .bc-img   { display: block; max-width: 100%; height: 42px; object-fit: contain; }
  .card-ref { font-family: 'Courier New', Courier, monospace;
              font-size: 6pt; color: #9a9486; text-align: center; }

  /* Pied de page */
  .page-foot {
    text-align: center;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 6.5pt; letter-spacing: 0.22em; color: #9a9486;
    padding-top: 2.5mm; flex-shrink: 0;
  }
</style>
</head>
<body>
  ${cover}
  ${pages}
</body>
</html>`;

  openAndPrint(html, 800);
}
