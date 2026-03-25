// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shopService }    from "../../services/shopService";
import { userService }    from "../../services/userService";
import { stockService }   from "../../services/stockService";
import { inventoryService } from "../../services/inventoryService";
import { StatCard, PageHeader, Btn, Badge, DataTable, Icon } from "../../components/ui";
import type { Inventory } from "../../types/inventory";
import { formatDate } from "../../utils/format";

type InventoryStatus = "draft" | "in_progress" | "completed" | "validated" | "cancelled";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; color: "gray" | "blue" | "yellow" | "green" | "red" }> = {
  draft:       { label: "Brouillon", color: "gray"   },
  in_progress: { label: "En cours",  color: "blue"   },
  completed:   { label: "Terminé",   color: "yellow" },
  validated:   { label: "Validé",    color: "green"  },
  cancelled:   { label: "Annulé",    color: "red"    },
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    shops: 0, managers: 0, employees: 0,
    shopsWithoutManager: 0,
    outOfStock: 0, critical: 0,
  });
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [invSearch, setInvSearch]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [shopsRes, managers, employees, stockAlerts, inventoriesRes] = await Promise.all([
          shopService.getAll(),
          userService.getManagers(),
          userService.getEmployees(),
          stockService.getAlerts("all"),
          inventoryService.getAll(),
        ]);

        const shopsList = shopsRes.results ?? shopsRes;
        const shopsWithoutManager = shopsList.filter((s: any) => !s.manager).length;

        setStats({
          shops:               shopsList.length,
          managers:            managers.length,
          employees:           employees.length,
          shopsWithoutManager,
          outOfStock:          stockAlerts.stocks?.filter((s: any) => s.stock_status === "out_of_stock").length ?? 0,
          critical:            stockAlerts.stocks?.filter((s: any) => s.stock_status === "critical").length ?? 0,
        });

        setInventories(inventoriesRes.results ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredInventories = inventories.filter(inv =>
    inv.reference.toLowerCase().includes(invSearch.toLowerCase()) ||
    inv.shop_name?.toLowerCase().includes(invSearch.toLowerCase())
  );

  const inventoryColumns = [
    {
      key: "reference", label: "Référence",
      render: (row: Inventory) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1D4ED8", fontSize: 12.5 }}>
          {row.reference}
        </span>
      ),
    },
    {
      key: "shop_name", label: "Boutique",
      render: (row: Inventory) => (
        <span style={{ fontWeight: 500, color: "#374151" }}>{row.shop_name}</span>
      ),
    },
    {
      key: "inventory_date", label: "Date",
      render: (row: Inventory) => (
        <span style={{ color: "#64748B", fontSize: 13 }}>{formatDate(row.inventory_date)}</span>
      ),
    },
    {
      key: "counting_progress", label: "Progression",
      render: (row: Inventory) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
          <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 3 }}>
            <div style={{
              height: 6, borderRadius: 3,
              width: `${row.counting_progress ?? 0}%`,
              background: "linear-gradient(90deg, #3B82F6, #1D4ED8)",
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
        <Btn size="sm" variant="ghost" onClick={(e) => {
          navigate(`/admin/inventories/${row.id}`);
        }}>
          Ouvrir →
        </Btn>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`Aujourd'hui, ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" size="sm" onClick={() => navigate("/admin/shops/create")}>
              + Boutique
            </Btn>
            <Btn size="sm" onClick={() => navigate("/admin/inventories/create")}>
              + Inventaire
            </Btn>
          </div>
        }
      />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard label="Boutiques actives"    value={stats.shops}     icon={<Icon name="store" size={22} />} color="blue"   loading={loading} sub={stats.shopsWithoutManager > 0 ? `${stats.shopsWithoutManager} sans manager` : undefined} />
        <StatCard label="Managers"             value={stats.managers}  icon={<Icon name="person" size={22} />} color="purple" loading={loading} />
        <StatCard label="Employés"             value={stats.employees} icon={<Icon name="users" size={22} />} color="green"  loading={loading} />
        <StatCard label="Ruptures de stock"    value={stats.outOfStock} icon={<Icon name="package" size={22} />} color="red"   loading={loading} sub={stats.outOfStock > 0 ? "À traiter" : "Aucune rupture"} />
        <StatCard label="Stocks critiques"     value={stats.critical}  icon={<Icon name="warning" size={22} />} color="orange" loading={loading} />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Actions rapides
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Nouveau produit",    path: "/admin/products/create"   },
            { label: "Ajouter du stock",   path: "/admin/stocks/add"        },
            { label: "Créer une boutique", path: "/admin/shops/create"      },
            { label: "Créer un employé",   path: "/admin/users/create"      },
            { label: "Nouvel inventaire",  path: "/admin/inventories/create"},
          ].map(a => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              style={{
                padding: "9px 18px",
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                fontSize: 13,
                color: "#374151",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.color = "#1D4ED8";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.color = "#374151";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventaires récents */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Inventaires récents
          </div>
          <Btn variant="ghost" size="sm" onClick={() => navigate("/admin/inventories")}>
            Voir tout →
          </Btn>
        </div>
        <DataTable
          columns={inventoryColumns as any}
          data={filteredInventories.slice(0, 8)}
          loading={loading}
          emptyText="Aucun inventaire pour le moment"
          searchValue={invSearch}
          onSearch={setInvSearch}
          searchPlaceholder="Rechercher un inventaire..."
          onRowClick={(row: any) => navigate(`/admin/inventories/${row.id}`)}
        />
      </div>
    </div>
  );
}
