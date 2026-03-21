// src/pages/employee/EmployeeDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth }             from "../../context/AuthContext";
import { useNavigate }         from "react-router-dom";
import { stockService }        from "../../services/stockService";
import { inventoryService }    from "../../services/inventoryService";
import { StatCard, PageHeader } from "../../components/ui";
import type { Inventory }      from "../../types/inventory";

export default function EmployeeDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [alerts, setAlerts]                   = useState({ out_of_stock: 0, critical: 0 });
  const [activeInventory, setActiveInventory] = useState<Inventory | null>(null);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    Promise.all([stockService.getAlerts("all"), inventoryService.getAll()])
      .then(([stockAlerts, inventoriesRes]) => {
        setAlerts({
          out_of_stock: stockAlerts.stocks.filter((s: any) => s.stock_status === "out_of_stock").length,
          critical:     stockAlerts.stocks.filter((s: any) => s.stock_status === "critical").length,
        });
        setActiveInventory(inventoriesRes.results.find((inv: Inventory) => inv.status === "in_progress") ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const actions = [
    { label: "Voir les produits", path: "/employee/products",    primary: true  },
    { label: "Voir les stocks",   path: "/employee/stocks",      primary: false },
    { label: "Mes inventaires",   path: "/employee/inventories", primary: false },
    { label: "Mouvements stock",  path: "/employee/movements",   primary: false },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${user?.shop_name ?? "Votre boutique"} — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Ruptures de stock" value={alerts.out_of_stock} icon="🚫" color="red"    loading={loading} sub="produits à 0" />
        <StatCard label="Stock critique"    value={alerts.critical}     icon="⚠️" color="orange" loading={loading} sub="en dessous du minimum" />
      </div>

      {/* Inventaire en cours */}
      {!loading && activeInventory && (
        <div style={{
          background: "#EFF6FF", border: "1px solid #BFDBFE",
          borderRadius: 14, padding: "18px 20px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1D4ED8" }}>
                📋 Inventaire en cours
              </div>
              <div style={{ fontSize: 12, color: "#3B82F6", marginTop: 2 }}>
                {activeInventory.reference} — {activeInventory.shop_name}
              </div>
            </div>
            <button
              onClick={() => navigate(`/employee/inventories/${activeInventory.id}`)}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                color: "#fff", border: "none", borderRadius: 9,
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Compter →
            </button>
          </div>
          <div style={{ height: 8, background: "#BFDBFE", borderRadius: 4 }}>
            <div style={{
              height: 8, borderRadius: 4,
              width: `${activeInventory.counting_progress ?? 0}%`,
              background: "linear-gradient(90deg, #3B82F6, #1D4ED8)",
              transition: "width 0.3s",
            }} />
          </div>
          <div style={{ fontSize: 12, color: "#3B82F6", marginTop: 6 }}>
            {activeInventory.counting_progress}% — {activeInventory.products_counted}/{activeInventory.total_products} produits
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Accès rapide
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {actions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 13.5,
                fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                fontFamily: "inherit", textAlign: "left",
                background: a.primary ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "#fff",
                color:      a.primary ? "#fff" : "#374151",
                border:     a.primary ? "none" : "1px solid #E2E8F0",
                boxShadow: a.primary ? "0 2px 8px rgba(59,130,246,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => { if (!a.primary) { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.color = "#1D4ED8"; } }}
              onMouseLeave={e => { if (!a.primary) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#374151"; } }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
