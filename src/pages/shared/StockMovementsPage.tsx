// src/pages/shared/StockMovementsPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stockMovementService } from "../../services/stockService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Badge, DataTable, PaginationBar } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import type { StockMovement } from "../../types/stock";

type MovementType =
  | "entry" | "exit" | "transfer_out" | "transfer_in"
  | "adjustment" | "return" | "damage" | "inventory";

const MOVEMENT_CONFIG: Record<MovementType, { label: string; color: "green" | "red" | "blue" | "orange" | "purple" | "yellow" | "gray"; sign: "+" | "-" | "±" }> = {
  entry:        { label: "Entrée",            color: "green",  sign: "+" },
  exit:         { label: "Vente/Sortie",      color: "red",    sign: "-" },
  transfer_out: { label: "Transfert sortant", color: "orange", sign: "-" },
  transfer_in:  { label: "Transfert entrant", color: "blue",   sign: "+" },
  adjustment:   { label: "Ajustement",        color: "purple", sign: "±" },
  return:       { label: "Retour",            color: "yellow", sign: "+" },
  damage:       { label: "Casse/Perte",       color: "red",    sign: "-" },
  inventory:    { label: "Ajust. inventaire", color: "gray",   sign: "±" },
};

const FILTER_TYPES: { key: MovementType | "all"; label: string }[] = [
  { key: "all",          label: "Tous"       },
  { key: "entry",        label: "Entrées"    },
  { key: "exit",         label: "Sorties"    },
  { key: "transfer_out", label: "Transferts" },
  { key: "transfer_in",  label: "Réceptions" },
  { key: "adjustment",   label: "Ajustements"},
  { key: "damage",       label: "Pertes"     },
  { key: "inventory",    label: "Inventaires"},
];

export default function StockMovementsPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType] = useState<MovementType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMovements = (page = 1, q = "", type = filterType) => {
    setLoading(true);
    const params: Record<string, any> = { page };
    if (q) params.search = q;
    if (type !== "all") params.movement_type = type;
    stockMovementService.getAll(params)
      .then(res => { setMovements(res.results ?? []); setTotalCount(res.count ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMovements(currentPage, search, filterType); }, [currentPage]);
  useEffect(() => { fetchMovements(1, "", "all"); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchMovements(1, val, filterType); }, 300);
  };

  const handleFilterType = (type: typeof filterType) => {
    setFilterType(type);
    setCurrentPage(1);
    fetchMovements(1, search, type);
  };

  const totalEntries = movements.filter(m => ["entry", "transfer_in", "return"].includes(m.movement_type)).length;
  const totalExits   = movements.filter(m => ["exit", "transfer_out", "damage"].includes(m.movement_type)).length;
  const totalAdjusts = movements.filter(m => ["adjustment", "inventory"].includes(m.movement_type)).length;

  const columns = [
    {
      key: "created_at", label: "Date",
      render: (row: StockMovement) => (
        <span style={{ fontSize: 12.5, color: "#64748B", whiteSpace: "nowrap" }}>
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: "product_name", label: "Produit",
      render: (row: StockMovement) => (
        <div>
          <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>
            {row.product_name}
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>
            {row.product_sku}
          </div>
        </div>
      ),
    },
    {
      key: "shop_name", label: "Boutique",
      render: (row: StockMovement) => (
        <span style={{
          background: "#F1F5F9", padding: "3px 10px",
          borderRadius: 6, fontSize: 12.5,
          color: "#374151", fontWeight: 500,
        }}>
          {row.shop_name}
        </span>
      ),
    },
    {
      key: "movement_type", label: "Type",
      render: (row: StockMovement) => {
        const cfg = MOVEMENT_CONFIG[row.movement_type as MovementType]
          ?? { label: row.movement_type, color: "gray" as const, sign: "±" as const };
        return <Badge label={cfg.label} color={cfg.color} />;
      },
    },
    {
      key: "quantity", label: "Quantité",
      render: (row: StockMovement) => {
        const isPositive = row.quantity > 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontWeight: 700, fontSize: 15,
              color: isPositive ? "#16A34A" : "#DC2626",
            }}>
              {isPositive ? `+${row.quantity}` : row.quantity}
            </span>
          </div>
        );
      },
    },
    {
      key: "stock_after", label: "Stock après",
      render: (row: StockMovement) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {row.quantity_before}
          </span>
          <span style={{ color: "#CBD5E1", fontSize: 12 }}>→</span>
          <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
            {row.quantity_after}
          </span>
        </div>
      ),
    },
    {
      key: "reason", label: "Motif",
      render: (row: StockMovement) => (
        <span style={{
          fontSize: 12.5, color: "#64748B",
          maxWidth: 180, display: "block",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {row.reason || row.reference || "—"}
        </span>
      ),
    },
    {
      key: "created_by_name", label: "Par",
      render: (row: StockMovement) => (
        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>
          {row.created_by_name ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mouvements de stock"
        subtitle="Historique complet de tous les mouvements"
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total mouvements", value: movements.length, bg: "#F8FAFC", border: "#E2E8F0", color: "#0F172A" },
          { label: "Entrées / Réceptions", value: totalEntries, bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D" },
          { label: "Sorties / Ventes",     value: totalExits,   bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
          { label: "Ajustements",          value: totalAdjusts, bg: "#F5F3FF", border: "#DDD6FE", color: "#6D28D9" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: "14px 18px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, opacity: 0.8, marginTop: 2, fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtres type */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={filterType}
          onChange={e => handleFilterType(e.target.value as typeof filterType)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", fontSize: 13, color: "#0F172A",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          {FILTER_TYPES.map(f => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns as any}
        data={movements}
        loading={loading}
        emptyText="Aucun mouvement trouvé"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Produit, boutique, référence, motif..."
      />
      <PaginationBar currentPage={currentPage} totalCount={totalCount} onPage={setCurrentPage} />
    </div>
  );
}
