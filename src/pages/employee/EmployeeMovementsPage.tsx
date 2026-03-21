// src/pages/employee/EmployeeMovementsPage.tsx
import { useEffect, useState }     from "react";
import { stockMovementService }    from "../../services/stockService";
import { PageHeader, Badge, DataTable } from "../../components/ui";
import { formatDateTime }          from "../../utils/format";
import type { StockMovement }      from "../../types/stock";

const MOVEMENT_CONFIG: Record<string, { label: string; color: "green" | "red" | "blue" | "orange" | "purple" | "yellow" | "gray" }> = {
  entry:        { label: "Entrée",            color: "green"  },
  exit:         { label: "Sortie",            color: "red"    },
  transfer_out: { label: "Transfert sortant", color: "orange" },
  transfer_in:  { label: "Transfert entrant", color: "blue"   },
  adjustment:   { label: "Ajustement",        color: "purple" },
  return:       { label: "Retour",            color: "yellow" },
  damage:       { label: "Casse/Perte",       color: "red"    },
  inventory:    { label: "Ajust. inventaire", color: "gray"   },
};

export default function EmployeeMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    stockMovementService.getAll()
      .then(res => setMovements(res.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter(m => {
    const q = search.toLowerCase();
    return (
      (m.product_name ?? "").toLowerCase().includes(q) ||
      (m.reason       ?? "").toLowerCase().includes(q) ||
      (m.reference    ?? "").toLowerCase().includes(q)
    );
  });

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
          <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.product_name}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.product_sku}</div>
        </div>
      ),
    },
    {
      key: "movement_type", label: "Type",
      render: (row: StockMovement) => {
        const cfg = MOVEMENT_CONFIG[row.movement_type] ?? { label: row.movement_type, color: "gray" as const };
        return <Badge label={cfg.label} color={cfg.color} />;
      },
    },
    {
      key: "quantity", label: "Quantité",
      render: (row: StockMovement) => (
        <span style={{ fontWeight: 700, fontSize: 15, color: row.quantity > 0 ? "#16A34A" : "#DC2626" }}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: "quantity_after", label: "Stock après",
      render: (row: StockMovement) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{row.quantity_before}</span>
          <span style={{ color: "#CBD5E1", fontSize: 12 }}>→</span>
          <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>{row.quantity_after}</span>
        </div>
      ),
    },
    {
      key: "reason", label: "Motif",
      render: (row: StockMovement) => (
        <span style={{ fontSize: 12.5, color: "#64748B", maxWidth: 140, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.reason || row.reference || "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Mouvements de stock" subtitle="Historique des entrées et sorties" />
      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun mouvement trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Produit, motif, référence..."
      />
    </div>
  );
}
