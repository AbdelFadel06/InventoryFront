import { useEffect, useRef, useState } from "react";
import { PageHeader, Badge, Icon, DateInput } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import api from "../../api/axiosInstance";

// ── Types ────────────────────────────────────────────────────────
interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface DeliveryRow {
  id: number;
  reference: string;
  shop: number;
  shop_name: string;
  livreur: number | null;
  livreur_name: string | null;
  payment_method: string;
  payment_label: string;
  payment_status: "paid" | "pending";
  delivery_address: string | null;
  client_phone: string | null;
  delivered_at: string | null;
  total_amount: string;
  status: "completed" | "cancelled";
  items_count: number;
  created_at: string;
  updated_at: string;
}

interface FullSale extends DeliveryRow {
  items: SaleItem[];
  notes: string | null;
}

interface ModifyItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface ProductResult {
  id: number;
  name: string;
  selling_price: number;
  unit: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

function deliveryState(d: DeliveryRow): "transit" | "collected" | "paid" | "cancelled" {
  if (d.status === "cancelled") return "cancelled";
  if (d.payment_status === "paid") return "paid";
  if (d.delivered_at) return "collected";
  return "transit";
}

// ── ModifyModal ───────────────────────────────────────────────────
function ModifyModal({ sale, onClose, onSaved }: {
  sale: FullSale;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<ModifyItem[]>(
    sale.items.map(i => ({
      product_id: i.product,
      product_name: i.product_name,
      unit_price: i.unit_price,
      quantity: i.quantity,
    }))
  );
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    setSearch(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(
          `/products/?search=${encodeURIComponent(q)}&is_active=true`,
          { headers: { "X-Active-Shop": String(sale.shop) } }
        );
        const data: ProductResult[] = res.data.results ?? res.data ?? [];
        const addedIds = new Set(items.map(i => i.product_id));
        setResults(data.filter(p => !addedIds.has(p.id)).slice(0, 6));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const addProduct = (p: ProductResult) => {
    setItems(prev => [...prev, { product_id: p.id, product_name: p.name, unit_price: p.selling_price, quantity: 1 }]);
    setSearch(""); setResults([]);
  };

  const setQty = (idx: number, qty: number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, qty) } : it));

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (items.length === 0) { setError("Au moins un article est requis."); return; }
    setSubmitting(true); setError(null);
    try {
      await api.post(`/sales/${sale.id}/modify_items/`, {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
      });
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Erreur lors de la modification.");
    } finally { setSubmitting(false); }
  };

  const newTotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Modifier la livraison</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{sale.reference} · {sale.livreur_name ?? "—"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#94A3B8", lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Articles */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Articles ({items.length})
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "16px 0", fontSize: 13 }}>Aucun article.</div>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.product_id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{fmtPrice(item.unit_price)} × {item.quantity} = <strong>{fmtPrice(item.unit_price * item.quantity)}</strong></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => setQty(idx, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 28, textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => setQty(idx, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <button onClick={() => removeItem(idx)} style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, cursor: "pointer", color: "#EF4444", fontSize: 16, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
              </div>
            ))
          )}
        </div>

        {/* Recherche produit */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Ajouter un article</div>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            {(results.length > 0 || (searching && search.trim())) && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 20, overflow: "hidden" }}>
                {searching ? (
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "#94A3B8" }}>Recherche...</div>
                ) : results.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #F8FAFC", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ fontWeight: 500, color: "#0F172A" }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{fmtPrice(p.selling_price)} · {p.unit}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "2px solid #F1F5F9", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Nouveau total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{fmtPrice(newTotal)}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
            Fermer
          </button>
          <button onClick={submit} disabled={submitting || items.length === 0}
            style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: submitting || items.length === 0 ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", cursor: submitting || items.length === 0 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}
          >{submitting ? "Modification en cours..." : "Valider les modifications"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Carte livraison (manager) ─────────────────────────────────────
function DeliveryCard({ delivery, onModify, onCancel, onValidate, loading }: {
  delivery: DeliveryRow;
  onModify: (id: number) => void;
  onCancel: (id: number) => void;
  onValidate: (id: number) => void;
  loading: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const state = deliveryState(delivery);
  const isLoading = loading === delivery.id;

  const stateConfig = {
    transit: { label: "En transit", color: "blue" as const, bg: "#EFF6FF", border: "#BFDBFE" },
    collected: { label: "Collecté", color: "yellow" as const, bg: "#FFFBEB", border: "#FDE68A" },
    paid: { label: "Payé", color: "green" as const, bg: "#F0FDF4", border: "#BBF7D0" },
    cancelled: { label: "Annulée", color: "red" as const, bg: "#FFF5F5", border: "#FCA5A5" },
  }[state];

  return (
    <div style={{ background: "#fff", border: `1px solid ${stateConfig.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: state === "cancelled" ? 0.7 : 1 }}>
      <div style={{ padding: "14px 16px", background: stateConfig.bg, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Référence + état */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 5 }}>{delivery.reference}</span>
            <Badge label={stateConfig.label} color={stateConfig.color} />
          </div>

          {/* Livreur */}
          {delivery.livreur_name && (
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 4 }}>
              <span style={{ color: "#94A3B8" }}>Livreur : </span>
              <strong>{delivery.livreur_name}</strong>
            </div>
          )}

          {/* Adresse */}
          {delivery.delivery_address && (
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ color: "#94A3B8" }}>→ </span>{delivery.delivery_address}
            </div>
          )}

          <div style={{ fontSize: 18, fontWeight: 800, color: state === "cancelled" ? "#94A3B8" : "#0F172A" }}>{fmtPrice(delivery.total_amount)}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
            {delivery.items_count} art. · {delivery.payment_label}
            {delivery.delivered_at && ` · Collecté ${formatDateTime(delivery.delivered_at)}`}
            {" · "}{formatDateTime(delivery.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          {/* Valider paiement — seulement si on_delivery + collecté */}
          {state === "collected" && delivery.payment_method === "on_delivery" && (
            <button
              onClick={() => onValidate(delivery.id)}
              disabled={isLoading}
              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: isLoading ? "#94A3B8" : "linear-gradient(135deg, #10B981, #059669)", color: "#fff", cursor: isLoading ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}
            >{isLoading ? "..." : "Valider paiement"}</button>
          )}

          {state !== "cancelled" && (
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => onModify(delivery.id)} disabled={isLoading}
                style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                Modifier
              </button>
              {cancelConfirm ? (
                <>
                  <button onClick={() => { setCancelConfirm(false); onCancel(delivery.id); }} disabled={isLoading}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                    {isLoading ? "..." : "Confirmer"}
                  </button>
                  <button onClick={() => setCancelConfirm(false)}
                    style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                    Non
                  </button>
                </>
              ) : (
                <button onClick={() => setCancelConfirm(true)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #FECACA", background: "#FFF5F5", color: "#EF4444", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                  Annuler
                </button>
              )}
            </div>
          )}

          <button onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 12, fontFamily: "inherit" }}>
            {expanded ? "Masquer ▲" : "Détails ▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "10px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {delivery.items_count} article(s)
          </div>
          {delivery.client_phone && (
            <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 4 }}>
              <span style={{ color: "#94A3B8" }}>Client : </span>{delivery.client_phone}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Cliquez sur "Modifier" pour voir et éditer les articles.</div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────
export default function DeliveryManagementPage() {
  const today = new Date().toISOString().split("T")[0];

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterState, setFilterState] = useState<"all" | "transit" | "collected" | "paid">("all");
  const [modifyingSale, setModifyingSale] = useState<FullSale | null>(null);
  const [loadingModify, setLoadingModify] = useState<number | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/sales/", { params: { sale_type: "delivery", date: selectedDate } });
      setDeliveries((res.data.results ?? res.data) as DeliveryRow[]);
    } catch { setError("Erreur lors du chargement."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeliveries(); }, [selectedDate]);

  const openModify = async (id: number) => {
    setLoadingModify(id);
    try {
      const res = await api.get(`/sales/${id}/`);
      setModifyingSale(res.data as FullSale);
    } catch { setError("Impossible de charger la livraison."); }
    finally { setLoadingModify(null); }
  };

  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/sales/${id}/cancel/`);
      await fetchDeliveries();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Erreur lors de l'annulation.");
    } finally { setActionLoading(null); }
  };

  const handleValidate = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/sales/${id}/validate_payment/`);
      await fetchDeliveries();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Erreur lors de la validation.");
    } finally { setActionLoading(null); }
  };

  const handleModifySaved = async () => {
    setModifyingSale(null);
    await fetchDeliveries();
  };

  const filtered = deliveries.filter(d => {
    if (filterState === "all") return true;
    return deliveryState(d) === filterState;
  });

  const counts = {
    all: deliveries.length,
    transit: deliveries.filter(d => deliveryState(d) === "transit").length,
    collected: deliveries.filter(d => deliveryState(d) === "collected").length,
    paid: deliveries.filter(d => deliveryState(d) === "paid").length,
  };

  const totalCollected = deliveries.filter(d => deliveryState(d) === "collected").reduce((s, d) => s + Number(d.total_amount), 0);
  const totalPaid = deliveries.filter(d => deliveryState(d) === "paid").reduce((s, d) => s + Number(d.total_amount), 0);

  return (
    <div>
      <PageHeader
        title="Gestion des livraisons"
        subtitle="Modifier, annuler et valider les paiements"
        action={<DateInput value={selectedDate} onChange={setSelectedDate} />}
      />

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, marginBottom: 20 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Alertes collecte en attente */}
      {!loading && counts.collected > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="warning" size={18} color="#92400E" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#92400E" }}>
                {counts.collected} livraison(s) collectée(s) en attente de validation
              </div>
              <div style={{ fontSize: 12.5, color: "#B45309" }}>Montant : {fmtPrice(totalCollected)}</div>
            </div>
          </div>
          <button onClick={() => setFilterState("collected")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>
            Voir
          </button>
        </div>
      )}

      {/* Filtres par statut */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
        {([
          { key: "all", label: `Toutes (${counts.all})` },
          { key: "transit", label: `En transit (${counts.transit})` },
          { key: "collected", label: `Collectées (${counts.collected})` },
          { key: "paid", label: `Payées (${counts.paid})` },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilterState(f.key)} style={{
            padding: "7px 16px", borderRadius: 20, fontSize: 12.5, flexShrink: 0,
            fontWeight: filterState === f.key ? 600 : 400,
            background: filterState === f.key ? "#0F172A" : "#fff",
            color: filterState === f.key ? "#fff" : "#64748B",
            border: filterState === f.key ? "none" : "1px solid #E2E8F0",
            cursor: "pointer", fontFamily: "inherit",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 96, background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0", animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #E2E8F0", borderRadius: 14, padding: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 12 }}><Icon name="package" size={40} color="#94A3B8" /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Aucune livraison</div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Changez la date ou le filtre</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(d => (
            <DeliveryCard
              key={d.id}
              delivery={d}
              onModify={openModify}
              onCancel={handleCancel}
              onValidate={handleValidate}
              loading={actionLoading ?? loadingModify}
            />
          ))}
        </div>
      )}

      {/* Récap financier */}
      {!loading && deliveries.length > 0 && (
        <div style={{ marginTop: 24, background: "#0F172A", borderRadius: 14, padding: "18px 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Récapitulatif — {new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "En attente", value: fmtPrice(totalCollected), color: "#F59E0B" },
              { label: "Validé", value: fmtPrice(totalPaid), color: "#22C55E" },
              { label: "Total livraisons", value: String(counts.all), color: "#60A5FA" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal modification */}
      {modifyingSale && (
        <ModifyModal
          sale={modifyingSale}
          onClose={() => setModifyingSale(null)}
          onSaved={handleModifySaved}
        />
      )}
    </div>
  );
}
