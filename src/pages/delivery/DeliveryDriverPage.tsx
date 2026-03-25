// src/pages/delivery/DeliveryDriverPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge, PageHeader, StatCard, Icon } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

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
  shop_name: string;
  sale_type: string;
  payment_method: string;
  payment_status: "paid" | "pending";
  payment_label: string;
  delivery_address: string | null;
  delivered_at: string | null;
  total_amount: string;
  total_discount: string;
  status: "completed" | "cancelled";
  items: SaleItem[];
  items_count: number;
  created_at: string;
  notes: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────
const apiFetch = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`/api${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.status === 204 ? null : res.json();
};

const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

// ── Carte livraison ───────────────────────────────────────────────
function DeliveryCard({ sale, onConfirm, confirming }: {
  sale: Sale;
  onConfirm: (id: number) => void;
  confirming: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPaid = sale.payment_status === "paid";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${isPaid ? "#BBF7D0" : "#E2E8F0"}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        background: isPaid ? "#F0FDF4" : "#fff",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontFamily: "monospace", fontWeight: 700, fontSize: 12,
              color: "#1D4ED8", background: "#EFF6FF",
              padding: "2px 8px", borderRadius: 5,
            }}>
              {sale.reference}
            </span>
            <Badge
              label={isPaid ? "Payé" : "Non payé"}
              color={isPaid ? "green" : "yellow"}
            />
          </div>

          {/* Adresse */}
          {sale.delivery_address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
              <span style={{ flexShrink: 0 }}><Icon name="delivery" size={14} color="#374151" /></span>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                {sale.delivery_address}
              </span>
            </div>
          )}

          {/* Montant */}
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
            {fmtPrice(sale.total_amount)}
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
            {sale.items_count} article(s) · {sale.payment_label}
            {" · "}{formatDateTime(sale.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {!isPaid && sale.status === "completed" && (
            <button
              onClick={() => onConfirm(sale.id)}
              disabled={confirming === sale.id}
              style={{
                padding: "8px 14px", borderRadius: 9, border: "none",
                background: confirming === sale.id ? "#94A3B8" : "linear-gradient(135deg, #10B981, #059669)",
                color: "#fff", cursor: confirming === sale.id ? "not-allowed" : "pointer",
                fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
                boxShadow: confirming === sale.id ? "none" : "0 2px 8px rgba(16,185,129,0.3)",
                whiteSpace: "nowrap",
              }}>
              {confirming === sale.id ? "..." : "Confirmer paiement"}
            </button>
          )}
          {isPaid && (
            <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              Livré <Icon name="check" size={12} color="#059669" />
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94A3B8", fontSize: 12, fontFamily: "inherit",
            }}>
            {expanded ? "Masquer ▲" : "Détails ▼"}
          </button>
        </div>
      </div>

      {/* Détail articles */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Articles
          </div>
          {sale.items.map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: "1px solid #F8FAFC",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{item.product_name}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                  {fmtPrice(item.unit_price)} × {item.quantity}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "#374151" }}>
                {fmtPrice(item.total_price)}
              </div>
            </div>
          ))}
          {sale.notes && (
            <div style={{
              marginTop: 10, padding: "8px 12px", background: "#F8FAFC",
              borderRadius: 8, fontSize: 13, color: "#64748B",
              display: "flex", alignItems: "flex-start", gap: 6,
            }}>
              <Icon name="info" size={14} color="#64748B" />
              {sale.notes}
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
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");
  const [selectedDate, setSelectedDate] = useState(today);
  const [summary, setSummary] = useState<any>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/sales/livreur_point/?date=${selectedDate}`);
      setDeliveries(res.deliveries ?? []);
      setSummary(res);
    } catch (e) {
      setError("Erreur lors du chargement des livraisons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeliveries(); }, [selectedDate]);

  const handleConfirm = async (id: number) => {
    setConfirming(id);
    try {
      await apiFetch(`/sales/${id}/mark_delivered/`, { method: "POST" });
      await fetchDeliveries();
    } catch {
      setError("Erreur lors de la confirmation.");
    } finally {
      setConfirming(null);
    }
  };

  const filtered = deliveries.filter(d => {
    if (filterStatus === "paid") return d.payment_status === "paid";
    if (filterStatus === "pending") return d.payment_status === "pending";
    return true;
  });

  const pending = deliveries.filter(d => d.payment_status === "pending");
  const paid = deliveries.filter(d => d.payment_status === "paid");

  return (
    <div>
      <PageHeader
        title="Mes livraisons"
        subtitle={`${user?.first_name} ${user?.last_name} · ${user?.shop_name ?? ""}`}
        action={
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 9,
              fontSize: 13.5, color: "#374151", outline: "none", fontFamily: "inherit",
              background: "#fff",
            }}
          />
        }
      />

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          color: "#DC2626", borderRadius: 10, padding: "12px 16px",
          fontSize: 13.5, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total livraisons"
          value={summary?.total_count ?? 0}
          icon={<Icon name="package" size={22} />}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Payées"
          value={summary?.paid_count ?? 0}
          icon={<Icon name="checkCircle" size={22} />}
          color="green"
          loading={loading}
          sub={summary?.total_paid ? fmtPrice(summary.total_paid) : undefined}
        />
        <StatCard
          label="Non payées"
          value={summary?.pending_count ?? 0}
          icon={<Icon name="clock" size={22} />}
          color="orange"
          loading={loading}
          sub={summary?.total_pending ? fmtPrice(summary.total_pending) : undefined}
        />
      </div>

      {/* Alerte si livraisons en attente */}
      {!loading && pending.length > 0 && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A",
          borderRadius: 12, padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="warning" size={20} color="#92400E" />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#92400E" }}>
              {pending.length} livraison(s) non confirmée(s)
            </div>
            <div style={{ fontSize: 12.5, color: "#B45309", marginTop: 2 }}>
              Montant total en attente : <strong>{fmtPrice(pending.reduce((s, d) => s + Number(d.total_amount), 0))}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: `Toutes (${deliveries.length})` },
          { key: "pending", label: `Non payées (${pending.length})` },
          { key: "paid", label: `Payées (${paid.length})` },
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
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              height: 100, background: "#F8FAFC", borderRadius: 14,
              border: "1px solid #E2E8F0", animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "#fff", border: "2px dashed #E2E8F0",
          borderRadius: 14, padding: 48, textAlign: "center",
        }}>
          <div style={{ marginBottom: 12 }}><Icon name="package" size={40} color="#94A3B8" /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Aucune livraison {filterStatus !== "all" ? `(${filterStatus === "pending" ? "non payée" : "payée"})` : ""} pour cette date
          </div>
          <div style={{ fontSize: 13.5, color: "#94A3B8" }}>
            Changez la date ou le filtre pour voir vos livraisons
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(sale => (
            <DeliveryCard
              key={sale.id}
              sale={sale}
              onConfirm={handleConfirm}
              confirming={confirming}
            />
          ))}
        </div>
      )}

      {/* Récap en bas si livraisons présentes */}
      {!loading && deliveries.length > 0 && (
        <div style={{
          marginTop: 24, background: "#0F172A", borderRadius: 14,
          padding: "18px 22px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Récapitulatif de la journée
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Total collecté", value: fmtPrice(summary?.total_paid ?? 0), color: "#22C55E" },
              { label: "En attente", value: fmtPrice(summary?.total_pending ?? 0), color: "#F59E0B" },
              { label: "Total global", value: fmtPrice(Number(summary?.total_paid ?? 0) + Number(summary?.total_pending ?? 0)), color: "#60A5FA" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
