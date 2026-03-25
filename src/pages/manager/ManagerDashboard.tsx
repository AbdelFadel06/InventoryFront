// src/pages/manager/ManagerDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { stockService } from "../../services/stockService";
import { userService }  from "../../services/userService";
import { StatCard, PageHeader, Btn, Icon } from "../../components/ui";
import type { User } from "../../types/user";

export default function ManagerDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [employees, setEmployees] = useState<User[]>([]);
  const [alerts, setAlerts]       = useState({ out_of_stock: 0, critical: 0, low: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockAlerts, employeesRes] = await Promise.all([
          stockService.getAlerts("all"),
          userService.getEmployees(),
        ]);
        setAlerts({
          out_of_stock: stockAlerts.stocks.filter((s: any) => s.stock_status === "out_of_stock").length,
          critical:     stockAlerts.stocks.filter((s: any) => s.stock_status === "critical").length,
          low:          stockAlerts.stocks.filter((s: any) => s.stock_status === "low").length,
        });
        const all = employeesRes.results ?? employeesRes;
        setEmployees(all.filter((e: User) => e.shop === user?.shop));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const actions = [
    { label: "Mes produits",      path: "/manager/products"        },
    { label: "Stocks & alertes",  path: "/manager/stocks"          },
    { label: "Ajouter stock",     path: "/manager/stocks/add"      },
    { label: "Transferts",        path: "/manager/transfers"       },
    { label: "Inventaires",       path: "/manager/inventories"     },
    { label: "Mon équipe",        path: "/manager/users"           },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${user?.shop_name ?? "Votre boutique"} — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
        action={
          <Btn size="sm" onClick={() => navigate("/manager/users/create")}>
            + Nouvel employé
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Employés"     value={employees.length}   icon={<Icon name="users" size={22} />} color="blue"   loading={loading} sub="dans votre boutique" />
        <StatCard label="Ruptures"     value={alerts.out_of_stock} icon={<Icon name="xCircle" size={22} />} color="red"    loading={loading} sub="produits à 0" />
        <StatCard label="Critiques"    value={alerts.critical}     icon={<Icon name="warning" size={22} />} color="orange" loading={loading} sub="en dessous du minimum" />
        <StatCard label="Stock bas"    value={alerts.low}          icon={<Icon name="chartUp" size={22} />} color="purple" loading={loading} sub="à réapprovisionner" />
      </div>

      {/* Alerte rouge si urgence */}
      {!loading && (alerts.out_of_stock > 0 || alerts.critical > 0) && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: 12, padding: "14px 18px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#DC2626", marginBottom: 4 }}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><Icon name="warning" size={15} color="#DC2626" /> Attention requise</span>
            </div>
            <div style={{ fontSize: 13, color: "#EF4444" }}>
              {alerts.out_of_stock > 0 && <span>{alerts.out_of_stock} produit(s) en rupture. </span>}
              {alerts.critical > 0     && <span>{alerts.critical} produit(s) en stock critique.</span>}
            </div>
          </div>
          <Btn size="sm" variant="danger" onClick={() => navigate("/manager/stocks")}>
            Voir les stocks →
          </Btn>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Actions rapides
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {actions.map((a, i) => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 13.5,
                fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                fontFamily: "inherit", textAlign: "left",
                background: i === 0 ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "#fff",
                color:      i === 0 ? "#fff" : "#374151",
                border:     i === 0 ? "none" : "1px solid #E2E8F0",
                boxShadow: i === 0 ? "0 2px 8px rgba(59,130,246,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => { if (i !== 0) { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.color = "#1D4ED8"; } }}
              onMouseLeave={e => { if (i !== 0) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#374151"; } }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
