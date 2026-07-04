// src/pages/shared/ProductListPage.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { productService }       from "../../services/productService";
import { categoryService }      from "../../services/categoryService";
import { stockMovementService } from "../../services/stockService";
import { shopService }          from "../../services/shopService";
import { useAuth }              from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import { uploadToCloudinary }   from "../../utils/cloudinary";
import { printBarcodeLabels, printAllBarcodeLabels } from "../../utils/barcodePrint";
import type { Product, ProductImage }  from "../../types/product";
import type { Category } from "../../types/category";
import type { Shop }     from "../../types/shop";

const UNIT_LABELS: Record<string, string> = {
  piece: "Pièce", kg: "Kg", g: "Gramme", l: "Litre",
  ml: "ml", m: "Mètre", cm: "cm", box: "Boîte", pack: "Pack", other: "Autre",
};

// ── Dropdown action menu ───────────────────────────────────────────
interface ActionItem {
  label:    string;
  icon:     React.ReactNode;
  onClick:  () => void;
  danger?:  boolean;
}

function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest("[data-action-menu]")?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownHeight = items.length * 41 + 8; // ~41px par item
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = window.innerWidth - rect.right;
      if (spaceBelow < dropdownHeight + 12) {
        // Pas assez de place en bas → ouvrir vers le haut
        setPos({ bottom: window.innerHeight - rect.top + 6, right });
      } else {
        setPos({ top: rect.bottom + 6, right });
      }
    }
    setOpen(o => !o);
  };

  return (
    <div data-action-menu="" style={{ display: "inline-block" }}>
      <button ref={btnRef} onClick={handleOpen}
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: "1px solid #E2E8F0", background: open ? "#F1F5F9" : "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#64748B", fontFamily: "inherit", letterSpacing: 2,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#fff"; }}
      >···</button>

      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{
            position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right,
            background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 180, zIndex: 999, overflow: "hidden",
            animation: "fadeIn 0.1s ease",
          }}>
            {items.map((item, i) => (
              <button key={i}
                onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13.5, fontFamily: "inherit", textAlign: "left",
                  color: item.danger ? "#DC2626" : "#374151",
                  borderBottom: i < items.length - 1 ? "1px solid #F8FAFC" : "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = item.danger ? "#FEF2F2" : "#F8FAFC")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 300,
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      width: "100%", maxWidth: 500,
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      maxHeight: "90vh", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 22, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const iStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", background: "#fff",
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
  </div>
);

export default function ProductListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin  = user?.role === "SUPER_ADMIN";
  const basePath = isAdmin ? "/admin" : "/manager";

  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops]           = useState<Shop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState<"all"|"active"|"inactive"|"low"|"out"|"no_barcode"|"duplicates">("all");
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const PAGE_SIZE = 10;

  // Stats (loaded separately so they're accurate across all pages)
  const [statsData, setStatsData]         = useState({ total: 0, active: 0, inactive: 0 });
  const [lowStockProds, setLowStockProds] = useState<Product[]>([]);
  const [outStockProds, setOutStockProds] = useState<Product[]>([]);
  const [noBarcodeCount, setNoBarcodeCount] = useState(0);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [selection, setSelection]         = useState<Set<number>>(new Set());
  const selectionCache                    = useRef<Map<number, Product>>(new Map());
  const [copies, setCopies]               = useState(1);
  const [selectingAll, setSelectingAll]   = useState(false);
  const [printingLabels, setPrintingLabels] = useState(false);

  const [editModal, setEditModal]     = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [stockModal, setStockModal]   = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]   = useState<string | null>(null);
  const [fetchingEdit, setFetchingEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "", description: "", selling_price: "",
    category: "", unit: "piece", minimum_stock: "", reorder_level: "", barcode: "",
  });

  // Edit modal image state
  const [editImages, setEditImages]               = useState<ProductImage[]>([]);
  const [editNewUrls, setEditNewUrls]             = useState<string[]>([]);
  const [editRemovedIds, setEditRemovedIds]       = useState<number[]>([]);
  const [editUploadingImg, setEditUploadingImg]   = useState(false);
  const [editUploadError, setEditUploadError]     = useState<string | null>(null);

  const [stockForm, setStockForm] = useState({
    shop: isAdmin ? "" : String(user?.shop ?? ""),
    quantity: "", reason: "", location: "BOUTIQUE",
  });

  const matchesSearch = (p: Product, q: string) => {
    const lq = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(lq) ||
      p.sku.toLowerCase().includes(lq)  ||
      (p.barcode ?? "").toLowerCase().includes(lq) ||
      (p.category_name ?? "").toLowerCase().includes(lq)
    );
  };

  const fetchProducts = async (page = currentPage, q = search, status = filterStatus) => {
    setLoading(true);
    try {
      if (status === "low") {
        const list = q ? lowStockProds.filter(p => matchesSearch(p, q)) : lowStockProds;
        setProducts(list);
        setTotalCount(0);
      } else if (status === "out") {
        const list = q ? outStockProds.filter(p => matchesSearch(p, q)) : outStockProds;
        setProducts(list);
        setTotalCount(0);
      } else if (status === "duplicates") {
        const res = await productService.findDuplicates();
        const list = q ? res.results.filter(p => matchesSearch(p, q)) : res.results;
        setProducts(list);
        setDuplicateCount(res.count);
        setTotalCount(0);
      } else {
        const params: Record<string, unknown> = { page };
        if (q)                   params.search     = q;
        if (status === "active") params.is_active  = true;
        if (status === "inactive") params.is_active = false;
        if (status === "no_barcode") params.has_barcode = false;
        const res = await productService.getAll(params);
        setProducts(res.results ?? []);
        setTotalCount(res.count ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load stats + special lists once at mount
  useEffect(() => {
    Promise.all([
      productService.getStatistics(),
      productService.getLowStock(),
      productService.getOutOfStock(),
      productService.getAll({ has_barcode: false, page_size: 1 }),
      productService.findDuplicates(),
    ]).then(([s, l, o, nb, dup]) => {
      setStatsData({ total: s.total_products, active: s.active_products, inactive: s.inactive_products });
      setLowStockProds(l.products);
      setOutStockProds(o.products);
      setNoBarcodeCount(nb.count ?? 0);
      setDuplicateCount(dup.count);
    });
    categoryService.getAll().then(res => setCategories(res.results ?? res));
    if (isAdmin) shopService.getAll().then(res => setShops(res.results ?? res));
  }, []);

  // Re-fetch when page changes
  useEffect(() => {
    fetchProducts(currentPage, search, filterStatus);
  }, [currentPage]);

  // Debounce search → server-side
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts(1, val, filterStatus);
    }, 300);
  };

  const handleFilterStatus = (status: typeof filterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
    fetchProducts(1, search, status);
  };

  const active    = statsData.active;
  const inactive  = statsData.inactive;
  const lowStock  = lowStockProds.length;
  const outStock  = outStockProds.length;
  const noBarcode = noBarcodeCount;

  // ── Handlers ──────────────────────────────────────────────────────

  const openEdit = async (p: Product) => {
    setEditModal(p);
    setFetchingEdit(true);
    setModalError(null);
    setEditNewUrls([]);
    setEditRemovedIds([]);
    setEditUploadError(null);
    try {
      const full = await productService.getById(p.id);
      setEditForm({
        name:          full.name,
        description:   full.description ?? "",
        selling_price: String(full.selling_price),
        category:      full.category ? String(full.category) : "",
        unit:          full.unit,
        minimum_stock: String(full.minimum_stock ?? ""),
        reorder_level: String(full.reorder_level ?? ""),
        barcode:       full.barcode ?? "",
      });
      setEditImages(full.images ?? []);
    } catch {
      setModalError("Erreur lors du chargement du produit.");
    } finally {
      setFetchingEdit(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await productService.update(editModal.id, {
        name:          editForm.name,
        description:   editForm.description || undefined,
        selling_price: parseFloat(editForm.selling_price),
        category:      editForm.category ? Number(editForm.category) : undefined,
        unit:          editForm.unit as any,
        minimum_stock: parseInt(editForm.minimum_stock) || 5,
        reorder_level: parseInt(editForm.reorder_level) || 10,
        barcode:       editForm.barcode || undefined,
      });
      // Remove deleted images
      await Promise.all(editRemovedIds.map(imgId => productService.removeImage(editModal.id, imgId)));
      // Add new images
      const hasPrimary = editImages.filter(i => !editRemovedIds.includes(i.id)).some(i => i.is_primary);
      for (let i = 0; i < editNewUrls.length; i++) {
        await productService.addImage(editModal.id, editNewUrls[i], !hasPrimary && i === 0);
      }
      setEditModal(null);
      await fetchProducts();
    } catch (e: any) {
      const data = e?.response?.data;
      setModalError(data?.selling_price?.[0] ?? data?.name?.[0] ?? data?.detail ?? "Erreur lors de la modification.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await productService.delete(deleteModal.id);
      setDeleteModal(null);
      await fetchProducts();
      productService.findDuplicates().then(r => setDuplicateCount(r.count));
    } catch (e: any) {
      const msg = e?.response?.data?.error;
      setModalError(msg ?? "Impossible de supprimer ce produit. Il est peut-être lié à des stocks ou mouvements.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await productService.toggleActive(p.id);
      await fetchProducts();
    } catch { console.error("Erreur toggle"); }
  };


  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      const { barcodes } = await productService.generateAllBarcodes(true);
      const map: Record<number, string> = {};
      barcodes.forEach(b => { map[b.id] = b.barcode; });
      setProducts(prev => {
        const updated = prev.map(p => map[p.id] ? { ...p, barcode: map[p.id] } : p);
        // Cache updated products so they can be printed immediately
        updated.forEach(p => { if (map[p.id]) selectionCache.current.set(p.id, p); });
        return updated;
      });
      setSelection(new Set(barcodes.map(b => b.id)));
      setNoBarcodeCount(0);
    } catch { /* ignore */ } finally {
      setGeneratingAll(false);
    }
  };

  const handleGenerateBarcodeSingle = async (p: Product) => {
    try {
      const { barcode } = await productService.generateBarcode(p.id, true);
      const updated = { ...p, barcode };
      setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
      selectionCache.current.set(p.id, updated);
      setSelection(prev => new Set([...prev, p.id]));
      setNoBarcodeCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  // ── Selection helpers ─────────────────────────────────────────────
  const toggleSelect = (p: Product) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
        selectionCache.current.delete(p.id);
      } else {
        next.add(p.id);
        selectionCache.current.set(p.id, p);
      }
      return next;
    });
  };

  const allPageSelected = products.length > 0 && products.every(p => selection.has(p.id));

  const toggleSelectPage = () => {
    if (allPageSelected) {
      setSelection(prev => {
        const next = new Set(prev);
        products.forEach(p => { next.delete(p.id); selectionCache.current.delete(p.id); });
        return next;
      });
    } else {
      products.forEach(p => selectionCache.current.set(p.id, p));
      setSelection(prev => new Set([...prev, ...products.map(p => p.id)]));
    }
  };

  const handleSelectAllFromDB = async () => {
    setSelectingAll(true);
    try {
      const res = await productService.getAll({ page_size: 500 });
      const all = res.results ?? [];
      all.forEach(p => selectionCache.current.set(p.id, p));
      setSelection(new Set(all.map(p => p.id)));
    } catch { /* ignore */ } finally {
      setSelectingAll(false);
    }
  };

  // ── Label printing ────────────────────────────────────────────────
  const selLabelCount = Array.from(selection).filter(id => selectionCache.current.get(id)?.barcode).length;

  const handlePrintLabels = () => {
    const toPrint = Array.from(selection)
      .map(id => selectionCache.current.get(id))
      .filter((p): p is Product => !!p && !!p.barcode)
      .map(p => ({ id: p.id, name: p.name, barcode: p.barcode! }));
    if (!toPrint.length) return;
    printAllBarcodeLabels(toPrint, copies);
  };

  const handlePrintAllLabels = async () => {
    setPrintingLabels(true);
    try {
      const res = await productService.getAll({ has_barcode: true, page_size: 500 });
      const toPrint = (res.results ?? []).filter(p => p.barcode);
      if (toPrint.length) {
        printAllBarcodeLabels(toPrint.map(p => ({ id: p.id, name: p.name, barcode: p.barcode! })), copies);
      }
    } catch { /* ignore */ } finally {
      setPrintingLabels(false);
    }
  };


  const openStock = (p: Product) => {
    setStockForm({ shop: isAdmin ? "" : String(user?.shop ?? ""), quantity: "", reason: "", location: "BOUTIQUE" });
    setModalError(null);
    setStockModal(p);
  };

  const handleAddStock = async () => {
    if (!stockModal) return;
    if (!stockForm.shop || !stockForm.quantity) {
      setModalError("Boutique et quantité sont obligatoires.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      await stockMovementService.addStock({
        product:       stockModal.id,
        shop:          Number(stockForm.shop),
        location:      stockForm.location as "BOUTIQUE" | "MAGASIN",
        movement_type: "entry",
        quantity:      Number(stockForm.quantity),
        reason:        stockForm.reason || undefined,
      });
      setStockModal(null);
      await fetchProducts();
    } catch (e: any) {
      setModalError(e?.response?.data?.error ?? "Erreur lors de l'ajout de stock.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: "print_select", label: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectPage}
          title={allPageSelected ? "Désélectionner la page" : "Sélectionner toute la page"}
          style={{ cursor: "pointer", width: 15, height: 15 }}
        />
      ) as any,
      render: (row: Product) => (
        <input
          type="checkbox"
          checked={selection.has(row.id)}
          onChange={() => toggleSelect(row)}
          style={{ cursor: "pointer", width: 15, height: 15 }}
        />
      ),
    },
    {
      key: "name", label: "Produit",
      render: (row: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {row.primary_image ? (
            <img src={row.primary_image} alt={row.name} style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              objectFit: "cover", border: "1px solid #E2E8F0",
            }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: row.current_stock === 0 ? "#FEF2F2" : row.is_low_stock ? "#FFF7ED" : "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="package" size={18} color={row.current_stock === 0 ? "#DC2626" : row.is_low_stock ? "#D97706" : "#1D4ED8"} /></div>
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
    {
      key: "barcode", label: "Code-barres",
      render: (row: Product) => row.barcode ? (
        <span style={{ fontSize: 12, color: "#374151", fontFamily: "monospace", background: "#F1F5F9", padding: "3px 8px", borderRadius: 5 }}>
          {row.barcode}
        </span>
      ) : (
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>—</span>
      ),
    },
    {
      key: "is_active", label: "Statut",
      render: (row: Product) => <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} />,
    },
    {
      key: "actions", label: "",
      render: (row: Product) => (
        <ActionMenu items={[
          { icon: <Icon name="edit"    size={15} color="#374151" />, label: "Modifier",          onClick: () => openEdit(row)                                       },
          { icon: <Icon name="package" size={15} color="#374151" />, label: "Ajouter du stock",  onClick: () => openStock(row)                                      },
          row.barcode
            ? { icon: <Icon name="target" size={15} color="#1D4ED8" />, label: "Imprimer étiquettes",
                onClick: () => printBarcodeLabels({ id: row.id, name: row.name, barcode: row.barcode! }, copies) }
            : { icon: <Icon name="plus"   size={15} color="#7C3AED" />, label: "Générer code-barres",
                onClick: () => handleGenerateBarcodeSingle(row) },
          { icon: <Icon name={row.is_active ? "xCircle" : "checkCircle"} size={15} color="#374151" />,
            label: row.is_active ? "Désactiver" : "Activer",
            onClick: () => handleToggle(row) },
          { icon: <Icon name="trash" size={15} color="#DC2626" />, label: "Supprimer", danger: true,
            onClick: () => { setModalError(null); setDeleteModal(row); } },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${statsData.total} produits au total`}
        action={<Btn onClick={() => navigate(`${basePath}/products/create`)}>+ Nouveau produit</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Produits actifs"   value={active}   icon={<Icon name="checkCircle" size={22} />} color="green"  loading={loading} />
        <StatCard label="Produits inactifs" value={inactive} icon={<Icon name="xCircle"     size={22} />} color="purple" loading={loading} />
        <StatCard label="Stock bas"         value={lowStock} icon={<Icon name="warning"      size={22} />} color="orange" loading={loading} />
        <StatCard label="Ruptures"          value={outStock} icon={<Icon name="package"      size={22} />} color="red"    loading={loading} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={filterStatus}
          onChange={e => handleFilterStatus(e.target.value as typeof filterStatus)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", fontSize: 13, color: "#0F172A",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">Tous les produits</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
          <option value="low">Stock bas</option>
          <option value="out">Ruptures</option>
          <option value="no_barcode">Sans code-barres{noBarcodeCount > 0 ? ` (${noBarcodeCount})` : ""}</option>
          <option value="duplicates">Doublons{duplicateCount > 0 ? ` (${duplicateCount})` : ""}</option>
        </select>

        {filterStatus === "no_barcode" && (
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: generatingAll ? "#C4B5FD" : "#7C3AED", color: "#fff",
              border: "none", cursor: generatingAll ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
            }}>
            {generatingAll ? "Génération…" : `Générer EAN-13 (${noBarcodeCount})`}
          </button>
        )}
      </div>

      {/* ── Panneau étiquettes ───────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: "10px 14px", marginBottom: 14,
      }}>
        <button
          onClick={handleSelectAllFromDB}
          disabled={selectingAll}
          style={{
            padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
            background: "#fff", color: "#0F172A", border: "1px solid #CBD5E1",
            cursor: selectingAll ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
          {selectingAll ? "Chargement…" : "Sélectionner tout"}
        </button>

        {selection.size > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            {selection.size} sélectionné{selection.size > 1 ? "s" : ""}
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>Copies :</span>
          <input
            type="number" min={1} max={99} value={copies}
            onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: 54, padding: "3px 7px", borderRadius: 6, fontSize: 13, textAlign: "center",
              border: "1px solid #CBD5E1", fontFamily: "inherit",
            }}
          />
          {selLabelCount > 0 && (
            <button onClick={handlePrintLabels} style={{
              padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
              background: "#1D4ED8", color: "#fff", border: "none",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Imprimer étiquettes ({selLabelCount})
            </button>
          )}
          <button onClick={handlePrintAllLabels} disabled={printingLabels} style={{
            padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
            background: printingLabels ? "#93C5FD" : "#DBEAFE", color: "#1D4ED8",
            border: "1px solid #BFDBFE", cursor: printingLabels ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}>
            {printingLabels ? "Chargement…" : "Tout imprimer"}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={products}
        loading={loading}
        emptyText="Aucun produit trouvé"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Nom, SKU, catégorie..."
        rowStyle={(row: Product) =>
          row.current_stock === 0 ? { background: "#FEF2F2" } :
          row.is_low_stock       ? { background: "#FFF7F7" } :
          {}
        }
      />

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!["low", "out"].includes(filterStatus) && totalCount > PAGE_SIZE && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, marginTop: 20,
        }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
              background: currentPage <= 1 ? "#F1F5F9" : "#0F172A",
              color: currentPage <= 1 ? "#94A3B8" : "#fff",
              border: "none", cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 13.5, color: "#64748B", fontWeight: 500 }}>
            Page {currentPage} / {Math.ceil(totalCount / PAGE_SIZE)}
            <span style={{ color: "#94A3B8", fontWeight: 400, marginLeft: 6 }}>
              ({totalCount} produits)
            </span>
          </span>
          <button
            disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
              background: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? "#F1F5F9" : "#0F172A",
              color: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? "#94A3B8" : "#fff",
              border: "none", cursor: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}>
            Suivant →
          </button>
        </div>
      )}

      {/* ── Modal Modifier ─────────────────────────────────────── */}
      {editModal && (
        <Modal title={`Modifier — ${editModal.name}`} onClose={() => setEditModal(null)}>
          {fetchingEdit ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 14 }}>
              Chargement des données...
            </div>
          ) : (
          <>
          {modalError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {modalError}
            </div>
          )}
          <Field label="Nom" required>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <Field label="Prix de vente (F)" required>
            <input type="number" min="0" value={editForm.selling_price}
              onChange={e => setEditForm(f => ({ ...f, selling_price: e.target.value }))}
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Catégorie">
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...iStyle, cursor: "pointer" }}>
                <option value="">Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Unité">
              <select value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                style={{ ...iStyle, cursor: "pointer" }}>
                {[["piece","Pièce"],["kg","Kg"],["g","Gramme"],["l","Litre"],["ml","ml"],["m","Mètre"],["box","Boîte"],["pack","Pack"],["other","Autre"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Stock minimum">
              <input type="number" min="0" value={editForm.minimum_stock}
                onChange={e => setEditForm(f => ({ ...f, minimum_stock: e.target.value }))}
                style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="Niveau réappro">
              <input type="number" min="0" value={editForm.reorder_level}
                onChange={e => setEditForm(f => ({ ...f, reorder_level: e.target.value }))}
                style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>
          <Field label="Code-barres">
            <input value={editForm.barcode}
              onChange={e => setEditForm(f => ({ ...f, barcode: e.target.value }))}
              placeholder="Ex: 3700123456789"
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <Field label="Description">
            <textarea value={editForm.description} rows={2}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...iStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          {/* ── Images ───────────────────────────────── */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Photos du produit
            </label>
            {/* Existing images */}
            {(editImages.length > 0 || editNewUrls.length > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {editImages.filter(img => !editRemovedIds.includes(img.id)).map(img => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img src={img.url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover",
                      border: img.is_primary ? "2px solid #3B82F6" : "1px solid #E2E8F0" }} />
                    {img.is_primary && (
                      <span style={{ position: "absolute", bottom: 2, left: 2, background: "#1D4ED8", color: "#fff",
                        fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 4px" }}>PRINC.</span>
                    )}
                    <button onClick={() => setEditRemovedIds(ids => [...ids, img.id])}
                      style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%",
                        background: "rgba(220,38,38,0.85)", color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ))}
                {editNewUrls.map((url, i) => (
                  <div key={`new-${i}`} style={{ position: "relative" }}>
                    <img src={url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover",
                      border: "1px solid #BBF7D0" }} />
                    <button onClick={() => setEditNewUrls(us => us.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%",
                        background: "rgba(220,38,38,0.85)", color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", border: "2px dashed #BFDBFE", borderRadius: 10,
              cursor: editUploadingImg ? "wait" : "pointer",
              background: "#F8FAFC", color: "#3B82F6", fontSize: 13, fontWeight: 500,
            }}>
              <input type="file" accept="image/*" multiple disabled={editUploadingImg} style={{ display: "none" }}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  setEditUploadError(null);
                  setEditUploadingImg(true);
                  try {
                    const results = await Promise.all(files.map(f => uploadToCloudinary(f, "products")));
                    setEditNewUrls(prev => [...prev, ...results.map(r => r.url)]);
                  } catch (err: any) {
                    setEditUploadError(err?.message ?? "Erreur upload.");
                  } finally {
                    setEditUploadingImg(false);
                    e.target.value = "";
                  }
                }} />
              <Icon name={editUploadingImg ? "refresh" : "plus"} size={14} color="#3B82F6" />
              {editUploadingImg ? "Upload..." : "Ajouter des photos"}
            </label>
            {editUploadError && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{editUploadError}</p>}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setEditModal(null)}>Annuler</Btn>
            <Btn onClick={handleEdit} disabled={modalLoading || fetchingEdit}>{modalLoading ? "Enregistrement..." : "Enregistrer"}</Btn>
          </div>
          </>
          )}
        </Modal>
      )}

      {/* ── Modal Ajouter stock ────────────────────────────────── */}
      {stockModal && (
        <Modal title={`Ajouter stock — ${stockModal.name}`} onClose={() => setStockModal(null)}>
          {modalError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {modalError}
            </div>
          )}
          {isAdmin ? (
            <Field label="Boutique" required>
              <select value={stockForm.shop} onChange={e => setStockForm(f => ({ ...f, shop: e.target.value }))}
                style={{ ...iStyle, cursor: "pointer" }}>
                <option value="">Sélectionner une boutique</option>
                {shops.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          ) : (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#15803D", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="store" size={14} color="#15803D" /> {user?.shop_name}
            </div>
          )}
          <Field label="Emplacement" required>
            <select value={stockForm.location} onChange={e => setStockForm(f => ({ ...f, location: e.target.value }))}
              style={{ ...iStyle, cursor: "pointer" }}>
              <option value="BOUTIQUE">Boutique (espace de vente)</option>
              <option value="MAGASIN">Magasin (entrepôt)</option>
            </select>
          </Field>
          <Field label="Quantité à ajouter" required>
            <input type="number" min="1" value={stockForm.quantity}
              onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="Ex: 50"
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <Field label="Motif (optionnel)">
            <input value={stockForm.reason}
              onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Ex: Réception commande fournisseur"
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setStockModal(null)}>Annuler</Btn>
            <Btn onClick={handleAddStock} disabled={modalLoading}>{modalLoading ? "Ajout..." : "Ajouter le stock"}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Modal Supprimer ────────────────────────────────────── */}
      {deleteModal && (
        <Modal title="Confirmer la suppression" onClose={() => setDeleteModal(null)}>
          {modalError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {modalError}
            </div>
          )}
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: "#DC2626", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="warning" size={14} color="#DC2626" /> Action irréversible
            </div>
            <div style={{ fontSize: 13.5, color: "#374151", marginBottom: 6 }}>
              Vous allez supprimer <strong>{deleteModal.name}</strong> ({deleteModal.sku}).
            </div>
            {(deleteModal.current_stock ?? 0) > 0 && (
              <div style={{ fontSize: 13, color: "#92400E", background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 7, padding: "8px 12px", marginTop: 8 }}>
                ⚠️ Ce produit a encore <strong>{deleteModal.current_stock} unité(s)</strong> en stock. Retirez le stock avant de le supprimer.
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setDeleteModal(null)}>Annuler</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={modalLoading}>
              {modalLoading ? "Suppression..." : "Supprimer définitivement"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
