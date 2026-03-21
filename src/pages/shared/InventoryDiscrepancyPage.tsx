// src/pages/shared/InventoryDiscrepancyPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inventoryService } from "../../services/inventoryService";
import { useAuth }          from "../../context/AuthContext";
import { Btn, Badge }       from "../../components/ui";

interface Discrepancy {
  id:                  number;
  product:             number;
  product_name:        string;
  product_sku:         string;
  expected_quantity:   number;
  counted_quantity:    number;
  difference:          number;
  difference_percentage: number;
  discrepancy_status:  "shortage" | "surplus" | "ok";
  adjustment_value:    number;
  notes?:              string;
}

interface DiscrepancyResponse {
  inventory:          string;
  total_discrepancies: number;
  total_shortage:     number;
  total_surplus:      number;
  adjustment_value:   number;
  discrepancies:      Discrepancy[];
}

export default function InventoryDiscrepancyPage() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [data, setData]       = useState<DiscrepancyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "shortage" | "surplus">("all");

  useEffect(() => {
    inventoryService.getDiscrepancies(Number(id))
      .then(res => setData(res as any))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "#94A3B8" }}>
      Chargement...
    </div>
  );

  if (!data) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "#94A3B8" }}>
      Données introuvables
    </div>
  );

  const filtered = data.discrepancies.filter(d =>
    filter === "all" ? true : d.discrepancy_status === filter
  );

  const shortages = data.discrepancies.filter(d => d.discrepancy_status === "shortage");
  const surpluses = data.discrepancies.filter(d => d.discrepancy_status === "surplus");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <button onClick={() => navigate(`${basePath}/inventories/${id}`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: 0 }}>
              ← Inventaire
            </button>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span style={{ fontSize: 13, color: "#64748B", fontFamily: "monospace", fontWeight: 600 }}>
              {data.inventory}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Rapport d'écarts
          </h1>
          <p style={{ fontSize: 13.5, color: "#94A3B8", margin: "4px 0 0" }}>
            {data.total_discrepancies} produits avec écarts
          </p>
        </div>
        <Btn variant="secondary" onClick={() => navigate(`${basePath}/inventories/${id}`)}>
          ← Retour
        </Btn>
      </div>

      {/* Stats résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total écarts",     value: data.total_discrepancies, icon: "⚠️", bg: "#F8FAFC", border: "#E2E8F0", color: "#374151"  },
          { label: "Manquants",        value: shortages.length,         icon: "📉", bg: "#FEF2F2", border: "#FECACA", color: "#DC2626"  },
          { label: "Surplus",          value: surpluses.length,         icon: "📈", bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8"  },
          { label: "Valeur ajustement",
            value: `${Number(data.adjustment_value).toLocaleString("fr-FR")} F`,
            icon: "💰", bg: "#F5F3FF", border: "#DDD6FE", color: "#6D28D9"
          },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, opacity: 0.8, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {data.total_discrepancies === 0 ? (
        <div style={{
          background: "#F0FDF4", border: "1px solid #BBF7D0",
          borderRadius: 14, padding: 48, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>
            Inventaire parfait !
          </div>
          <div style={{ fontSize: 14, color: "#16A34A" }}>
            Aucun écart détecté — le stock théorique correspond au stock physique.
          </div>
        </div>
      ) : (
        <>
          {/* Filtres */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { key: "all",      label: `Tous (${data.total_discrepancies})` },
              { key: "shortage", label: `Manquants (${shortages.length})`   },
              { key: "surplus",  label: `Surplus (${surpluses.length})`      },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as any)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
                  fontWeight: filter === f.key ? 600 : 400,
                  background: filter === f.key ? "#0F172A" : "#fff",
                  color:      filter === f.key ? "#fff"    : "#64748B",
                  border:     filter === f.key ? "none"    : "1px solid #E2E8F0",
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Table écarts */}
          <div style={{
            background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Produit", "Attendu", "Compté", "Écart", "Écart %", "Valeur", "Statut"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "11px 18px",
                      color: "#64748B", fontWeight: 600, fontSize: 12,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => (
                  <tr key={d.id} style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                    background: d.discrepancy_status === "shortage" ? "#FFFAFA"
                      : d.discrepancy_status === "surplus" ? "#F0F9FF" : "#fff",
                  }}>
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#0F172A" }}>{d.product_name}</div>
                      <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{d.product_sku}</div>
                    </td>
                    <td style={{ padding: "13px 18px", color: "#64748B", fontWeight: 500 }}>
                      {d.expected_quantity}
                    </td>
                    <td style={{ padding: "13px 18px", color: "#374151", fontWeight: 500 }}>
                      {d.counted_quantity}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{
                        fontWeight: 700, fontSize: 14,
                        color: d.difference > 0 ? "#1D4ED8" : "#DC2626",
                      }}>
                        {d.difference > 0 ? `+${d.difference}` : d.difference}
                      </span>
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{
                        fontSize: 12.5, fontWeight: 600,
                        color: d.difference > 0 ? "#1D4ED8" : "#DC2626",
                        background: d.difference > 0 ? "#EFF6FF" : "#FEF2F2",
                        padding: "2px 8px", borderRadius: 6,
                      }}>
                        {d.difference > 0 ? "+" : ""}{d.difference_percentage}%
                      </span>
                    </td>
                    <td style={{ padding: "13px 18px", color: "#374151", fontWeight: 500 }}>
                      {Number(d.adjustment_value).toLocaleString("fr-FR")} F
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <Badge
                        label={d.discrepancy_status === "shortage" ? "Manquant" : "Surplus"}
                        color={d.discrepancy_status === "shortage" ? "red" : "blue"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
