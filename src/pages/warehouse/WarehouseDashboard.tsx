// src/pages/warehouse/WarehouseDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, StatCard, Btn, Icon, Badge } from "../../components/ui";
import { stockService, stockTransferService } from "../../services/stockService";
import { formatDateTime } from "../../utils/format";
import type { Stock } from "../../types/stock";
import type { StockTransfer } from "../../types/stock";

export default function WarehouseDashboard() {
  const navigate        = useNavigate();
  const { user }        = useAuth();

  const [stocks,    setStocks]    = useState<Stock[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      stockService.getAll({ location: "MAGASIN" }),
      stockTransferService.getAll({ transfer_type: "warehouse" }),
    ]).then(([sRes, tRes]) => {
      setStocks(sRes.results ?? []);
      setTransfers(tRes.results ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const totalProducts  = stocks.length;
  const totalQty       = stocks.reduce((s, st) => s + st.quantity, 0);
  const lowStock       = stocks.filter(s => s.stock_status !== "ok" && s.stock_status !== "out_of_stock").length;
  const pendingTransfers = transfers.filter(t => t.status === "pending" || t.status === "in_transit").length;

  const recentTransfers = [...transfers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const STATUS_COLOR: Record<string, "yellow" | "blue" | "green" | "red"> = {
    pending:    "yellow",
    in_transit: "blue",
    received:   "green",
    cancelled:  "red",
  };
  const STATUS_LABEL: Record<string, string> = {
    pending:    "En attente",
    in_transit: "En transit",
    received:   "Reçu",
    cancelled:  "Annulé",
  };

  return (
    <div>
      <PageHeader
        title="Tableau de bord — Magasin"
        subtitle={`${user?.first_name} ${user?.last_name} · ${user?.shop_name ?? ""}`}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Produits en magasin" value={totalProducts}     icon={<Icon name="package"     size={22} />} color="blue"   loading={loading} />
        <StatCard label="Quantité totale"     value={totalQty}          icon={<Icon name="stocks"      size={22} />} color="purple" loading={loading} />
        <StatCard label="Stock bas"           value={lowStock}          icon={<Icon name="warning"     size={22} />} color="orange" loading={loading} />
        <StatCard label="Transferts en cours" value={pendingTransfers}  icon={<Icon name="transfers"   size={22} />} color="yellow" loading={loading} />
      </div>

      {/* Actions rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Enregistrer un arrivage",       icon: "plus",      path: "/magasinier/arrivage",   color: "#10B981" },
          { label: "Voir le stock magasin",          icon: "package",   path: "/magasinier/stock",      color: "#3B82F6" },
          { label: "Créer un transfert",             icon: "transfers", path: "/magasinier/transferts", color: "#8B5CF6" },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            style={{
              background: "#fff", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer", fontFamily: "inherit",
              transition: "box-shadow 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: a.color + "20",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={a.icon as any} size={20} color={a.color} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Derniers transferts */}
      <div style={{
        background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
            Derniers transferts magasin → boutique
          </span>
          <Btn size="sm" variant="secondary" onClick={() => navigate("/magasinier/transferts")}>
            Voir tout
          </Btn>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>Chargement...</div>
        ) : recentTransfers.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>
            Aucun transfert pour le moment
          </div>
        ) : (
          recentTransfers.map(t => (
            <div key={t.id} style={{
              padding: "14px 20px", borderBottom: "1px solid #F8FAFC",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                  {t.product_name}
                  <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "#94A3B8", marginLeft: 8 }}>
                    {t.reference}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Qté: {t.quantity} · {formatDateTime(t.created_at)}
                </div>
              </div>
              <Badge
                label={STATUS_LABEL[t.status] ?? t.status}
                color={STATUS_COLOR[t.status] ?? "yellow"}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
