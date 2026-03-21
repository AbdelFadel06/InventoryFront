// src/pages/shared/ProductListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard } from "../../components/ui";
import type { Product } from "../../types/product";

const UNIT_LABELS: Record<string, string> = {
  piece: "Pièce", kg: "Kg", g: "Gramme", l: "Litre",
  ml: "ml", m: "Mètre", cm: "cm", box: "Boîte", pack: "Pack", other: "Autre",
};

export default function ProductListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "low" | "out">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll();
      setProducts(res.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await productService.toggleActive(product.id);
      await fetchProducts();
    } finally {
      setTogglingId(null);
    }
  };

  // Stats
  const active   = products.filter(p => p.is_active).length;
  const inactive = products.filter(p => !p.is_active).length;
  const lowStock = products.filter(p => p.is_low_stock).length;
  const outStock = products.filter(p => p.current_stock === 0).length;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)  ||
      (p.category_name ?? "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all"      ? true :
      filterStatus === "active"   ? p.is_active :
      filterStatus === "inactive" ? !p.is_active :
      filterStatus === "low"      ? p.is_low_stock :
      filterStatus === "out"      ? p.current_stock === 0 : true;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: "name", label: "Produit",
      render: (row: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>
            📦
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category_name", label: "Catégorie",
      render: (row: Product) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {row.category_name ?? "—"}
        </span>
      ),
    },
    {
      key: "cost_price", label: "Prix achat",
      render: (row: Product) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {Number(row.cost_price).toLocaleString("fr-FR")} F
        </span>
      ),
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
      key: "margin", label: "Marge",
      render: (row: Product) => {
        const margin = row.cost_price > 0
          ? Math.round(((row.selling_price - row.cost_price) / row.cost_price) * 100)
          : 0;
        return (
          <span style={{
            fontWeight: 600, fontSize: 12.5,
            color: margin >= 20 ? "#15803D" : margin >= 0 ? "#92400E" : "#DC2626",
            background: margin >= 20 ? "#F0FDF4" : margin >= 0 ? "#FFF7ED" : "#FEF2F2",
            padding: "3px 8px", borderRadius: 6,
          }}>
            {margin}%
          </span>
        );
      },
    },
    {
      key: "current_stock", label: "Stock",
      render: (row: Product) => {
        const s = row.current_stock ?? 0;
        const color = s === 0 ? "#DC2626" : row.is_low_stock ? "#D97706" : "#15803D";
        return (
          <span style={{ fontWeight: 700, fontSize: 14, color }}>
            {s} <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8" }}>
              {UNIT_LABELS[row.unit] ?? row.unit}
            </span>
          </span>
        );
      },
    },
    {
      key: "is_active", label: "Statut",
      render: (row: Product) => (
        <Badge
          label={row.is_active ? "Actif" : "Inactif"}
          color={row.is_active ? "green" : "gray"}
        />
      ),
    },
    {
      key: "actions", label: "",
      render: (row: Product) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Btn
            size="sm"
            variant={row.is_active ? "danger" : "secondary"}
            disabled={togglingId === row.id}
            onClick={() => handleToggle(row)}
          >
            {togglingId === row.id ? "..." : row.is_active ? "Désactiver" : "Activer"}
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produits au total`}
        action={
          <Btn onClick={() => navigate(`${basePath}/products/create`)}>
            + Nouveau produit
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="Produits actifs"   value={active}   icon="✅" color="green"  loading={loading} />
        <StatCard label="Produits inactifs" value={inactive} icon="⏸️" color="purple" loading={loading} />
        <StatCard label="Stock bas"         value={lowStock} icon="⚠️" color="orange" loading={loading} />
        <StatCard label="Ruptures"          value={outStock} icon="🚫" color="red"    loading={loading} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",      label: "Tous"      },
          { key: "active",   label: "Actifs"    },
          { key: "inactive", label: "Inactifs"  },
          { key: "low",      label: "Stock bas" },
          { key: "out",      label: "Ruptures"  },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key as any)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterStatus === f.key ? 600 : 400,
              background: filterStatus === f.key ? "#0F172A" : "#fff",
              color:      filterStatus === f.key ? "#fff"    : "#64748B",
              border:     filterStatus === f.key ? "none"    : "1px solid #E2E8F0",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun produit trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, SKU, catégorie..."
        actions={
          <Btn variant="secondary" size="sm" onClick={() => navigate(`${basePath}/stocks/add`)}>
            📦 Ajouter stock
          </Btn>
        }
      />
    </div>
  );
}
