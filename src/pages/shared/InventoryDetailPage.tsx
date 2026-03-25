// src/pages/shared/InventoryDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inventoryService } from "../../services/inventoryService";
import { useAuth }          from "../../context/AuthContext";
import { Btn, Badge, Icon } from "../../components/ui";
import { formatDate }       from "../../utils/format";
import type { Inventory, InventoryLine } from "../../types/inventory";

type InventoryStatus = "draft" | "in_progress" | "completed" | "validated" | "cancelled";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; color: "gray" | "blue" | "yellow" | "green" | "red" }> = {
  draft:       { label: "Brouillon", color: "gray"   },
  in_progress: { label: "En cours",  color: "blue"   },
  completed:   { label: "Terminé",   color: "yellow" },
  validated:   { label: "Validé",    color: "green"  },
  cancelled:   { label: "Annulé",    color: "red"    },
};

export default function InventoryDetailPage() {
  const navigate        = useNavigate();
  const { id }          = useParams<{ id: string }>();
  const { user }        = useAuth();
  const basePath        = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [inventory, setInventory]       = useState<Inventory | null>(null);
  const [lines, setLines]               = useState<InventoryLine[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [countValues, setCountValues]   = useState<Record<number, string>>({});
  const [saving, setSaving]             = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<"all" | "pending" | "counted">("all");

  const fetchInventory = async () => {
    try {
      const inv = await inventoryService.getById(Number(id)) as any;
      setInventory(inv);
      setLines(inv.lines ?? []);
    } catch {
      setError("Inventaire introuvable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [id]);

  const handleAction = async (action: "add_products" | "start" | "complete" | "validate" | "cancel") => {
    setActionLoading(true);
    setError(null);
    try {
      if (action === "add_products") await inventoryService.addProducts(Number(id), { add_all: true });
      if (action === "start")        await inventoryService.start(Number(id));
      if (action === "complete")     await inventoryService.complete(Number(id));
      if (action === "validate")     await inventoryService.validate(Number(id));
      if (action === "cancel")       await inventoryService.cancel(Number(id));
      await fetchInventory();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Une erreur est survenue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCount = async (lineId: number) => {
    const val = countValues[lineId];
    if (val === undefined || val === "") return;
    setSaving(lineId);
    setError(null);
    try {
      await inventoryService.countProduct(Number(id), {
        line_id: lineId,
        counted_quantity: Number(val),
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

  const status     = STATUS_CONFIG[inventory.status as InventoryStatus];
  const canCount   = inventory.status === "in_progress";
  const uncounted  = lines.filter(l => !l.is_counted);
  const counted    = lines.filter(l => l.is_counted);
  const displayLines =
    activeTab === "pending" ? uncounted :
    activeTab === "counted" ? counted   : lines;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <button onClick={() => navigate(`${basePath}/inventories`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: 0 }}>
              ← Inventaires
            </button>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span style={{ fontSize: 13, color: "#64748B", fontFamily: "monospace", fontWeight: 600 }}>
              {inventory.reference}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {inventory.shop_name}
            </h1>
            <Badge label={status.label} color={status.color} />
          </div>
          <p style={{ fontSize: 13.5, color: "#94A3B8", margin: "4px 0 0" }}>
            {formatDate(inventory.inventory_date)}
            {inventory.notes && ` — ${inventory.notes}`}
          </p>
        </div>

        {/* Actions selon statut */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {inventory.status === "draft" && (
            <>
              <Btn variant="secondary" disabled={actionLoading}
                onClick={() => handleAction("add_products")}>
                {actionLoading ? "..." : <><Icon name="package" size={14} color="#1D4ED8" /> Ajouter produits</>}
              </Btn>
              {lines.length > 0 && (
                <Btn disabled={actionLoading} onClick={() => handleAction("start")}>
                  {actionLoading ? "..." : "▶ Démarrer"}
                </Btn>
              )}
            </>
          )}
          {inventory.status === "in_progress" && inventory.counting_progress === 100 && (
            <Btn disabled={actionLoading} onClick={() => handleAction("complete")}>
              {actionLoading ? "..." : "✓ Terminer le comptage"}
            </Btn>
          )}
          {inventory.status === "completed" && (
            <>
              <Btn variant="secondary"
                onClick={() => navigate(`${basePath}/inventories/${id}/discrepancies`)}>
                Voir les écarts
              </Btn>
              <Btn disabled={actionLoading} onClick={() => handleAction("validate")}>
                {actionLoading ? "..." : <><Icon name="target" size={14} color="#6D28D9" /> Valider l'inventaire</>}
              </Btn>
            </>
          )}
          {inventory.status === "validated" && (
            <Btn variant="secondary"
              onClick={() => navigate(`${basePath}/inventories/${id}/discrepancies`)}>
              <><Icon name="chart" size={14} color="#1D4ED8" /> Rapport d'écarts</>
            </Btn>
          )}
          {["draft", "in_progress", "completed"].includes(inventory.status) && (
            <Btn variant="danger" disabled={actionLoading}
              onClick={() => handleAction("cancel")}>
              Annuler
            </Btn>
          )}
        </div>
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

      {/* Stats + progression */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total produits",  value: inventory.total_products   ?? 0, icon: <Icon name="package"     size={22} color="#3B82F6" />, color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
          { label: "Comptés",         value: inventory.products_counted  ?? 0, icon: <Icon name="checkCircle" size={22} color="#15803D" />, color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
          { label: "Restants",        value: (inventory.total_products ?? 0) - (inventory.products_counted ?? 0), icon: <Icon name="clock" size={22} color="#D97706" />, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
          { label: "Écarts détectés", value: inventory.total_discrepancies ?? 0, icon: <Icon name="warning"    size={22} color="#DC2626" />, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ marginBottom: 4, display: "flex", alignItems: "center" }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, opacity: 0.8, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{
        background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: 14, padding: "18px 22px", marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>Progression du comptage</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1D4ED8" }}>
            {inventory.counting_progress ?? 0}%
          </span>
        </div>
        <div style={{ height: 10, background: "#F1F5F9", borderRadius: 5 }}>
          <div style={{
            height: 10, borderRadius: 5,
            width: `${inventory.counting_progress ?? 0}%`,
            background: inventory.counting_progress === 100
              ? "linear-gradient(90deg, #22C55E, #16A34A)"
              : "linear-gradient(90deg, #3B82F6, #1D4ED8)",
            transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
          {inventory.products_counted ?? 0} produits comptés sur {inventory.total_products ?? 0}
        </div>
      </div>

      {/* Liste des produits */}
      {lines.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", borderBottom: "1px solid #F1F5F9",
            padding: "0 20px",
          }}>
            {[
              { key: "all",     label: `Tous (${lines.length})`          },
              { key: "pending", label: `À compter (${uncounted.length})` },
              { key: "counted", label: `Comptés (${counted.length})`     },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: "14px 16px", fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color:  activeTab === tab.key ? "#1D4ED8" : "#94A3B8",
                  borderBottom: activeTab === tab.key ? "2px solid #3B82F6" : "2px solid transparent",
                  background: "none", border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid #3B82F6" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lignes */}
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {displayLines.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                {activeTab === "pending" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Tous les produits ont été comptés <Icon name="checkCircle" size={14} color="#15803D" /></span> : "Aucun produit dans cet onglet"}
              </div>
            ) : (
              displayLines.map((line, idx) => (
                <div key={line.id} style={{
                  display: "flex", alignItems: "center",
                  padding: "14px 20px", gap: 12,
                  borderBottom: idx < displayLines.length - 1 ? "1px solid #F8FAFC" : "none",
                  background: line.is_counted ? "#FAFFFE" : "#fff",
                  transition: "background 0.1s",
                }}>
                  {/* Statut */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: line.is_counted ? "#22C55E" : "#E2E8F0",
                  }} />

                  {/* Produit */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {line.product_name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>
                      {line.product_sku}
                    </div>
                  </div>

                  {/* Attendu */}
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Attendu</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>{line.expected_quantity}</div>
                  </div>

                  {/* Compté */}
                  {line.is_counted && (
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Compté</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: line.difference === 0 ? "#15803D" : line.difference! > 0 ? "#1D4ED8" : "#DC2626" }}>
                        {line.counted_quantity}
                      </div>
                    </div>
                  )}

                  {/* Écart */}
                  {line.is_counted && line.difference !== 0 && (
                    <div style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: (line.difference ?? 0) > 0 ? "#EFF6FF" : "#FEF2F2",
                      color:      (line.difference ?? 0) > 0 ? "#1D4ED8"  : "#DC2626",
                    }}>
                      {(line.difference ?? 0) > 0 ? `+${line.difference}` : line.difference}
                    </div>
                  )}
                  {line.is_counted && line.difference === 0 && (
                    <span style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>✓ OK</span>
                  )}

                  {/* Input comptage */}
                  {canCount && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="number" min={0}
                        value={countValues[line.id] ?? ""}
                        onChange={e => setCountValues(prev => ({ ...prev, [line.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") handleCount(line.id); }}
                        placeholder={line.is_counted ? String(line.counted_quantity ?? "") : "Qté"}
                        style={{
                          width: 72, padding: "7px 10px", textAlign: "center",
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
                          width: 34, height: 34, borderRadius: 8,
                          background: saving === line.id || !countValues[line.id]
                            ? "#F1F5F9" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                          border: "none", cursor: saving === line.id || !countValues[line.id] ? "not-allowed" : "pointer",
                          color: saving === line.id || !countValues[line.id] ? "#94A3B8" : "#fff",
                          fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        {saving === line.id ? "⋯" : "✓"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state si pas de produits */}
      {lines.length === 0 && inventory.status === "draft" && (
        <div style={{
          background: "#fff", border: "2px dashed #E2E8F0",
          borderRadius: 14, padding: 48, textAlign: "center",
        }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="package" size={40} color="#94A3B8" /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Aucun produit ajouté
          </div>
          <div style={{ fontSize: 13.5, color: "#94A3B8", marginBottom: 20 }}>
            Ajoutez les produits à compter pour démarrer l'inventaire
          </div>
          <Btn onClick={() => handleAction("add_products")} disabled={actionLoading}>
            {actionLoading ? "Ajout en cours..." : <><Icon name="package" size={14} color="#1D4ED8" /> Ajouter tous les produits</>}
          </Btn>
        </div>
      )}
    </div>
  );
}
