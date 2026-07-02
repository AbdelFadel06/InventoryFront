import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge, PageHeader, StatCard, Icon, DateInput } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import api from "../../api/axiosInstance";

// ── Types ────────────────────────────────────────────────────────
interface SaleItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: number;
  reference: string;
  shop: number;
  shop_name: string;
  payment_method: string;
  payment_status: "paid" | "pending";
  payment_label: string;
  delivery_address: string | null;
  client_phone: string | null;
  delivered_at: string | null;
  total_amount: string;
  status: "completed" | "cancelled";
  items: SaleItem[];
  items_count: number;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

function wasModified(sale: Sale) {
  const diff = new Date(sale.updated_at).getTime() - new Date(sale.created_at).getTime();
  return diff > 60_000;
}

function getDeliveryState(sale: Sale): "transit" | "collected" | "paid" | "cancelled" {
  if (sale.status === "cancelled") return "cancelled";
  if (sale.payment_status === "paid") return "paid";
  if (sale.delivered_at) return "collected";
  return "transit";
}

// ── Delivery card ─────────────────────────────────────────────────
function DeliveryCard({ sale, onConfirm, confirming }: {
  sale: Sale;
  onConfirm: (id: number) => void;
  confirming: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = getDeliveryState(sale);
  const modified = wasModified(sale);

  const borderColor = {
    transit: "#BFDBFE",
    collected: "#FDE68A",
    paid: "#BBF7D0",
    cancelled: "#FCA5A5",
  }[state];

  const bgColor = {
    transit: "#fff",
    collected: "#FFFBEB",
    paid: "#F0FDF4",
    cancelled: "#FFF5F5",
  }[state];

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${borderColor}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      opacity: state === "cancelled" ? 0.75 : 1,
    }}>
      <div style={{ padding: "14px 16px", background: bgColor, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          {/* Référence + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 5 }}>
              {sale.reference}
            </span>
            {state === "cancelled" && <Badge label="Annulée" color="red" />}
            {state === "paid" && <Badge label="Payé ✓" color="green" />}
            {state === "collected" && <Badge label="Collecté — en attente" color="yellow" />}
            {state === "transit" && <Badge label="En transit" color="blue" />}
            {modified && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED", background: "#F5F3FF", padding: "2px 7px", borderRadius: 10 }}>
                Modifié
              </span>
            )}
          </div>

          {/* Adresse */}
          {sale.delivery_address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
              <span style={{ flexShrink: 0 }}><Icon name="delivery" size={14} color="#374151" /></span>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{sale.delivery_address}</span>
            </div>
          )}

          <div style={{ fontSize: 20, fontWeight: 800, color: state === "cancelled" ? "#94A3B8" : "#0F172A" }}>
            {fmtPrice(sale.total_amount)}
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
            {sale.items_count} article(s) · {sale.payment_label} · {formatDateTime(sale.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {/* On_delivery : livreur confirme la collecte */}
          {state === "transit" && sale.payment_method === "on_delivery" && (
            <button
              onClick={() => onConfirm(sale.id)}
              disabled={confirming === sale.id}
              style={{
                padding: "8px 14px", borderRadius: 9, border: "none",
                background: confirming === sale.id ? "#94A3B8" : "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#fff", cursor: confirming === sale.id ? "not-allowed" : "pointer",
                fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >{confirming === sale.id ? "..." : "Confirmer collecte"}</button>
          )}
          {state === "collected" && (
            <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600, textAlign: "right" }}>
              En attente de<br />validation boutique
            </div>
          )}
          {state === "paid" && (
            <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              Validé <Icon name="check" size={12} color="#059669" />
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 12, fontFamily: "inherit" }}
          >{expanded ? "Masquer ▲" : "Détails ▼"}</button>
        </div>
      </div>

      {/* Détail articles */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Articles
          </div>
          {sale.items.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #F8FAFC" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{item.product_name}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{fmtPrice(item.unit_price)} × {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#374151" }}>{fmtPrice(item.total_price)}</div>
            </div>
          ))}
          {sale.notes && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 13, color: "#64748B", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Icon name="info" size={14} color="#64748B" />
              {sale.notes}
            </div>
          )}
          {modified && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#F5F3FF", borderRadius: 8, fontSize: 12.5, color: "#6D28D9", display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠</span> Cette livraison a été modifiée par la boutique.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page livreur ──────────────────────────────────────────────────
export default function DeliveryDriverPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [deliveries, setDeliveries] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("pending");
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeShopTab, setActiveShopTab] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sales/livreur_point/?date=${selectedDate}`);
      const delivs: Sale[] = res.data.deliveries ?? [];
      setDeliveries(delivs);
      if (delivs.length > 0) {
        const shopNames = [...new Set(delivs.map(d => d.shop_name))];
        setActiveShopTab(prev => prev && shopNames.includes(prev) ? prev : shopNames[0]);
      }
    } catch {
      setError("Erreur lors du chargement des livraisons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, [selectedDate]);

  const handleConfirm = async (id: number) => {
    setConfirming(id);
    try {
      await api.post(`/sales/${id}/mark_delivered/`);
      await fetchDeliveries();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Erreur lors de la confirmation.");
    } finally {
      setConfirming(null);
    }
  };

  const shopNames = [...new Set(deliveries.map(d => d.shop_name))];
  const multiShop = shopNames.length > 1;
  const byTab = activeShopTab ? deliveries.filter(d => d.shop_name === activeShopTab) : deliveries;

  const filtered = byTab.filter(d => {
    if (filterStatus === "paid") return d.payment_status === "paid";
    if (filterStatus === "pending") return d.payment_status === "pending";
    return true;
  });

  const tabPending = byTab.filter(d => d.payment_status === "pending" && d.status !== "cancelled");
  const tabPaid = byTab.filter(d => d.payment_status === "paid");
  const tabCollected = byTab.filter(d => d.payment_status === "pending" && d.delivered_at && d.status !== "cancelled");

  return (
    <div>
      <PageHeader
        title="Mes livraisons"
        subtitle={`${user?.first_name} ${user?.last_name}`}
        action={<DateInput value={selectedDate} onChange={setSelectedDate} />}
      />

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Boutique tabs */}
      {!loading && multiShop && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
          {shopNames.map(shop => (
            <button key={shop} onClick={() => setActiveShopTab(shop)} style={{
              padding: "8px 18px", borderRadius: 20, border: "none",
              background: activeShopTab === shop ? "#0F172A" : "#F1F5F9",
              color: activeShopTab === shop ? "#fff" : "#374151",
              fontWeight: activeShopTab === shop ? 700 : 500,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}>{shop}</button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="En transit" value={tabPending.filter(d => !d.delivered_at).length} icon={<Icon name="delivery" size={20} />} color="blue" loading={loading} />
        <StatCard label="Collectés" value={tabCollected.length} icon={<Icon name="clock" size={20} />} color="orange" loading={loading}
          sub={tabCollected.length > 0 ? fmtPrice(tabCollected.reduce((s, d) => s + Number(d.total_amount), 0)) : undefined} />
        <StatCard label="Validés" value={tabPaid.length} icon={<Icon name="checkCircle" size={20} />} color="green" loading={loading}
          sub={tabPaid.length > 0 ? fmtPrice(tabPaid.reduce((s, d) => s + Number(d.total_amount), 0)) : undefined} />
      </div>

      {/* Alerte collectés en attente */}
      {!loading && tabCollected.length > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="warning" size={18} color="#92400E" />
          <div style={{ fontSize: 13, color: "#92400E" }}>
            <strong>{tabCollected.length}</strong> livraison(s) collectée(s) en attente de validation par la boutique.
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: `Toutes (${byTab.length})` },
          { key: "pending", label: `Non validées (${tabPending.length})` },
          { key: "paid", label: `Validées (${tabPaid.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key as any)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
            fontWeight: filterStatus === f.key ? 600 : 400,
            background: filterStatus === f.key ? "#0F172A" : "#fff",
            color: filterStatus === f.key ? "#fff" : "#64748B",
            border: filterStatus === f.key ? "none" : "1px solid #E2E8F0",
            cursor: "pointer", fontFamily: "inherit",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 100, background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0", animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #E2E8F0", borderRadius: 14, padding: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 12 }}><Icon name="package" size={40} color="#94A3B8" /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Aucune livraison pour cette date</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Changez la date ou le filtre</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(sale => (
            <DeliveryCard key={sale.id} sale={sale} onConfirm={handleConfirm} confirming={confirming} />
          ))}
        </div>
      )}

      {/* Récap */}
      {!loading && byTab.length > 0 && (
        <div style={{ marginTop: 24, background: "#0F172A", borderRadius: 14, padding: "18px 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Récap {multiShop && activeShopTab ? `— ${activeShopTab}` : "journée"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Collecté", value: fmtPrice(tabCollected.reduce((s, d) => s + Number(d.total_amount), 0)), color: "#F59E0B" },
              { label: "Validé", value: fmtPrice(tabPaid.reduce((s, d) => s + Number(d.total_amount), 0)), color: "#22C55E" },
              { label: "Total", value: fmtPrice(byTab.filter(d => d.status !== "cancelled").reduce((s, d) => s + Number(d.total_amount), 0)), color: "#60A5FA" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
