// src/pages/shared/InventoryListPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "../../services/inventoryService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon, PaginationBar } from "../../components/ui";
import { formatDate } from "../../utils/format";
import type { Inventory } from "../../types/inventory";

type InventoryStatus = "draft" | "in_progress" | "completed" | "validated" | "cancelled";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; color: "gray" | "blue" | "yellow" | "green" | "red" }> = {
  draft:       { label: "Brouillon", color: "gray"   },
  in_progress: { label: "En cours",  color: "blue"   },
  completed:   { label: "Terminé",   color: "yellow" },
  validated:   { label: "Validé",    color: "green"  },
  cancelled:   { label: "Annulé",    color: "red"    },
};

export default function InventoryListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInventories = (page = 1, q = "", status = filterStatus) => {
    setLoading(true);
    const params: Record<string, any> = { page };
    if (q) params.search = q;
    if (status !== "all") params.status = status;
    inventoryService.getAll(params)
      .then(res => { setInventories(res.results ?? []); setTotalCount(res.count ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInventories(currentPage, search, filterStatus); }, [currentPage]);
  useEffect(() => { fetchInventories(1, "", "all"); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchInventories(1, val, filterStatus); }, 300);
  };

  const handleFilterStatus = (status: typeof filterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
    fetchInventories(1, search, status);
  };

  const draft      = inventories.filter(i => i.status === "draft").length;
  const inProgress = inventories.filter(i => i.status === "in_progress").length;
  const completed  = inventories.filter(i => i.status === "completed").length;
  const validated  = inventories.filter(i => i.status === "validated").length;

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
      key: "shop_name", label: "Boutique",
      render: (row: Inventory) => (
        <span style={{
          background: "#F1F5F9", padding: "3px 10px",
          borderRadius: 6, fontSize: 12.5, color: "#374151", fontWeight: 500,
        }}>
          {row.shop_name}
        </span>
      ),
    },
    {
      key: "inventory_date", label: "Date",
      render: (row: Inventory) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {formatDate(row.inventory_date)}
        </span>
      ),
    },
    {
      key: "progress", label: "Progression",
      render: (row: Inventory) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3 }}>
            <div style={{
              height: 6, borderRadius: 3,
              width: `${row.counting_progress ?? 0}%`,
              background: row.status === "validated" ? "#22C55E"
                : row.status === "cancelled"  ? "#94A3B8"
                : "linear-gradient(90deg, #3B82F6, #1D4ED8)",
              transition: "width 0.3s",
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
        <div style={{ display: "flex", gap: 6 }}>
          <Btn size="sm" variant="secondary"
            onClick={() => navigate(`${basePath}/inventories/${row.id}`)}>
            Ouvrir →
          </Btn>
          {row.status === "validated" && (
            <Btn size="sm" variant="ghost"
              onClick={() => navigate(`${basePath}/inventories/${row.id}/discrepancies`)}>
              Écarts
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventaires"
        subtitle="Gestion des inventaires physiques"
        action={
          <Btn onClick={() => navigate(`${basePath}/inventories/create`)}>
            + Nouvel inventaire
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="Brouillons"  value={draft}      icon={<Icon name="edit" size={22} />}        color="purple" loading={loading} />
        <StatCard label="En cours"    value={inProgress} icon={<Icon name="refresh" size={22} />}     color="blue"   loading={loading} />
        <StatCard label="Terminés"    value={completed}  icon={<Icon name="checkCircle" size={22} />} color="orange" loading={loading} />
        <StatCard label="Validés"     value={validated}  icon={<Icon name="target" size={22} />}      color="green"  loading={loading} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",         label: "Tous"      },
          { key: "draft",       label: "Brouillon" },
          { key: "in_progress", label: "En cours"  },
          { key: "completed",   label: "Terminés"  },
          { key: "validated",   label: "Validés"   },
          { key: "cancelled",   label: "Annulés"   },
        ].map(f => (
          <button key={f.key} onClick={() => handleFilterStatus(f.key as any)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterStatus === f.key ? 600 : 400,
              background: filterStatus === f.key ? "#0F172A" : "#fff",
              color:      filterStatus === f.key ? "#fff"    : "#64748B",
              border:     filterStatus === f.key ? "none"    : "1px solid #E2E8F0",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={inventories}
        loading={loading}
        emptyText="Aucun inventaire trouvé"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Référence, boutique..."
        onRowClick={(row: any) => navigate(`${basePath}/inventories/${row.id}`)}
      />
      <PaginationBar currentPage={currentPage} totalCount={totalCount} onPage={setCurrentPage} />
    </div>
  );
}
