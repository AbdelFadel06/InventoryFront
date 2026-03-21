// src/pages/employee/EmployeeInventoryCountPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inventoryService }    from "../../services/inventoryService";
import { Badge }               from "../../components/ui";
import { formatDate }          from "../../utils/format";
import type { Inventory, InventoryLine } from "../../types/inventory";

type InventoryStatus = "draft" | "in_progress" | "completed" | "validated" | "cancelled";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; color: "gray" | "blue" | "yellow" | "green" | "red" }> = {
  draft:       { label: "Brouillon", color: "gray"   },
  in_progress: { label: "En cours",  color: "blue"   },
  completed:   { label: "Terminé",   color: "yellow" },
  validated:   { label: "Validé",    color: "green"  },
  cancelled:   { label: "Annulé",    color: "red"    },
};

export default function EmployeeInventoryCountPage() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();

  const [inventory, setInventory]     = useState<Inventory | null>(null);
  const [lines, setLines]             = useState<InventoryLine[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [countValues, setCountValues] = useState<Record<number, string>>({});
  const [saving, setSaving]           = useState<number | null>(null);
  const [activeTab, setActiveTab]     = useState<"pending" | "counted">("pending");

  const fetchInventory = async () => {
    try {
      const inv = await inventoryService.getById(Number(id)) as any;
      setInventory(inv);
      setLines(inv.lines ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [id]);

  const handleCount = async (lineId: number) => {
    const val = countValues[lineId];
    if (!val && val !== "0") return;
    setSaving(lineId);
    setError(null);
    try {
      await inventoryService.countProduct(Number(id), {
        line_id: lineId, counted_quantity: Number(val),
      });
      await fetchInventory();
      setCountValues(prev => { const n = { ...prev }; delete n[lineId]; return n; });
    } catch {
      setError("Erreur lors du comptage.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "#94A3B8" }}>
      Chargement...
    </div>
  );
  if (!inventory) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, color: "#94A3B8" }}>
      Inventaire introuvable
    </div>
  );

  const canCount  = inventory.status === "in_progress";
  const status    = STATUS_CONFIG[inventory.status as InventoryStatus];
  const uncounted = lines.filter(l => !l.is_counted);
  const counted   = lines.filter(l => l.is_counted);
  const display   = activeTab === "pending" ? uncounted : counted;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <button onClick={() => navigate("/employee/inventories")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: 0 }}>
            ← Inventaires
          </button>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ fontSize: 13, color: "#64748B", fontFamily: "monospace", fontWeight: 600 }}>
            {inventory.reference}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            {inventory.shop_name}
          </h1>
          <Badge label={status.label} color={status.color} />
        </div>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>
          {formatDate(inventory.inventory_date)}
        </p>
      </div>

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          color: "#DC2626", borderRadius: 10, padding: "12px 16px",
          fontSize: 13.5, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Progression */}
      <div style={{
        background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: 14, padding: "18px 22px", marginBottom: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>Progression</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              {inventory.products_counted} / {inventory.total_products} produits
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1D4ED8" }}>
            {inventory.counting_progress ?? 0}%
          </div>
        </div>
        <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4 }}>
          <div style={{
            height: 8, borderRadius: 4,
            width: `${inventory.counting_progress ?? 0}%`,
            background: inventory.counting_progress === 100
              ? "linear-gradient(90deg, #22C55E, #16A34A)"
              : "linear-gradient(90deg, #3B82F6, #1D4ED8)",
            transition: "width 0.5s",
          }} />
        </div>
      </div>

      {/* Message statut */}
      {!canCount && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A",
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          fontSize: 13.5, color: "#92400E",
        }}>
          {inventory.status === "draft"     && "⏳ Cet inventaire n'a pas encore été démarré."}
          {inventory.status === "completed" && "✅ Le comptage est terminé, en attente de validation."}
          {inventory.status === "validated" && "🎯 Inventaire validé et stocks ajustés."}
          {inventory.status === "cancelled" && "❌ Inventaire annulé."}
        </div>
      )}

      {/* Tabs + liste */}
      {lines.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "0 20px" }}>
            {[
              { key: "pending", label: `À compter (${uncounted.length})` },
              { key: "counted", label: `Comptés (${counted.length})`     },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: "13px 16px", fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color:  activeTab === tab.key ? "#1D4ED8" : "#94A3B8",
                  borderBottom: activeTab === tab.key ? "2px solid #3B82F6" : "2px solid transparent",
                  background: "none", border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid #3B82F6" : "2px solid transparent",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {display.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                {activeTab === "pending" ? "✅ Tous les produits ont été comptés !" : "Aucun produit compté pour l'instant"}
              </div>
            ) : display.map((line, idx) => (
              <div key={line.id} style={{
                display: "flex", alignItems: "center", padding: "13px 20px", gap: 12,
                borderBottom: idx < display.length - 1 ? "1px solid #F8FAFC" : "none",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: line.is_counted ? "#22C55E" : "#E2E8F0",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {line.product_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{line.product_sku}</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 50 }}>
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>Attendu</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{line.expected_quantity}</div>
                </div>
                {line.is_counted && (
                  <div style={{ textAlign: "center", minWidth: 50 }}>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>Compté</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: line.difference === 0 ? "#15803D" : "#DC2626" }}>
                      {line.counted_quantity}
                    </div>
                  </div>
                )}
                {canCount && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number" min={0}
                      value={countValues[line.id] ?? ""}
                      onChange={e => setCountValues(p => ({ ...p, [line.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") handleCount(line.id); }}
                      placeholder={line.is_counted ? String(line.counted_quantity ?? "") : "Qté"}
                      style={{
                        width: 68, padding: "7px 8px", textAlign: "center",
                        border: "1px solid #E2E8F0", borderRadius: 8,
                        fontSize: 13.5, outline: "none", fontFamily: "inherit",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                      onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                    />
                    <button
                      onClick={() => handleCount(line.id)}
                      disabled={saving === line.id || !countValues[line.id]}
                      style={{
                        width: 34, height: 34, borderRadius: 8, border: "none",
                        background: saving === line.id || !countValues[line.id]
                          ? "#F1F5F9" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                        color: saving === line.id || !countValues[line.id] ? "#94A3B8" : "#fff",
                        cursor: saving === line.id || !countValues[line.id] ? "not-allowed" : "pointer",
                        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {saving === line.id ? "⋯" : "✓"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
