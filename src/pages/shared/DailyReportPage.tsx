// src/pages/shared/DailyReportPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, StatCard, Icon } from "../../components/ui";
import { formatDate, formatDateTime } from "../../utils/format";
import axiosInstance from "../../api/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────
interface ProductRecap {
  product__id: number;
  product__name: string;
  product__sku: string;
  product__unit: string;
  total_qty: number;
  total_subtotal: number;
  total_discount: number;
  total_amount: number;
}

interface ByLivreur {
  livreur_id: number;
  livreur_name: string;
  pending_amount?: number | string;
  pending_count?: number;
}

interface Expense {
  id: number;
  label: string;
  amount: string;
  sale_date: string;
  created_by_name: string | null;
  created_at: string;
}

interface DailyReport {
  date: string;
  summary: {
    total_sales: number;
    total_amount: number;
    total_discount: number;
    cash_total: number;
    momo_total: number;
    deliveries_pending: number;
    total_expenses: number;
    total_collected: number;
    net_total: number;
  };
  products_recap: ProductRecap[];
  by_livreur: ByLivreur[];
  expenses: Expense[];
}

// ── Helpers ───────────────────────────────────────────────────────
const safeNum = (v: any): number => { const n = Number(v); return isNaN(n) ? 0 : n; };
const fmtPrice = (n: number | string | null | undefined) => safeNum(n).toLocaleString("fr-FR") + " F";

