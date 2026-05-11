// src/pages/shared/SalesListPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Badge, DataTable, StatCard, Icon, DateInput } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import axiosInstance from "../../api/axiosInstance";

// ── Types ────────────────────────────────────────────────────────
interface SaleItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
}

interface Sale {
  id: number;
  reference: string;
  shop_name: string;
  cashier_name: string | null;
  sale_type: string;
  sale_type_label: string;
  payment_method: string;
  payment_label: string;
  payment_status: "paid" | "pending";
  livreur: number | null;
  livreur_name: string | null;
  total_amount: string;
  total_discount: string;
  status: "completed" | "cancelled";
  items_count: number;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────

const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

// ── Modal détail vente ────────────────────────────────────────────
function SaleDetailModal({ saleId, onClose, onRefresh }: {
  saleId: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance.get(`/sales/${saleId}/`)
      .then(res => setSale(res.data))
      .catch(() => setError("Erreur chargement"))
      .finally(() => setLoading(false));
  }, [saleId]);

  const handleCancel = async () => {
    if (!confirm("Annuler cette vente ? Le stock sera remis en place.")) return;
    setCancelling(true);
    try {
      await axiosInstance.post(`/sales/${saleId}/cancel/`);
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Erreur lors de l'annulation.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          background: sale?.status === "cancelled"
            ? "linear-gradient(135deg, #475569, #64748B)"
            : "linear-gradient(135deg, #0F172A, #1E293B)",
          padding: "20px 24px",
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Vente {sale?.sale_type_label}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#60A5FA", marginBottom: 4 }}>
                {sale?.reference ?? "..."}
              </div>
              {!loading && sale && (
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {fmtPrice(sale.total_amount)}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
              color: "#fff", fontSize: 18, width: 32, height: 32, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: 9, padding: "10px 14px",
              fontSize: 13, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 14, background: "#F1F5F9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : sale && (
            <>
              {/* Infos générales */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Caissier", value: sale.cashier_name ?? "—" },
                  { label: "Date", value: formatDateTime(sale.created_at) },
                  { label: "Paiement", value: sale.payment_label },
                  { label: "Statut paiement", value: sale.payment_status === "paid" ? <span style={{display:"flex",alignItems:"center",gap:4}}><Icon name="checkCircle" size={13} color="#15803D" /> Payé</span> : <span style={{display:"flex",alignItems:"center",gap:4}}><Icon name="clock" size={13} color="#C2410C" /> En attente</span> },
                  ...(sale.livreur_name ? [{ label: "Livreur", value: sale.livreur_name }] : []),
                  ...(sale.delivery_address ? [{ label: "Adresse", value: sale.delivery_address }] : []),
                ].map(row => (
                  <div key={row.label} style={{
                    background: "#F8FAFC", borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2, fontWeight: 500 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Articles */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Articles
              </div>
              {sale.items?.map((item: SaleItem) => (
                <div key={item.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid #F1F5F9",
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>{item.product_name}</div>
                    <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                      {fmtPrice(item.unit_price)} × {item.quantity}
                      {item.discount_amount > 0 && (
                        <span style={{ color: "#F97316", marginLeft: 6 }}>
                          −{fmtPrice(item.discount_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#374151" }}>
                    {fmtPrice(item.total_price)}
                  </div>
                </div>
              ))}

              {/* Totaux */}
              {Number(sale.total_discount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: "#F97316" }}>Réductions totales</span>
                  <span style={{ fontWeight: 600, color: "#F97316" }}>−{fmtPrice(sale.total_discount)}</span>
                </div>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "10px 0",
                borderTop: "2px solid #E2E8F0", marginTop: 4,
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#059669" }}>
                  {fmtPrice(sale.total_amount)}
                </span>
              </div>

              {sale.notes && (
                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: "#F8FAFC", borderRadius: 9, fontSize: 13, color: "#64748B",
                }}>
                  <Icon name="info" size={13} color="#94A3B8" style={{ marginRight: 5 }} />{sale.notes}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 9, border: "1px solid #E2E8F0",
            background: "#fff", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
          }}>
            Fermer
          </button>
          {sale && sale.status === "completed" && (
            <button onClick={handleCancel} disabled={cancelling}
              style={{
                padding: "9px 20px", borderRadius: 9, border: "none",
                background: cancelling ? "#94A3B8" : "#FEF2F2",
                color: cancelling ? "#fff" : "#DC2626", cursor: cancelling ? "not-allowed" : "pointer",
                fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
                border: "1px solid #FECACA",
              }}>
              {cancelling ? "Annulation..." : "Annuler la vente"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page liste des ventes ─────────────────────────────────────────
export default function SalesListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "cancelled">("all");
  const [filterType, setFilterType] = useState<"all" | "direct" | "delivery">("all");
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") ?? today);
  const [detailSale, setDetailSale] = useState<number | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/sales/?date=${selectedDate}`);
      setSales(res.data.results ?? res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, [selectedDate]);

  const completed = sales.filter(s => s.status === "completed");
  const cancelled = sales.filter(s => s.status === "cancelled");
  const totalCA = completed.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const pending = sales.filter(s => s.payment_status === "pending").length;

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      s.reference.toLowerCase().includes(q) ||
      (s.cashier_name ?? "").toLowerCase().includes(q) ||
      (s.livreur_name ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchType = filterType === "all" || s.sale_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const columns = [
    {
      key: "reference", label: "Réf.",
      render: (row: Sale) => (
        <span style={{
          fontFamily: "monospace", fontWeight: 700, fontSize: 12,
          color: "#1D4ED8",
        }}>
          {row.reference}
        </span>
      ),
    },
    {
      key: "type", label: "Type",
      render: (row: Sale) => (
        <Badge
          label={row.sale_type === "delivery" ? "Livraison" : "Direct"}
          color={row.sale_type === "delivery" ? "blue" : "green"}
        />
      ),
    },
    {
      key: "cashier_name", label: "Caissier",
      render: (row: Sale) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>{row.cashier_name ?? "—"}</span>
      ),
    },
    {
      key: "payment", label: "Paiement",
      render: (row: Sale) => (
        <div>
          <div style={{ fontSize: 12.5, color: "#374151" }}>{row.payment_label}</div>
          <Badge
            label={row.payment_status === "paid" ? "Payé" : "En attente"}
            color={row.payment_status === "paid" ? "green" : "yellow"}
          />
        </div>
      ),
    },
    {
      key: "total_amount", label: "Total",
      render: (row: Sale) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
          {fmtPrice(row.total_amount)}
        </span>
      ),
    },
    {
      key: "status", label: "Statut",
      render: (row: Sale) => (
        <Badge
          label={row.status === "completed" ? "✓ Complétée" : "✕ Annulée"}
          color={row.status === "completed" ? "green" : "red"}
        />
      ),
    },
    {
      key: "created_at", label: "Heure",
      render: (row: Sale) => (
        <span style={{ fontSize: 12, color: "#94A3B8" }}>
          {new Date(row.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (row: Sale) => (
        <button onClick={() => setDetailSale(row.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#3B82F6", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
          }}>
          Voir →
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ventes"
        subtitle={`Historique des ventes`}
        action={
          <DateInput value={selectedDate} onChange={setSelectedDate} max={today} />
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Ventes" value={completed.length} icon={<Icon name="checkCircle" size={22} />} color="green" loading={loading} />
        <StatCard label="CA du jour" value={fmtPrice(totalCA)} icon={<Icon name="money" size={22} />} color="blue" loading={loading} />
        <StatCard label="Non payées" value={pending} icon={<Icon name="clock" size={22} />} color="orange" loading={loading} />
        <StatCard label="Annulées" value={cancelled.length} icon={<Icon name="xCircle" size={22} />} color="red" loading={loading} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Toutes", group: "status" },
          { key: "completed", label: "Complétées", group: "status" },
          { key: "cancelled", label: "Annulées", group: "status" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key as any)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterStatus === f.key ? 600 : 400,
              background: filterStatus === f.key ? "#0F172A" : "#fff",
              color: filterStatus === f.key ? "#fff" : "#64748B",
              border: filterStatus === f.key ? "none" : "1px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {f.label}
          </button>
        ))}
        <div style={{ width: 1, background: "#E2E8F0", margin: "0 4px" }} />
        {[
          { key: "all", label: "Tous types" },
          { key: "direct", label: "Direct" },
          { key: "delivery", label: "Livraison" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key as any)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterType === f.key ? 600 : 400,
              background: filterType === f.key ? "#3B82F6" : "#fff",
              color: filterType === f.key ? "#fff" : "#64748B",
              border: filterType === f.key ? "none" : "1px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucune vente pour cette date"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Référence, caissier, livreur..."
        onRowClick={(row: any) => setDetailSale(row.id)}
      />

      {detailSale !== null && (
        <SaleDetailModal
          saleId={detailSale}
          onClose={() => setDetailSale(null)}
          onRefresh={fetchSales}
        />
      )}
    </div>
  );
}
