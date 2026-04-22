// src/pages/manager/SalesHistoryPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, StatCard, Icon } from "../../components/ui";
import axiosInstance from "../../api/axiosInstance";

interface DaySummary {
  date: string;
  total_sales: number;
  total_amount: number;
}

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " F";

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
};

export default function SalesHistoryPage() {
  const { user, activeShop } = useAuth();
  const navigate  = useNavigate();
  const now       = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days,  setDays]  = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/sales/monthly_summary/?year=${year}&month=${month}`);
      setDays(res.data.days ?? []);
    } catch {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [year, month]);

  const totalCA    = days.reduce((s, d) => s + d.total_amount, 0);
  const totalSales = days.reduce((s, d) => s + d.total_sales, 0);
  const bestDay    = days.length ? days.reduce((a, b) => b.total_amount > a.total_amount ? b : a) : null;

  const prefix = user?.role === "SUPER_ADMIN" ? "/admin" :
                 user?.role === "SHOP_MANAGER" ? "/manager" : "/employee";

  const goToDay = (date: string) => {
    navigate(`${prefix}/ventes?date=${date}`);
  };

  const goToReport = (date: string) => {
    navigate(`${prefix}/rapport?date=${date}`);
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div>
      <PageHeader
        title="Historique des ventes"
        subtitle={activeShop?.name ?? user?.shop_name ?? "Toutes boutiques"}
      />

      {/* Sélecteur mois */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
        background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "14px 20px",
      }}>
        <button onClick={prevMonth} style={{
          width: 34, height: 34, borderRadius: 8,
          border: "1px solid #E2E8F0", background: "#F8FAFC",
          cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>‹</button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            {MONTHS_FR[month - 1]} {year}
          </div>
          {isCurrentMonth && (
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Mois en cours</div>
          )}
        </div>

        <button onClick={nextMonth} disabled={isCurrentMonth} style={{
          width: 34, height: 34, borderRadius: 8,
          border: "1px solid #E2E8F0",
          background: isCurrentMonth ? "#F8FAFC" : "#F8FAFC",
          cursor: isCurrentMonth ? "not-allowed" : "pointer",
          opacity: isCurrentMonth ? 0.4 : 1,
          fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>›</button>
      </div>

      {/* Stats du mois */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Jours avec ventes" value={days.length}             icon={<Icon name="calendar" size={22} />} color="blue"   loading={loading} />
        <StatCard label="Ventes totales"     value={totalSales}              icon={<Icon name="cart" size={22} />} color="blue"   loading={loading} />
        <StatCard label="CA du mois"         value={fmtPrice(totalCA)}       icon={<Icon name="money" size={22} />} color="blue"   loading={loading} />
      </div>

      {error && (
        <div style={{
          border: "1px solid #BFDBFE", color: "#1D4ED8",
          borderRadius: 10, padding: "12px 16px", fontSize: 13.5, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* Liste des jours */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          padding: "12px 18px", borderBottom: "1px solid #E2E8F0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
            Détail par jour
          </span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {days.length} jour(s) avec ventes
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 52, background: "#F8FAFC", borderRadius: 8 }} />
            ))}
          </div>
        ) : days.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>
            Aucune vente ce mois-ci
          </div>
        ) : (
          <div>
            {days.map((day, idx) => {
              const isBest = bestDay?.date === day.date;
              return (
                <div key={day.date} style={{
                  display: "flex", alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: idx < days.length - 1 ? "1px solid #F1F5F9" : "none",
                  borderLeft: isBest ? "3px solid #1D4ED8" : "3px solid transparent",
                }}>
                  {/* Date */}
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", textTransform: "capitalize" }}>
                      {fmtDate(day.date)}
                    </div>
                    {isBest && (
                      <div style={{ fontSize: 10.5, color: "#1D4ED8", fontWeight: 600, marginTop: 2 }}>
                        Meilleure journée
                      </div>
                    )}
                  </div>

                  {/* Bar proportionnelle */}
                  <div style={{ flex: 1, margin: "0 16px" }}>
                    <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: "#1D4ED8",
                        width: `${bestDay ? (day.total_amount / bestDay.total_amount) * 100 : 0}%`,
                        transition: "width 0.3s",
                      }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ textAlign: "right", flexShrink: 0, marginRight: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                      {fmtPrice(day.total_amount)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                      {day.total_sales} vente(s)
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => goToDay(day.date)} style={{
                      padding: "5px 12px", borderRadius: 7, fontSize: 12,
                      border: "1px solid #BFDBFE", background: "#EFF6FF",
                      color: "#1D4ED8", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    }}>
                      Ventes
                    </button>
                    <button onClick={() => goToReport(day.date)} style={{
                      padding: "5px 12px", borderRadius: 7, fontSize: 12,
                      border: "1px solid #E2E8F0", background: "#F8FAFC",
                      color: "#374151", cursor: "pointer", fontFamily: "inherit",
                    }}>
                      Rapport
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total du mois */}
        {!loading && days.length > 0 && (
          <div style={{
            padding: "14px 18px",
            borderTop: "2px solid #E2E8F0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#F8FAFC",
          }}>
            <span style={{ fontWeight: 700, color: "#374151" }}>
              Total {MONTHS_FR[month - 1]} {year}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1D4ED8" }}>
                {fmtPrice(totalCA)}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{totalSales} ventes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
