// src/pages/shared/StockListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stockService } from "../../services/stockService";
import { shopService }  from "../../services/shopService";
import { useAuth }      from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard } from "../../components/ui";
import type { Stock }   from "../../types/stock";
import type { Shop }    from "../../types/shop";

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
  const isAdmin   = user?.role === "SUPER_ADMIN";
  const basePath  = isAdmin ? "/admin" : "/manager";

  const [stocks, setStocks]             = useState<Stock[]>([]);
  const [shops, setShops]               = useState<Shop[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<StockStatus | "all">("all");
  const [selectedShop, setSelectedShop] = useState<string>(
    isAdmin ? "" : String(user?.shop ?? "")
  );

  useEffect(() => {
    if (isAdmin) {
      shopService.getAll().then(res => setShops(res.results ?? res));
    }
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    const params = selectedShop ? { shop: selectedShop } : {};
    stockService.getAll(params)
      .then(res => setStocks(res.results ?? []))
      .finally(() => setLoading(false));
  }, [selectedShop]);

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

  const selectedShopName = shops.find(s => String(s.id) === selectedShop)?.name;

  const columns = [
    {
      key: "product_name", label: "Produit",
      render: (row: Stock) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background:
              row.stock_status === "out_of_stock" ? "#FEF2F2" :
              row.stock_status === "critical"     ? "#FFF7ED" :
              row.stock_status === "low"          ? "#FEFCE8" : "#F0FDF4",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>
            📦
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.product_name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.product_sku}</div>
          </div>
        </div>
      ),
    },
    ...(isAdmin && !selectedShop ? [{
      key: "shop_name", label: "Boutique",
      render: (row: Stock) => (
        <span style={{
          background: "#F1F5F9", padding: "3px 10px",
          borderRadius: 6, fontSize: 12.5, color: "#374151", fontWeight: 500,
        }}>
          {row.shop_name ?? "—"}
        </span>
      ),
    }] : []),
    {
      key: "quantity", label: "Quantité",
      render: (row: Stock) => {
        const color =
          row.stock_status === "out_of_stock" ? "#DC2626" :
          row.stock_status === "critical"     ? "#EA580C" :
          row.stock_status === "low"          ? "#D97706" : "#16A34A";
        return <span style={{ fontWeight: 700, fontSize: 16, color }}>{row.quantity}</span>;
      },
    },
    {
      key: "stock_value", label: "Valeur",
      render: (row: Stock) => (
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
          {row.stock_value != null ? `${Number(row.stock_value).toLocaleString("fr-FR")} F` : "—"}
        </span>
      ),
    },
    {
      key: "stock_status", label: "Statut",
      render: (row: Stock) => {
        const s = STATUS_CONFIG[row.stock_status as StockStatus] ?? { label: row.stock_status, color: "gray" as const };
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
            ⚙
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stocks"
        subtitle={selectedShopName ? `Boutique : ${selectedShopName}` : isAdmin ? "Tous les stocks" : "Stock de votre boutique"}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" size="sm"
              disabled={isAdmin && !selectedShop}
              onClick={() => navigate(`${basePath}/stocks/adjust`, {
                state: { shop: selectedShop ? Number(selectedShop) : undefined }
              })}>
              ⚙ Ajuster
            </Btn>
            <Btn
              disabled={isAdmin && !selectedShop}
              onClick={() => navigate(`${basePath}/stocks/add`, {
                state: { shop: selectedShop ? Number(selectedShop) : undefined }
              })}>
              + Ajouter stock
            </Btn>
          </div>
        }
      />

      {/* Sélecteur boutique — Admin seulement */}
      {isAdmin && (
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 12, padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
            🏪 Boutique :
          </span>
          <select
            value={selectedShop}
            onChange={e => { setSelectedShop(e.target.value); setSearch(""); setFilterStatus("all"); }}
            style={{
              flex: 1, maxWidth: 300, padding: "8px 12px",
              border: "1px solid #E2E8F0", borderRadius: 8,
              fontSize: 13.5, color: "#374151", outline: "none",
              fontFamily: "inherit", background: "#fff", cursor: "pointer",
            }}
            onFocus={e => (e.target.style.borderColor = "#3B82F6")}
            onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
          >
            <option value="">Toutes les boutiques (lecture seule)</option>
            {shops.filter(s => s.is_active).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {!selectedShop ? (
            <div style={{
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 12.5, color: "#92400E",
            }}>
              ⚠️ Sélectionnez une boutique pour modifier les stocks
            </div>
          ) : (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 12.5, color: "#15803D",
            }}>
              ✅ Actions actives — <strong>{selectedShopName}</strong>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="OK"        value={ok}        icon="✅" color="green"  loading={loading} />
        <StatCard label="Stock bas" value={low}        icon="📉" color="purple" loading={loading} />
        <StatCard label="Critiques" value={critical}   icon="⚠️" color="orange" loading={loading} />
        <StatCard label="Ruptures"  value={outOfStock} icon="🚫" color="red"    loading={loading} />
      </div>

      {/* Filtres statut */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",          label: "Tous"      },
          { key: "ok",           label: "OK"        },
          { key: "low",          label: "Stock bas" },
          { key: "critical",     label: "Critiques" },
          { key: "out_of_stock", label: "Ruptures"  },
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
        emptyText={
          isAdmin && !selectedShop
            ? "Sélectionnez une boutique ou consultez en mode lecture"
            : "Aucun stock trouvé"
        }
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Produit, SKU..."
      />
    </div>
  );
}
