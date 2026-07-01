import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

interface LabelProduct {
  id: number;
  name: string;
  barcode: string;
}

// A4 : 3 colonnes × 2 rangées = 6 étiquettes identiques par produit
export function printBarcodeLabels(product: LabelProduct): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const COLS = 3;
  const ROWS = 2;
  const MARGIN_X = 10;
  const MARGIN_Y = 20;
  const GAP_X = 5;
  const GAP_Y = 10;
  const LABEL_W = (210 - 2 * MARGIN_X - (COLS - 1) * GAP_X) / COLS; // ~60mm
  const LABEL_H = 42;

  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = MARGIN_X + col * (LABEL_W + GAP_X);
    const y = MARGIN_Y + row * (LABEL_H + GAP_Y);

    // Bordure pointillée (pour découper)
    doc.setDrawColor(150, 150, 150);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.roundedRect(x, y, LABEL_W, LABEL_H, 2, 2, "S");
    doc.setLineDashPattern([], 0);

    // Nom du produit
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const maxChars = 35;
    const label = product.name.length > maxChars
      ? product.name.substring(0, maxChars - 1) + "…"
      : product.name;
    doc.text(label, x + LABEL_W / 2, y + 6, { align: "center" });

    // Générer le code-barres sur un canvas temporaire
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, product.barcode, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 11,
      textMargin: 3,
      margin: 4,
      background: "#ffffff",
      lineColor: "#000000",
    });

    const imgData = canvas.toDataURL("image/png");
    const barcodeW = LABEL_W - 8;
    const barcodeH = LABEL_H - 10;
    doc.addImage(imgData, "PNG", x + 4, y + 9, barcodeW, barcodeH);
  }

  const safeName = product.name.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  doc.save(`etiquettes_${safeName}.pdf`);
}
