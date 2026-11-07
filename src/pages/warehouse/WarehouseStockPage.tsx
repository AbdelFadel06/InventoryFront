// src/pages/warehouse/WarehouseStockPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { stockService } from "../../services/stockService";
import { countOf, getListCounts, type ListCounts } from "../../services/listCounts";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon, PaginationBar } from "../../components/ui";
import type { Stock, StockStatus } from "../../types/stock";

const STATUS_CONFIG: Record<StockStatus, { label: string; color: "green" | "yellow" | "orange" | "red" }> = {
  ok:           { label: "OK",        color: "green"  },
  low:          { label: "Stock bas", color: "yellow" },
  critical:     { label: "Critique",  color: "orange" },
  out_of_stock: { label: "Rupture",   color: "red"    },
};

export default function WarehouseStockPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stocks,  setStocks]  = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  // ?status=… : arrivée depuis une notification de stock.
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const initialStatus = (["ok", "low", "critical", "out_of_stock"] as const).find(s => s === statusParam) ?? "all";
  const [filterStatus, setFilterStatus] = useState<StockStatus | "all">(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [query, setQuery]             = useState("");
  const [counts, setCounts]           = useState<ListCounts | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Une nouvelle notification peut arriver alors que la page est déjà ouverte.
  useEffect(() => { setFilterStatus(initialStatus); setCurrentPage(1); }, [initialStatus]);

  // Le serveur filtre puis découpe en pages pleines.
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { location: "MAGASIN", page: currentPage };
    if (query) params.search = query;
    if (filterStatus !== "all") params.stock_status = filterStatus;
    stockService.getAll(params)
      .then(res => { setStocks(res.results ?? []); setTotalCount(res.count ?? 0); })
      .finally(() => setLoading(false));
  }, [currentPage, query, filterStatus]);

  useEffect(() => {
    getListCounts("stocks", { location: "MAGASIN", ...(query ? { search: query } : {}) })
      .then(setCounts).catch(() => setCounts(null));
  }, [query]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); setQuery(val); }, 300);
  };

  const outOfStock = countOf(counts, "out_of_stock");
  const critical   = countOf(counts, "critical");
  const low        = countOf(counts, "low");
  const ok         = countOf(counts, "ok");

  const columns = [
    {
      key: "product_name", label: "Produit",
      render: (row: Stock) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.product_image ? (
            <img src={row.product_image} style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="package" size={15} color="#3B82F6" />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.product_name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.product_sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "quantity", label: "Qté magasin",
      render: (row: Stock) => {
        const color =
          row.stock_status === "out_of_stock" ? "#DC2626" :
          row.stock_status === "critical"     ? "#EA580C" :
          row.stock_status === "low"          ? "#D97706" : "#1D4ED8";
        return <span style={{ fontWeight: 700, fontSize: 16, color }}>{row.quantity}</span>;
      },
    },
    {
      key: "stock_status", label: "Statut",
      render: (row: Stock) => {
        const s = STATUS_CONFIG[row.stock_status] ?? { label: row.stock_status, color: "gray" as const };
        return <Badge label={s.label} color={s.color} />;
      },
    },
    {
      key: "actions", label: "Actions",
      render: (row: Stock) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Btn size="sm" variant="primary"
            onClick={() => navigate("/magasinier/arrivage", {
              state: { product: row.product, shop: row.shop },
            })}>
            + Arrivage
          </Btn>
          <Btn size="sm" variant="secondary"
            onClick={() => navigate("/magasinier/transferts/new", {
              state: { product: row.product, shop: row.shop },
            })}>
            Transférer
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock magasin"
        subtitle="Inventaire du magasin"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={() => navigate("/magasinier/transferts/new")}>
              Transférer → Boutique
            </Btn>
            <Btn onClick={() => navigate("/magasinier/arrivage")}>
              + Enregistrer arrivage
            </Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="OK"        value={ok}        icon={<Icon name="checkCircle" size={22} />} color="green"  loading={loading} />
        <StatCard label="Stock bas" value={low}        icon={<Icon name="stocks"      size={22} />} color="purple" loading={loading} />
        <StatCard label="Critiques" value={critical}   icon={<Icon name="warning"     size={22} />} color="orange" loading={loading} />
        <StatCard label="Ruptures"  value={outOfStock} icon={<Icon name="xCircle"     size={22} />} color="red"    loading={loading} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",          label: "Tous"      },
          { key: "ok",           label: "OK"        },
          { key: "low",          label: "Stock bas" },
          { key: "critical",     label: "Critiques" },
          { key: "out_of_stock", label: "Ruptures"  },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilterStatus(f.key as any); setCurrentPage(1); }}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterStatus === f.key ? 600 : 400,
              background: filterStatus === f.key ? "#1D4ED8" : "#fff",
              color:      filterStatus === f.key ? "#fff"    : "#64748B",
              border:     filterStatus === f.key ? "none"    : "1px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={stocks}
        loading={loading}
        emptyText="Aucun produit en magasin"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Produit, SKU..."
      />
      <PaginationBar currentPage={currentPage} totalCount={totalCount} onPage={setCurrentPage} />
    </div>
  );
}
