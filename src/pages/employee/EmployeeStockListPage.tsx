// src/pages/employee/EmployeeStockListPage.tsx
import { useEffect, useState } from "react";
import { stockService }        from "../../services/stockService";
import { PageHeader, Badge, DataTable } from "../../components/ui";
import type { Stock }          from "../../types/stock";

export default function EmployeeStockListPage() {
  const [stocks, setStocks]   = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    stockService.getAll()
      .then(res => setStocks(res.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stocks.filter(s =>
    (s.product_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.product_sku  ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const outOfStock = stocks.filter(s => s.stock_status === "out_of_stock").length;
  const critical   = stocks.filter(s => s.stock_status === "critical").length;
  const low        = stocks.filter(s => s.stock_status === "low").length;

  const columns = [
    {
      key: "product_name", label: "Produit",
      render: (row: Stock) => (
        <div>
          <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.product_name}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.product_sku}</div>
        </div>
      ),
    },
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
        <span style={{ fontSize: 13, color: "#374151" }}>
          {row.stock_value != null ? `${Number(row.stock_value).toLocaleString("fr-FR")} F` : "—"}
        </span>
      ),
    },
    {
      key: "stock_status", label: "Statut",
      render: (row: Stock) => {
        const cfg: Record<string, { label: string; color: "green" | "yellow" | "orange" | "red" | "gray" }> = {
          ok:           { label: "OK",        color: "green"  },
          low:          { label: "Stock bas", color: "yellow" },
          critical:     { label: "Critique",  color: "orange" },
          out_of_stock: { label: "Rupture",   color: "red"    },
        };
        const s = cfg[row.stock_status] ?? { label: row.stock_status, color: "gray" as const };
        return <Badge label={s.label} color={s.color} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Stocks" subtitle="État des stocks de votre boutique" />

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Ruptures",  value: outOfStock, bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
          { label: "Critiques", value: critical,   bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C" },
          { label: "Stock bas", value: low,         bg: "#FEFCE8", border: "#FDE68A", color: "#D97706" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: "10px 18px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12.5, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun stock trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Produit, SKU..."
      />
    </div>
  );
}
