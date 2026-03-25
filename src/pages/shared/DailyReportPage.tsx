// src/pages/shared/DailyReportPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, StatCard } from "../../components/ui";
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
  total: number;
  paid: number;
  pending: number;
  count: number;
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
    deliveries_paid: number;
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
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

const UNIT_LABELS: Record<string, string> = {
  piece: "pcs", kg: "kg", g: "g", l: "L",
  ml: "ml", m: "m", box: "boîte(s)", pack: "pack(s)",
};

// ── Section wrapper ───────────────────────────────────────────────
const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div style={{
    background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 12, overflow: "hidden", marginBottom: 16,
  }}>
    <div style={{
      padding: "12px 18px", borderBottom: "1px solid #E2E8F0",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{title}</span>
    </div>
    {children}
  </div>
);

// ── Page principale ───────────────────────────────────────────────
export default function DailyReportPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [report, setReport]           = useState<DailyReport | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);

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
    <div>
      <PageHeader
        title="Rapport journalier"
        subtitle={`${user?.shop_name ?? "Toutes boutiques"} · ${formatDate(selectedDate)}`}
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
              onClick={() => window.print()}
              style={{
                padding: "8px 16px", borderRadius: 9, border: "1px solid #E2E8F0",
                background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                color: "#374151",
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
        <StatCard label="Ventes totales"   value={report?.summary.total_sales ?? 0}                   icon="🛒" color="blue"   loading={loading} />
        <StatCard label="CA total"         value={fmtPrice(report?.summary.total_amount ?? 0)}         icon="💰" color="blue"   loading={loading} />
        <StatCard label="Réductions"       value={fmtPrice(report?.summary.total_discount ?? 0)}       icon="🏷️" color="blue"   loading={loading} />
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
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>Espèces</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.cash_total)}
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>Mobile Money</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.momo_total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Livraisons */}
            <div style={{ border: "1px solid #BFDBFE", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", borderBottom: "1px solid #BFDBFE",
                fontSize: 13, fontWeight: 700, color: "#1D4ED8",
              }}>
                Livraisons — {report.by_livreur.reduce((s, l) => s + l.count, 0)} commande(s)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "14px 16px", borderRight: "1px solid #EFF6FF" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>Payées</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.deliveries_paid)}
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>En attente</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {fmtPrice(report.summary.deliveries_pending)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Articles vendus ──────────────────────────────── */}
          <Section title="Articles vendus" icon="📦">
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
                              {p.total_qty} {UNIT_LABELS[p.product__unit] ?? p.product__unit}
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

          {/* ── Point livreurs ───────────────────────────────── */}
          {report.by_livreur.length > 0 && (
            <Section title="Point des livreurs" icon="🛵">
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {report.by_livreur.map(l => (
                  <div key={l.livreur_id} style={{
                    border: "1px solid #E2E8F0", borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        border: "2px solid #BFDBFE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#1D4ED8", fontSize: 12, fontWeight: 700,
                      }}>
                        {l.livreur_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{l.livreur_name}</div>
                        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{l.count} livraison(s)</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Payé</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{fmtPrice(l.paid)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>En attente</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{fmtPrice(l.pending)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Total</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1D4ED8" }}>{fmtPrice(l.total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Dépenses ─────────────────────────────────────── */}
          <Section title="Dépenses" icon="💸">
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
