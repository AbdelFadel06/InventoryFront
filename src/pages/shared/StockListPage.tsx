// src/pages/shared/StockListPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stockService } from "../../services/stockService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon, PaginationBar } from "../../components/ui";
import { formatPrice } from "../../utils/format";
import { printStockReport } from "../../utils/stockPrint";
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
  const [filterStatus,   setFilterStatus]   = useState<StockStatus | "all">("all");
  const [filterLocation, setFilterLocation] = useState<"BOUTIQUE" | "MAGASIN" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sélection pour impression ─────────────────────────────────
  const [selection, setSelection]       = useState<Set<number>>(new Set());
  const selectionCache                  = useRef<Map<number, Stock>>(new Map());
  const [selectingAll, setSelectingAll] = useState(false);
  const [printing, setPrinting]         = useState(false);

  const fetchStocks = (page = 1, q = "", location = filterLocation) => {
    setLoading(true);
    const params: Record<string, any> = { page };
    if (q) params.search = q;
    if (location !== "all") params.location = location;
    stockService.getAll(params)
      .then(res => { setStocks(res.results ?? []); setTotalCount(res.count ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStocks(currentPage, search, filterLocation); }, [currentPage]);
  useEffect(() => { fetchStocks(1, "", "all"); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchStocks(1, val, filterLocation); }, 300);
  };

  const handleLocation = (loc: typeof filterLocation) => {
    setFilterLocation(loc);
    setCurrentPage(1);
    fetchStocks(1, search, loc);
  };

  // stock_status is a computed field — filter client-side on current page
  const displayed = filterStatus === "all" ? stocks : stocks.filter(s => s.stock_status === filterStatus);

  // ── Sélection ────────────────────────────────────────────────
  const toggleSelect = (s: Stock) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(s.id)) { next.delete(s.id); selectionCache.current.delete(s.id); }
      else { next.add(s.id); selectionCache.current.set(s.id, s); }
      return next;
    });
  };

  const allPageSelected = displayed.length > 0 && displayed.every(s => selection.has(s.id));

  const toggleSelectPage = () => {
    if (allPageSelected) {
      setSelection(prev => {
        const next = new Set(prev);
        displayed.forEach(s => { next.delete(s.id); selectionCache.current.delete(s.id); });
        return next;
      });
    } else {
      displayed.forEach(s => selectionCache.current.set(s.id, s));
      setSelection(prev => new Set([...prev, ...displayed.map(s => s.id)]));
    }
  };

  const handleSelectAll = async () => {
    setSelectingAll(true);
    try {
      const res = await stockService.getAll({ page_size: 500 });
      const all = res.results ?? [];
      all.forEach(s => selectionCache.current.set(s.id, s));
      setSelection(new Set(all.map(s => s.id)));
    } catch { /* ignore */ } finally { setSelectingAll(false); }
  };


  // ── Impression ───────────────────────────────────────────────
  const handlePrintSelection = () => {
    const toPrint = Array.from(selection)
      .map(id => selectionCache.current.get(id))
      .filter((s): s is Stock => !!s);
    if (toPrint.length) printStockReport(toPrint, user?.shop_name ?? "");
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    try {
      const res = await stockService.getAll({ page_size: 500 });
      if (res.results?.length) printStockReport(res.results, user?.shop_name ?? "");
    } catch { /* ignore */ } finally { setPrinting(false); }
  };

  const outOfStock = stocks.filter(s => s.stock_status === "out_of_stock").length;
  const critical   = stocks.filter(s => s.stock_status === "critical").length;
  const low        = stocks.filter(s => s.stock_status === "low").length;
  const ok         = stocks.filter(s => s.stock_status === "ok").length;

  const columns = [
    {
      key: "sel", label: (
        <input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage}
          title={allPageSelected ? "Désélectionner la page" : "Sélectionner la page"}
          style={{ cursor: "pointer", width: 15, height: 15 }} />
      ) as any,
      render: (row: Stock) => (
        <input type="checkbox" checked={selection.has(row.id)} onChange={() => toggleSelect(row)}
          style={{ cursor: "pointer", width: 15, height: 15 }} />
      ),
    },
    {
      key: "product_name", label: "Produit",
      render: (row: Stock) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.product_image ? (
            <img src={row.product_image} style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
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
          )}
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
      key: "location", label: "Emplacement",
      render: (row: Stock) => (
        <Badge
          label={row.location === "MAGASIN" ? "Magasin" : "Boutique"}
          color={row.location === "MAGASIN" ? "blue" : "green"}
        />
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
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={filterLocation}
          onChange={e => handleLocation(e.target.value as typeof filterLocation)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", fontSize: 13, color: "#0F172A",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">Tous les emplacements</option>
          <option value="BOUTIQUE">Boutique</option>
          <option value="MAGASIN">Magasin</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as StockStatus | "all")}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", fontSize: 13, color: "#0F172A",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="ok">OK</option>
          <option value="low">Stock bas</option>
          <option value="critical">Critiques</option>
          <option value="out_of_stock">Ruptures</option>
        </select>
      </div>

      {/* ── Panneau impression rapport stock ──────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: "10px 14px", marginBottom: 14,
      }}>
        <button
          onClick={handleSelectAll}
          disabled={selectingAll}
          style={{
            padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
            background: "#fff", color: "#0F172A", border: "1px solid #CBD5E1",
            cursor: selectingAll ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
          {selectingAll ? "Chargement…" : "Sélectionner tout"}
        </button>

        {selection.size > 0 && (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
              {selection.size} sélectionné{selection.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={handlePrintSelection}
              style={{
                padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
                background: "#15803D", color: "#fff", border: "none",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              Imprimer rapport ({selection.size})
            </button>
          </>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handlePrintAll}
            disabled={printing}
            style={{
              padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
              background: printing ? "#86EFAC" : "#DCFCE7", color: "#15803D",
              border: "1px solid #BBF7D0", cursor: printing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}>
            {printing ? "Chargement…" : "Tout imprimer"}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={displayed}
        loading={loading}
        emptyText="Aucun stock trouvé"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Produit, SKU, boutique..."
      />
      <PaginationBar currentPage={currentPage} totalCount={totalCount} onPage={setCurrentPage} />
    </div>
  );
}