// ── Section wrapper ───────────────────────────────────────────────
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{
    background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 12, overflow: "hidden", marginBottom: 16,
  }}>
    <div style={{
      padding: "12px 18px", borderBottom: "1px solid #E2E8F0",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{title}</span>
    </div>
    {children}
  </div>
);

// ── Print helpers ─────────────────────────────────────────────────
const UNIT_LABELS_PRINT: Record<string, string> = {
  piece: "pcs", kg: "kg", g: "g", l: "L",
  ml: "ml", m: "m", box: "boîte(s)", pack: "pack(s)",
};

function buildPrintHTML(report: DailyReport, shopName: string, date: string): string {
  const fmt = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const productsRows = report.products_recap.map((p, idx) => {
    const unitPrice = p.total_qty > 0 ? Math.round(p.total_subtotal / p.total_qty) : 0;
    return `<tr style="border-bottom:1px solid #E2E8F0;page-break-inside:avoid">
      <td style="padding:9px 12px;font-weight:600;color:#0F172A">${p.product__name}</td>
      <td style="padding:9px 12px;color:#64748B">${fmt(unitPrice)}</td>
      <td style="padding:9px 12px;font-weight:600">${p.total_qty} ${UNIT_LABELS_PRINT[p.product__unit] ?? p.product__unit}</td>
      <td style="padding:9px 12px;color:#64748B">${fmt(p.total_subtotal)}</td>
      <td style="padding:9px 12px;color:#374151">${p.total_discount > 0 ? `−${fmt(p.total_discount)}` : "—"}</td>
      <td style="padding:9px 12px;font-weight:700;color:#0F172A">${fmt(p.total_amount)}</td>
    </tr>`;
  }).join("");

  const totalQty   = report.products_recap.reduce((s, p) => s + p.total_qty, 0);
  const totalSub   = report.products_recap.reduce((s, p) => s + Number(p.total_subtotal), 0);
  const totalDisc  = report.products_recap.reduce((s, p) => s + Number(p.total_discount), 0);
  const totalAmt   = report.products_recap.reduce((s, p) => s + Number(p.total_amount), 0);

  const livreurRows = report.by_livreur.map(l => `
    <tr style="border-bottom:1px solid #E2E8F0;page-break-inside:avoid">
      <td style="padding:9px 12px;font-weight:600;color:#0F172A">${l.livreur_name}</td>
      <td style="padding:9px 12px;text-align:center;font-weight:600">${l.pending_count}</td>
      <td style="padding:9px 12px;font-weight:700;color:#D97706">${fmt(l.pending_amount)}</td>
    </tr>`).join("");
  const livreurTotal = report.by_livreur.reduce((s, l) => s + safeNum(l.pending_amount), 0);
  const livreurTotalCount = report.by_livreur.reduce((s, l) => s + safeNum(l.pending_count), 0);

  const expenseRows = report.expenses.map(e => `
    <tr style="border-bottom:1px solid #E2E8F0;page-break-inside:avoid">
      <td style="padding:9px 12px;color:#0F172A">${e.label}</td>
      <td style="padding:9px 12px;color:#64748B;font-size:11px">${e.created_by_name ?? "—"}</td>
      <td style="padding:9px 12px;font-weight:600;color:#DC2626;text-align:right">−${fmt(e.amount)}</td>
    </tr>`).join("");

  const thStyle = `text-align:left;padding:9px 12px;background:#F1F5F9;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #E2E8F0`;
  const sectionTitle = `background:#F8FAFC;padding:10px 16px;font-size:13px;font-weight:700;color:#1D4ED8;border-bottom:1px solid #E2E8F0;border-top:3px solid #1D4ED8;margin-top:20px`;
  const tableStyle = `width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title></title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; font-size: 13px; background: #fff; padding: 1.8cm 1.5cm; }
  @page { size: A4; margin: 0; }

  /* Empêcher les lignes de tableau de se couper entre pages */
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  /* Empêcher les blocs récap de se couper */
  .section { page-break-inside: avoid; }

  /* Laisser les longs tableaux se couper entre les lignes (pas avant le thead) */
  table { page-break-inside: auto; }

  .card { border:1px solid #E2E8F0; border-radius:8px; padding:14px 18px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
  .stat-label { font-size:11px; color:#64748B; margin-bottom:4px; font-weight:500; }
  .stat-value { font-size:18px; font-weight:800; color:#0F172A; }
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
    <div style="font-size:15px;font-weight:700;color:#0F172A">Rapport journalier</div>
    <div style="font-size:12px;color:#64748B;margin-top:2px">${shopName}</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:1px">${dateLabel}</div>
  </div>
</div>

<!-- Résumé encaissements -->
<div class="section" style="margin-bottom:16px">
  <div class="grid-4" style="margin-bottom:12px">
    <div class="card">
      <div class="stat-label">Ventes</div>
      <div class="stat-value" style="font-size:22px">${report.summary.total_sales}</div>
    </div>
    <div class="card">
      <div class="stat-label">CA total</div>
      <div class="stat-value">${fmt(report.summary.total_amount)}</div>
    </div>
    <div class="card">
      <div class="stat-label">Total encaissé</div>
      <div class="stat-value" style="color:#1D4ED8">${fmt(report.summary.total_collected)}</div>
    </div>
    <div class="card">
      <div class="stat-label">Net final</div>
      <div class="stat-value" style="color:${report.summary.net_total >= 0 ? "#059669" : "#DC2626"}">${fmt(report.summary.net_total)}</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="card">
      <div class="stat-label">Espèces (dont livraisons)</div>
      <div style="font-size:15px;font-weight:700">${fmt(report.summary.cash_total)}</div>
    </div>
    <div class="card">
      <div class="stat-label">Mobile Money (dont livraisons)</div>
      <div style="font-size:15px;font-weight:700">${fmt(report.summary.momo_total)}</div>
    </div>
    <div class="card" style="border-color:#FED7AA">
      <div class="stat-label" style="color:#92400E">En attente livraison</div>
      <div style="font-size:15px;font-weight:700;color:#D97706">${fmt(report.summary.deliveries_pending)}</div>
    </div>
  </div>
</div>

<!-- Articles vendus -->
${report.products_recap.length > 0 ? `
<div style="${sectionTitle}">Articles vendus</div>
<table style="${tableStyle}">
  <thead>
    <tr>
      <th style="${thStyle}">Produit</th>
      <th style="${thStyle}">Prix unit.</th>
      <th style="${thStyle}">Qté</th>
      <th style="${thStyle}">Sous-total</th>
      <th style="${thStyle}">Réduction</th>
      <th style="${thStyle}">Total</th>
    </tr>
  </thead>
  <tbody>${productsRows}</tbody>
  <tfoot>
    <tr style="background:#F1F5F9;border-top:2px solid #CBD5E1">
      <td style="padding:10px 12px;font-weight:800;color:#0F172A">TOTAL</td>
      <td style="padding:10px 12px"></td>
      <td style="padding:10px 12px;font-weight:700">${totalQty} unités</td>
      <td style="padding:10px 12px;font-weight:700;color:#64748B">${fmt(totalSub)}</td>
      <td style="padding:10px 12px;font-weight:700;color:#DC2626">−${fmt(totalDisc)}</td>
      <td style="padding:10px 12px;font-weight:800;color:#1D4ED8;font-size:14px">${fmt(totalAmt)}</td>
    </tr>
  </tfoot>
</table>` : ""}

<!-- Livreurs -->
${report.by_livreur.length > 0 ? `
<div class="section">
<div style="${sectionTitle};margin-top:20px">Livraisons en attente de paiement</div>
<table style="${tableStyle}">
  <thead>
    <tr>
      <th style="${thStyle}">Livreur</th>
      <th style="${thStyle};text-align:center">Colis non payés</th>
      <th style="${thStyle}">Montant en attente</th>
    </tr>
  </thead>
  <tbody>${livreurRows}</tbody>
  <tfoot>
    <tr style="background:#FFF7ED;border-top:2px solid #FED7AA">
      <td style="padding:10px 12px;font-weight:800">TOTAL</td>
      <td style="padding:10px 12px;font-weight:800;text-align:center">${livreurTotalCount}</td>
      <td style="padding:10px 12px;font-weight:800;color:#D97706">${fmt(livreurTotal)}</td>
    </tr>
  </tfoot>
</table>
</div>` : ""}

<!-- Dépenses -->
${report.expenses.length > 0 ? `
<div class="section">
<div style="${sectionTitle};margin-top:20px">Dépenses</div>
<table style="${tableStyle}">
  <thead>
    <tr>
      <th style="${thStyle}">Libellé</th>
      <th style="${thStyle}">Enregistré par</th>
      <th style="${thStyle};text-align:right">Montant</th>
    </tr>
  </thead>
  <tbody>${expenseRows}</tbody>
  <tfoot>
    <tr style="background:#FEF2F2;border-top:2px solid #FECACA">
      <td style="padding:10px 12px;font-weight:800" colspan="2">Total dépenses</td>
      <td style="padding:10px 12px;font-weight:800;color:#DC2626;text-align:right">−${fmt(report.summary.total_expenses)}</td>
    </tr>
  </tfoot>
</table>
</div>` : ""}

<!-- Bilan net -->
<div class="section" style="margin-top:24px;border:2px solid #1D4ED8;border-radius:8px;overflow:hidden;page-break-inside:avoid">
  <div style="background:#1D4ED8;padding:10px 16px;color:#fff;font-weight:700;font-size:13px">
    Bilan net — ${dateLabel}
  </div>
  <div class="grid-3" style="gap:0">
    <div style="padding:16px 20px;border-right:1px solid #E2E8F0">
      <div class="stat-label">Total encaissé</div>
      <div class="stat-value">${fmt(report.summary.total_collected)}</div>
    </div>
    <div style="padding:16px 20px;border-right:1px solid #E2E8F0">
      <div class="stat-label">Dépenses</div>
      <div class="stat-value" style="color:#DC2626">−${fmt(report.summary.total_expenses)}</div>
    </div>
    <div style="padding:16px 20px">
      <div class="stat-label">Net final</div>
      <div class="stat-value;font-size:22px" style="font-size:22px;font-weight:800;color:${report.summary.net_total >= 0 ? "#059669" : "#DC2626"}">${fmt(report.summary.net_total)}</div>
    </div>
  </div>
</div>

<!-- Pied de page -->
<div style="margin-top:24px;padding-top:10px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;display:flex;justify-content:space-between">
  <span>ShopM — Gestion commerciale</span>
  <span>Imprimé le ${new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}</span>
</div>

</body>
</html>`;
}

// ── Page principale ───────────────────────────────────────────────
export default function DailyReportPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  const [report, setReport]           = useState<DailyReport | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") ?? today);

  const handlePrint = () => {
    if (!report) return;
    const shopName = user?.shop_name ?? "Toutes boutiques";
    const html = buildPrintHTML(report, shopName, selectedDate);
    // Blob URL → le browser n'affiche pas de titre ni d'URL dans les marges
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const w    = window.open(url, "_blank");
    if (!w) return;
    w.onload = () => {
      w.print();
      URL.revokeObjectURL(url);
    };
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/sales/daily_report/?date=${selectedDate}`);
      setReport(res.data);
    } catch {
      setError("Erreur lors du chargement du rapport.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [selectedDate]);

  return (
    <div id="print-report">
      <PageHeader
        title="Rapport journalier"
        subtitle={`${user?.shop_name ?? "Toutes boutiques"} · ${formatDate(selectedDate)}`}
        action={
          <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 9,
                fontSize: 13.5, color: "#374151", outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={handlePrint}
              disabled={!report || loading}
              style={{
                padding: "8px 16px", borderRadius: 9, border: "none",
                background: report && !loading ? "linear-gradient(135deg, #1D4ED8, #3B82F6)" : "#E2E8F0",
                cursor: report && !loading ? "pointer" : "not-allowed",
                fontSize: 13, fontFamily: "inherit",
                color: report && !loading ? "#fff" : "#94A3B8",
                fontWeight: 600,
              }}>
              Imprimer
            </button>
          </div>
        }
      />

      {error && (
        <div style={{
          border: "1px solid #BFDBFE", color: "#1D4ED8",
          borderRadius: 10, padding: "12px 16px", fontSize: 13.5, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Stats principales — max 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard label="Ventes totales"   value={report?.summary.total_sales ?? 0}                   icon={<Icon name="cart" size={22} />} color="blue"   loading={loading} />
        <StatCard label="CA total"         value={fmtPrice(report?.summary.total_amount ?? 0)}         icon={<Icon name="money" size={22} />} color="blue"   loading={loading} />
        <StatCard label="Réductions"       value={fmtPrice(report?.summary.total_discount ?? 0)}       icon={<Icon name="tag" size={22} />} color="blue"   loading={loading} />
      </div>

      {report && (
        <>
          {/* ── Encaissements ───────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>

            {/* Total encaissé */}
            <div style={{ border: "1px solid #BFDBFE", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", borderBottom: "1px solid #BFDBFE",
                fontSize: 13, fontWeight: 700, color: "#1D4ED8",
              }}>
                Total encaissé — {fmtPrice(report.summary.total_collected)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "14px 16px", borderRight: "1px solid #EFF6FF" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>Espèces (dont livraisons)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.cash_total)}
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>Mobile Money (dont livraisons)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.momo_total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Livraisons en attente */}
            <div style={{ border: "1px solid #FED7AA", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", borderBottom: "1px solid #FED7AA",
                fontSize: 13, fontWeight: 700, color: "#D97706",
              }}>
                Livraisons en attente
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "14px 16px", borderRight: "1px solid #FEF3C7" }}>
                  <div style={{ fontSize: 11.5, color: "#92400E", marginBottom: 4 }}>Colis non payés</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {report.by_livreur.reduce((s, l) => s + safeNum(l.pending_count), 0)}
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#92400E", marginBottom: 4 }}>Montant en attente</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#D97706" }}>
                    {fmtPrice(report.summary.deliveries_pending)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Articles vendus ──────────────────────────────── */}
          <Section title="Articles vendus" icon={<Icon name="package" size={16} color="#1D4ED8" />}>
            {report.products_recap.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>
                Aucune vente enregistrée pour cette date
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Produit", "Prix unitaire", "Qté", "Sous-total", "Réduction", "Total"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "10px 16px",
                          color: "#64748B", fontWeight: 600, fontSize: 11.5,
                          textTransform: "uppercase", letterSpacing: "0.04em",
                          borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.products_recap.map((p, idx) => {
                      const unitPrice = p.total_qty > 0
                        ? Math.round(p.total_subtotal / p.total_qty)
                        : 0;
                      return (
                        <tr key={p.product__id} style={{
                          borderBottom: idx < report.products_recap.length - 1 ? "1px solid #F1F5F9" : "none",
                        }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F172A" }}>
                            {p.product__name}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748B" }}>
                            {fmtPrice(unitPrice)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              border: "1px solid #BFDBFE", color: "#1D4ED8",
                              padding: "2px 10px", borderRadius: 20,
                              fontWeight: 600, fontSize: 13,
                            }}>
                              {p.total_qty} {UNIT_LABELS_PRINT[p.product__unit] ?? p.product__unit}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748B" }}>
                            {fmtPrice(p.total_subtotal)}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#374151" }}>
                            {p.total_discount > 0 ? `−${fmtPrice(p.total_discount)}` : <span style={{ color: "#CBD5E1" }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>
                            {fmtPrice(p.total_amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#374151" }}>TOTAL</td>
                      <td style={{ padding: "12px 16px" }} />
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: "#1D4ED8", color: "#fff",
                          padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                        }}>
                          {report.products_recap.reduce((s, p) => s + p.total_qty, 0)} unités
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#64748B" }}>
                        {fmtPrice(report.products_recap.reduce((s, p) => s + Number(p.total_subtotal), 0))}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#374151" }}>
                        −{fmtPrice(report.products_recap.reduce((s, p) => s + Number(p.total_discount), 0))}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0F172A", fontSize: 14 }}>
                        {fmtPrice(report.products_recap.reduce((s, p) => s + Number(p.total_amount), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>

          {/* ── Livraisons en attente ────────────────────────── */}
          {report.by_livreur.length > 0 && (
            <Section title="Livraisons en attente de paiement" icon={<Icon name="delivery" size={16} color="#D97706" />}>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {report.by_livreur.map(l => (
                  <div key={l.livreur_id} style={{
                    border: "1px solid #FED7AA", borderRadius: 10,
                    padding: "12px 16px", background: "#FFFBEB",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#FEF3C7", border: "2px solid #FCD34D",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#D97706", fontSize: 12, fontWeight: 700,
                      }}>
                        {l.livreur_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{l.livreur_name}</div>
                        <div style={{ fontSize: 11.5, color: "#92400E" }}>
                          {l.pending_count} colis non payé{l.pending_count > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#92400E", marginBottom: 2 }}>Montant dû</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#D97706" }}>{fmtPrice(l.pending_amount)}</div>
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div style={{
                  borderTop: "1px solid #FED7AA", paddingTop: 10,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                    Total en attente — {report.by_livreur.reduce((s, l) => s + safeNum(l.pending_count), 0)} colis
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#D97706" }}>
                    {fmtPrice(report.by_livreur.reduce((s, l) => s + safeNum(l.pending_amount), 0))}
                  </span>
                </div>
              </div>
            </Section>
          )}

          {/* ── Dépenses ─────────────────────────────────────── */}
          <Section title="Dépenses" icon={<Icon name="expense" size={16} color="#1D4ED8" />}>
            {report.expenses.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>
                Aucune dépense enregistrée
              </div>
            ) : (
              <>
                {report.expenses.map((exp, idx) => (
                  <div key={exp.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom: idx < report.expenses.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: "#0F172A", fontSize: 13.5 }}>{exp.label}</div>
                      <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                        {exp.created_by_name ?? "—"} · {formatDateTime(exp.created_at)}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>
                      −{fmtPrice(exp.amount)}
                    </span>
                  </div>
                ))}
                <div style={{
                  padding: "12px 18px", borderTop: "1px solid #E2E8F0",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontWeight: 700, color: "#374151" }}>Total dépenses</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                    −{fmtPrice(report.summary.total_expenses)}
                  </span>
                </div>
              </>
            )}
          </Section>

          {/* ── Bilan net ─────────────────────────────────────── */}
          <div style={{
            border: "1px solid #BFDBFE", borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 18px", borderBottom: "1px solid #BFDBFE",
              fontSize: 13.5, fontWeight: 700, color: "#1D4ED8",
            }}>
              Bilan net · {formatDate(selectedDate)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div style={{ padding: "18px 20px", borderRight: "1px solid #EFF6FF" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>Total encaissé</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                  {fmtPrice(report.summary.total_collected)}
                </div>
              </div>
              <div style={{ padding: "18px 20px", borderRight: "1px solid #EFF6FF" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>Dépenses</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                  −{fmtPrice(report.summary.total_expenses)}
                </div>
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>Net final</div>
                <div style={{
                  fontSize: 22, fontWeight: 800,
                  color: report.summary.net_total >= 0 ? "#1D4ED8" : "#DC2626",
                }}>
                  {fmtPrice(report.summary.net_total)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
