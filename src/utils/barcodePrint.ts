import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

interface LabelProduct {
  id: number;
  name: string;
  barcode: string;
}

const COLS = 3;
const REPEATS = 6; // exemplaires par produit
const MARGIN_X = 10;
const MARGIN_Y = 12;
const GAP_X = 5;
const GAP_Y = 6;
const SECTION_TITLE_H = 9;  // hauteur zone titre produit
const SECTION_GAP = 10;     // espace entre deux produits
const LABEL_W = (210 - 2 * MARGIN_X - (COLS - 1) * GAP_X) / COLS; // ~60mm
const LABEL_H = 22;         // hauteur d'un code-barres (compact, sans nom)
const PAGE_H = 297;

function generateBarcodeImage(code: string): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, code, {
    format: "EAN13",
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 11,
    textMargin: 2,
    margin: 4,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return canvas.toDataURL("image/png");
}

/**
 * Impression d'une seule fiche produit (6 exemplaires, format ancien).
 * Conservé pour le bouton individuel.
 */
export function printBarcodeLabels(product: LabelProduct): void {
  printAllBarcodeLabels([product]);
}

/**
 * Génère un PDF pour plusieurs produits.
 * Format : grand titre (nom du produit) + 6 codes-barres en 3×2
 * sans répéter le nom sur chaque code-barres.
 */
export function printAllBarcodeLabels(products: LabelProduct[]): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  let cursorY = MARGIN_Y;
  let firstProduct = true;

  for (const product of products) {
    const sectionH = SECTION_TITLE_H + 4 + 2 * (LABEL_H + GAP_Y) - GAP_Y;

    // Nouvelle page si plus assez de place
    if (!firstProduct && cursorY + sectionH > PAGE_H - MARGIN_Y) {
      doc.addPage();
      cursorY = MARGIN_Y;
    }
    firstProduct = false;

    // ── Titre produit ───────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const maxChars = 60;
    const title = product.name.length > maxChars
      ? product.name.substring(0, maxChars - 1) + "…"
      : product.name;
    doc.text(title, MARGIN_X, cursorY + 6);

    // Ligne de séparation sous le titre
    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.4);
    doc.line(MARGIN_X, cursorY + 8, 210 - MARGIN_X, cursorY + 8);
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);

    cursorY += SECTION_TITLE_H + 3;

    // ── 6 codes-barres en 3×2 ──────────────────────────────────────
    const imgData = generateBarcodeImage(product.barcode);

    for (let i = 0; i < REPEATS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN_X + col * (LABEL_W + GAP_X);
      const y = cursorY + row * (LABEL_H + GAP_Y);

      // Bordure pointillée (guide de découpe)
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.rect(x, y, LABEL_W, LABEL_H, "S");
      doc.setLineDashPattern([], 0);

      // Code-barres centré dans la cellule
      doc.addImage(imgData, "PNG", x + 2, y + 1, LABEL_W - 4, LABEL_H - 2);
    }

    cursorY += 2 * (LABEL_H + GAP_Y) - GAP_Y + SECTION_GAP;
  }

  const filename = products.length === 1
    ? `etiquettes_${products[0].name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)}.pdf`
    : `etiquettes_${products.length}_produits.pdf`;

  doc.save(filename);
}
