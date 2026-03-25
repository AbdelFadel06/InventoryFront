// src/pages/shared/StockListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stockService } from "../../services/stockService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import { formatPrice } from "../../utils/format";
import type { Stock } from "../../types/stock";

type StockStatus = "ok" | "low" | "critical" | "out_of_stock";

const STATUS_CONFIG: Record<StockStatus, { label: string; color: "green" | "yellow" | "orange" | "red" }> = {
  ok:           { label: "OK",        color: "green"  },
  low:          { label: "Stock bas", color: "yellow" },
  critical:     { label: "Critique",  color: "orange" },
  out_of_stock: { label: "Rupture",   color: "red"    },
};

export default function StockListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [stocks, setStocks]     = useState<Stock[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<StockStatus | "all">("all");

  useEffect(() => {
    stockService.getAll()
      .then(res => setStocks(res.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const outOfStock = stocks.filter(s => s.stock_status === "out_of_stock").length;
  const critical   = stocks.filter(s => s.stock_status === "critical").length;
  const low        = stocks.filter(s => s.stock_status === "low").length;
  const ok         = stocks.filter(s => s.stock_status === "ok").length;

  const filtered = stocks.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      (s.product_name ?? "").toLowerCase().includes(q) ||
      (s.product_sku  ?? "").toLowerCase().includes(q) ||
      (s.shop_name    ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || s.stock_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: "product_name", label: "Produit",
      render: (row: Stock) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: row.stock_status === "out_of_stock" ? "#FEF2F2"
              : row.stock_status === "critical" ? "#FFF7ED"
              : row.stock_status === "low"      ? "#FEFCE8"
              : "#F0FDF4",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="package" size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>
              {row.product_name}
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>
              {row.product_sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "shop_name", label: "Boutique",
      render: (row: Stock) => (
        <span style={{
          background: "#F1F5F9", padding: "3px 10px",
          borderRadius: 6, fontSize: 12.5, color: "#374151", fontWeight: 500,
        }}>
          {row.shop_name ?? "—"}
        </span>
      ),
    },
    {
      key: "quantity", label: "Quantité",
      render: (row: Stock) => {
        const color =
          row.stock_status === "out_of_stock" ? "#DC2626" :
          row.stock_status === "critical"     ? "#EA580C" :
          row.stock_status === "low"          ? "#D97706" : "#16A34A";
        return (
          <span style={{ fontWeight: 700, fontSize: 16, color }}>
            {row.quantity}
          </span>
        );
      },
    },
    {
      key: "stock_value", label: "Valeur stock",
      render: (row: Stock) => (
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
          {row.stock_value != null ? `${Number(row.stock_value).toLocaleString("fr-FR")} F` : "—"}
        </span>
      ),
    },
    {
      key: "stock_status", label: "Statut",
      render: (row: Stock) => {
        const s = STATUS_CONFIG[row.stock_status as StockStatus]
          ?? { label: row.stock_status, color: "gray" as const };
        return <Badge label={s.label} color={s.color} />;
      },
    },
    {
      key: "actions", label: "Actions",
      render: (row: Stock) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Btn size="sm" variant="primary"
            onClick={() => navigate(`${basePath}/stocks/add`, {
              state: { product: row.product, shop: row.shop }
            })}>
            + Ajouter
          </Btn>
          <Btn size="sm" variant="secondary"
            onClick={() => navigate(`${basePath}/stocks/remove`, {
              state: { product: row.product, shop: row.shop }
            })}>
            − Retirer
          </Btn>
          <Btn size="sm" variant="ghost"
            onClick={() => navigate(`${basePath}/stocks/adjust`, {
              state: { product: row.product, shop: row.shop }
            })}>
            Ajuster
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stocks"
        subtitle="État des stocks par produit et boutique"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" size="sm"
              onClick={() => navigate(`${basePath}/stocks/adjust`)}>
              Ajuster
            </Btn>
            <Btn onClick={() => navigate(`${basePath}/stocks/add`)}>
              + Ajouter stock
            </Btn>
          </div>
        }
      />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="OK"         value={ok}         icon={<Icon name="checkCircle" size={22} />} color="green"  loading={loading} />
        <StatCard label="Stock bas"  value={low}         icon={<Icon name="stocks" size={22} />}      color="purple" loading={loading} />
        <StatCard label="Critiques"  value={critical}    icon={<Icon name="warning" size={22} />}     color="orange" loading={loading} />
        <StatCard label="Ruptures"   value={outOfStock}  icon={<Icon name="xCircle" size={22} />}     color="red"    loading={loading} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",          label: "Tous"       },
          { key: "ok",           label: "OK"         },
          { key: "low",          label: "Stock bas"  },
          { key: "critical",     label: "Critiques"  },
          { key: "out_of_stock", label: "Ruptures"   },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key as any)}
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
        data={filtered}
        loading={loading}
        emptyText="Aucun stock trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Produit, SKU, boutique..."
      />
    </div>
  );
}
