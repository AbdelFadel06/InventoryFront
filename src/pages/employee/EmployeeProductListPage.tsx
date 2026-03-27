// src/pages/employee/EmployeeProductListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { productService }      from "../../services/productService";
import { PageHeader, DataTable, Badge, Icon } from "../../components/ui";
import type { Product }        from "../../types/product";

const UNIT_LABELS: Record<string, string> = {
  piece: "Pièce", kg: "Kg", g: "Gramme", l: "Litre",
  ml: "ml", m: "Mètre", cm: "cm", box: "Boîte", pack: "Pack", other: "Autre",
};

export default function EmployeeProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    productService.getAll()
      .then(res => setProducts(res.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category_name ?? "").toLowerCase().includes(q);
  });

  const columns = [
    {
      key: "name", label: "Produit",
      render: (row: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.primary_image ? (
            <img src={row.primary_image} style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: "1px solid #E2E8F0" }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: (row.current_stock ?? 0) === 0 ? "#FEF2F2" : row.is_low_stock ? "#FFF7ED" : "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="package" size={18} color={(row.current_stock ?? 0) === 0 ? "#DC2626" : row.is_low_stock ? "#D97706" : "#1D4ED8"} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category_name", label: "Catégorie",
      render: (row: Product) => <span style={{ fontSize: 13, color: "#64748B" }}>{row.category_name ?? "—"}</span>,
    },
    {
      key: "selling_price", label: "Prix vente",
      render: (row: Product) => (
        <span style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>
          {Number(row.selling_price).toLocaleString("fr-FR")} F
        </span>
      ),
    },
    {
      key: "current_stock", label: "Stock",
      render: (row: Product) => {
        const s = row.current_stock ?? 0;
        const color = s === 0 ? "#DC2626" : row.is_low_stock ? "#D97706" : "#15803D";
        return (
          <span style={{ fontWeight: 700, fontSize: 14, color }}>
            {s} <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8" }}>{UNIT_LABELS[row.unit] ?? row.unit}</span>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Produits" subtitle="Catalogue de votre boutique" />
      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun produit trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, SKU, catégorie..."
      />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// EmployeeStockListPage
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: exporter dans un fichier séparé src/pages/employee/EmployeeStockListPage.tsx
export function EmployeeStockListPageContent() {
  const [stocks, setStocks]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    import("../../services/stockService").then(({ stockService }) => {
      stockService.getAll()
        .then(res => setStocks(res.results ?? []))
        .finally(() => setLoading(false));
    });
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
      render: (row: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.product_image ? (
            <img src={row.product_image} style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: "1px solid #E2E8F0" }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: row.stock_status === "out_of_stock" ? "#FEF2F2" : row.stock_status === "critical" ? "#FFF7ED" : row.stock_status === "low" ? "#FEFCE8" : "#F0FDF4",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="package" size={18} />
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
      key: "quantity", label: "Quantité",
      render: (row: any) => {
        const color =
          row.stock_status === "out_of_stock" ? "#DC2626" :
          row.stock_status === "critical"     ? "#EA580C" :
          row.stock_status === "low"          ? "#D97706" : "#16A34A";
        return <span style={{ fontWeight: 700, fontSize: 16, color }}>{row.quantity}</span>;
      },
    },
    {
      key: "stock_value", label: "Valeur",
      render: (row: any) => (
        <span style={{ fontSize: 13, color: "#374151" }}>
          {row.stock_value != null ? `${Number(row.stock_value).toLocaleString("fr-FR")} F` : "—"}
        </span>
      ),
    },
    {
      key: "stock_status", label: "Statut",
      render: (row: any) => {
        const cfg: Record<string, { label: string; color: any }> = {
          ok:           { label: "OK",        color: "green"  },
          low:          { label: "Stock bas", color: "yellow" },
          critical:     { label: "Critique",  color: "orange" },
          out_of_stock: { label: "Rupture",   color: "red"    },
        };
        const s = cfg[row.stock_status] ?? { label: row.stock_status, color: "gray" };
        return <Badge label={s.label} color={s.color} />;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Stocks" subtitle="État des stocks de votre boutique" />

      {/* Mini stats */}
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
