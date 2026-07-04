// src/pages/manager/ManagerDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth }      from "../../context/AuthContext";
import { useNavigate }  from "react-router-dom";
import { stockService } from "../../services/stockService";
import { userService }  from "../../services/userService";
import axiosInstance    from "../../api/axiosInstance";
import { StatCard, PageHeader, Btn, Icon } from "../../components/ui";
import type { User } from "../../types/user";

interface DayRevenue { date: string; total_sales: number; total_amount: number; }
interface TopProduct { id: number; name: string; amount: number; qty: number; }

const fmtK = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
};

export default function ManagerDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [employees, setEmployees] = useState<User[]>([]);
  const [alerts, setAlerts]       = useState({ out_of_stock: 0, critical: 0, low: 0 });
  const [loading, setLoading]     = useState(true);

  const [period, setPeriod]             = useState<"week" | "month">("week");
  const [monthDays, setMonthDays]       = useState<DayRevenue[]>([]);
  const [topProducts, setTopProducts]   = useState<TopProduct[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      stockService.getAlerts("all"),
      userService.getEmployees(),
    ]).then(([stockAlerts, employeesRes]) => {
      setAlerts({
        out_of_stock: stockAlerts.stocks.filter((s: any) => s.stock_status === "out_of_stock").length,
        critical:     stockAlerts.stocks.filter((s: any) => s.stock_status === "critical").length,
        low:          stockAlerts.stocks.filter((s: any) => s.stock_status === "low").length,
      });
      const all = employeesRes.results ?? employeesRes;
      setEmployees(all.filter((e: User) => e.shop === user?.shop));
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - 6 + i);
      return d.toISOString().slice(0, 10);
    });

    Promise.all([
      axiosInstance.get(`/sales/monthly_summary/?year=${year}&month=${month}`),
      ...last7.map(dt => axiosInstance.get(`/sales/daily_report/?date=${dt}`)),
    ]).then(([monthRes, ...dailyRes]) => {
      setMonthDays(monthRes.data.days ?? []);

      const agg: Record<number, TopProduct> = {};
      dailyRes.forEach(res => {
        (res.data.products_recap ?? []).forEach((p: any) => {
          if (!agg[p.product__id]) {
            agg[p.product__id] = { id: p.product__id, name: p.product__name, amount: 0, qty: 0 };
          }
          agg[p.product__id].amount += Number(p.total_amount ?? 0);
          agg[p.product__id].qty    += Number(p.total_qty    ?? 0);
        });
      });
      setTopProducts(Object.values(agg).sort((a, b) => b.amount - a.amount).slice(0, 8));
    })
    .catch(() => {})
    .finally(() => setSalesLoading(false));
  }, []);

  // ── Chart computation ────────────────────────────────────────────────
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const byDate: Record<string, DayRevenue> = {};
  monthDays.forEach(d => { byDate[d.date] = d; });

  const chartData: DayRevenue[] = period === "week"
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - 6 + i);
        const dt = d.toISOString().slice(0, 10);
        return byDate[dt] ?? { date: dt, total_sales: 0, total_amount: 0 };
      })
    : (() => {
        const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Array.from({ length: dim }, (_, i) => {
          const dt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          return byDate[dt] ?? { date: dt, total_sales: 0, total_amount: 0 };
        });
      })();

  const maxAmount = Math.max(...chartData.map(d => d.total_amount), 1);
  const totalCA   = chartData.reduce((s, d) => s + d.total_amount, 0);

  const renderChart = () => {
    const n = chartData.length;
    const W = 500, H = 160;
    const PL = 50, PR = 10, PT = 14, PB = 28;
    const cw = W - PL - PR;
    const ch = H - PT - PB;
    const step  = cw / n;
    const barW  = Math.max(3, step * 0.65);
    const lStep = period === "month" ? Math.ceil(n / 10) : 1;

    const label = (dt: string) => {
      const d = new Date(dt + "T00:00:00");
      return period === "week"
        ? ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"][d.getDay()]
        : String(d.getDate());
    };

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {[0.5, 1].map(pct => {
          const y = PT + ch * (1 - pct);
          return (
            <g key={pct}>
              <line x1={PL} y1={y} x2={PL + cw} y2={y} stroke="#F1F5F9" strokeWidth={1} />
              <text x={PL - 5} y={y + 4} textAnchor="end" fontSize={9} fill="#CBD5E1">
                {fmtK(maxAmount * pct)}
              </text>
            </g>
          );
        })}
        <line x1={PL} y1={PT + ch} x2={PL + cw} y2={PT + ch} stroke="#E2E8F0" strokeWidth={1} />

        {chartData.map((d, i) => {
          const barH    = Math.max(d.total_amount > 0 ? 2 : 0, (d.total_amount / maxAmount) * ch);
          const x       = PL + step * i + (step - barW) / 2;
          const y       = PT + ch - barH;
          const isToday  = d.date === todayStr;
          const isFuture = d.date > todayStr;
          return (
            <g key={d.date}>
              {!isFuture && (
                <rect x={x} y={y} width={barW} height={barH} rx={2}
                  fill={isToday ? "#1D4ED8" : d.total_amount > 0 ? "#93C5FD" : "#F1F5F9"} />
              )}
              {i % lStep === 0 && (
                <text x={PL + step * i + step / 2} y={H - PB + 11}
                  textAnchor="middle" fontSize={8.5}
                  fill={isToday ? "#1D4ED8" : "#CBD5E1"}
                  fontWeight={isToday ? "700" : "400"}>
                  {label(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const actions = [
    { label: "Mes produits",     path: "/manager/products"         },
    { label: "Stocks & alertes", path: "/manager/stocks"           },
    { label: "Ajouter stock",    path: "/manager/stocks/add"       },
    { label: "Transferts",       path: "/manager/transfers"        },
    { label: "Inventaires",      path: "/manager/inventories"      },
    { label: "Mon équipe",       path: "/manager/users"            },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${user?.shop_name ?? "Votre boutique"} — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
        action={<Btn size="sm" onClick={() => navigate("/manager/users/create")}>+ Nouvel employé</Btn>}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Employés"  value={employees.length}    icon={<Icon name="users"   size={22} />} color="blue"   loading={loading} sub="dans votre boutique" />
        <StatCard label="Ruptures"  value={alerts.out_of_stock} icon={<Icon name="xCircle" size={22} />} color="red"    loading={loading} sub="produits à 0" />
        <StatCard label="Critiques" value={alerts.critical}     icon={<Icon name="warning" size={22} />} color="orange" loading={loading} sub="en dessous du minimum" />
        <StatCard label="Stock bas" value={alerts.low}          icon={<Icon name="chartUp" size={22} />} color="purple" loading={loading} sub="à réapprovisionner" />
      </div>

      {/* Alerte rouge */}
      {!loading && (alerts.out_of_stock > 0 || alerts.critical > 0) && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
          padding: "14px 18px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#DC2626", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="warning" size={15} color="#DC2626" /> Attention requise
            </div>
            <div style={{ fontSize: 13, color: "#EF4444" }}>
              {alerts.out_of_stock > 0 && <span>{alerts.out_of_stock} produit(s) en rupture. </span>}
              {alerts.critical > 0     && <span>{alerts.critical} produit(s) en stock critique.</span>}
            </div>
          </div>
          <Btn size="sm" variant="danger" onClick={() => navigate("/manager/stocks")}>Voir les stocks →</Btn>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Actions rapides
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {actions.map((a, i) => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 13.5, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", textAlign: "left",
                background: i === 0 ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "#fff",
                color:      i === 0 ? "#fff" : "#374151",
                border:     i === 0 ? "none" : "1px solid #E2E8F0",
                boxShadow:  i === 0 ? "0 2px 8px rgba(59,130,246,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => { if (i !== 0) { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.color = "#1D4ED8"; } }}
              onMouseLeave={e => { if (i !== 0) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#374151"; } }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Ventes ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>

        {/* Graphe CA */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Chiffre d'affaires
              </div>
              {salesLoading ? (
                <div style={{ height: 28, width: 150, background: "#F1F5F9", borderRadius: 6 }} />
              ) : (
                <>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
                    {totalCA.toLocaleString("fr-FR")} <span style={{ fontSize: 14, fontWeight: 500, color: "#94A3B8" }}>F</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>
                    {period === "week" ? "7 derniers jours" : `Mois de ${now.toLocaleDateString("fr-FR", { month: "long" })}`}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", background: "#F8FAFC", borderRadius: 9, padding: 3, border: "1px solid #E2E8F0" }}>
              {(["week", "month"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "5px 13px", borderRadius: 7, fontSize: 12, fontWeight: period === p ? 600 : 400,
                  background: period === p ? "#fff" : "transparent",
                  color: period === p ? "#0F172A" : "#94A3B8",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>
                  {p === "week" ? "Semaine" : "Mois"}
                </button>
              ))}
            </div>
          </div>
          {salesLoading ? (
            <div style={{ height: 160, background: "#F8FAFC", borderRadius: 8 }} />
          ) : renderChart()}
        </div>

        {/* Top produits */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Top produits
          </div>
          <div style={{ fontSize: 11.5, color: "#CBD5E1", marginBottom: 16 }}>7 derniers jours · par CA</div>

          {salesLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 34, background: "#F8FAFC", borderRadius: 6 }} />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "28px 0" }}>
              Aucune vente cette semaine
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topProducts.map((p, i) => {
                const pct  = topProducts[0].amount > 0 ? (p.amount / topProducts[0].amount) * 100 : 0;
                const fill = i === 0 ? "#1D4ED8" : i < 3 ? "#60A5FA" : "#BFDBFE";
                return (
                  <div key={p.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? "#1D4ED8" : "#CBD5E1", width: 18, flexShrink: 0 }}>
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", flexShrink: 0, marginLeft: 8 }}>
                        {p.amount.toLocaleString("fr-FR")} F
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2 }}>
                      <div style={{ height: 4, borderRadius: 2, background: fill, width: `${pct}%`, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
