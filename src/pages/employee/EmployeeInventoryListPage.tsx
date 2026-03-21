// src/pages/employee/EmployeeInventoryListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { inventoryService }    from "../../services/inventoryService";
import { PageHeader, Badge, DataTable } from "../../components/ui";
import { formatDate }          from "../../utils/format";
import type { Inventory }      from "../../types/inventory";

type InventoryStatus = "draft" | "in_progress" | "completed" | "validated" | "cancelled";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; color: "gray" | "blue" | "yellow" | "green" | "red" }> = {
  draft:       { label: "Brouillon", color: "gray"   },
  in_progress: { label: "En cours",  color: "blue"   },
  completed:   { label: "Terminé",   color: "yellow" },
  validated:   { label: "Validé",    color: "green"  },
  cancelled:   { label: "Annulé",    color: "red"    },
};

export default function EmployeeInventoryListPage() {
  const navigate = useNavigate();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    inventoryService.getAll()
      .then(res => setInventories(res.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: "reference", label: "Référence",
      render: (row: Inventory) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1D4ED8", fontSize: 12.5 }}>
          {row.reference}
        </span>
      ),
    },
    {
      key: "inventory_date", label: "Date",
      render: (row: Inventory) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>{formatDate(row.inventory_date)}</span>
      ),
    },
    {
      key: "progress", label: "Progression",
      render: (row: Inventory) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3 }}>
            <div style={{
              height: 6, borderRadius: 3,
              width: `${row.counting_progress ?? 0}%`,
              background: "linear-gradient(90deg, #3B82F6, #1D4ED8)",
            }} />
          </div>
          <span style={{ fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap" }}>
            {row.products_counted ?? 0}/{row.total_products ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: "status", label: "Statut",
      render: (row: Inventory) => {
        const s = STATUS_CONFIG[row.status as InventoryStatus] ?? { label: row.status, color: "gray" as const };
        return <Badge label={s.label} color={s.color} />;
      },
    },
    {
      key: "actions", label: "",
      render: (row: Inventory) => (
        <button
          onClick={() => navigate(`/employee/inventories/${row.id}`)}
          style={{
            fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            background: "none", border: "none", fontFamily: "inherit",
            color: row.status === "in_progress" ? "#1D4ED8" : "#94A3B8",
          }}
        >
          {row.status === "in_progress" ? "Compter →" : "Voir"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Inventaires" subtitle="Inventaires de votre boutique" />
      <DataTable
        columns={columns as any}
        data={inventories}
        loading={loading}
        emptyText="Aucun inventaire en cours"
        onRowClick={(row: any) => navigate(`/employee/inventories/${row.id}`)}
      />
    </div>
  );
}
