// src/pages/shared/ProductListPage.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { productService }       from "../../services/productService";
import { categoryService }      from "../../services/categoryService";
import { stockMovementService } from "../../services/stockService";
import { shopService }          from "../../services/shopService";
import { useAuth }              from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard } from "../../components/ui";
import type { Product }  from "../../types/product";
import type { Category } from "../../types/category";
import type { Shop }     from "../../types/shop";

const UNIT_LABELS: Record<string, string> = {
  piece: "Pièce", kg: "Kg", g: "Gramme", l: "Litre",
  ml: "ml", m: "Mètre", cm: "cm", box: "Boîte", pack: "Pack", other: "Autre",
};

// ── Dropdown action menu ───────────────────────────────────────────
interface ActionItem {
  label:    string;
  icon:     string;
  onClick:  () => void;
  danger?:  boolean;
}

function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
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
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
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
            position: "fixed", top: pos.top, right: pos.right,
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
  const [filterStatus, setFilterStatus] = useState<"all"|"active"|"inactive"|"low"|"out">("all");

  const [editModal, setEditModal]     = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [stockModal, setStockModal]   = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]   = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "", description: "", cost_price: "", selling_price: "",
    category: "", unit: "piece", minimum_stock: "", reorder_level: "", barcode: "",
  });

  const [stockForm, setStockForm] = useState({
    shop: isAdmin ? "" : String(user?.shop ?? ""),
    quantity: "", reason: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll();
      setProducts(res.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    categoryService.getAll().then(res => setCategories(res.results ?? res));
    if (isAdmin) shopService.getAll().then(res => setShops(res.results ?? res));
  }, []);

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

  // ── Handlers ──────────────────────────────────────────────────────

  const openEdit = (p: Product) => {
    setEditForm({
      name:          p.name,
      description:   p.description ?? "",
      cost_price:    String(p.cost_price),
      selling_price: String(p.selling_price),
      category:      p.category ? String(p.category) : "",
      unit:          p.unit,
      minimum_stock: String(p.minimum_stock),
      reorder_level: String(p.reorder_level),
      barcode:       p.barcode ?? "",
    });
    setModalError(null);
    setEditModal(p);
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await productService.update(editModal.id, {
        name:          editForm.name,
        description:   editForm.description || undefined,
        cost_price:    parseFloat(editForm.cost_price),
        selling_price: parseFloat(editForm.selling_price),
        category:      editForm.category ? Number(editForm.category) : undefined,
        unit:          editForm.unit as any,
        minimum_stock: parseInt(editForm.minimum_stock) || 5,
        reorder_level: parseInt(editForm.reorder_level) || 10,
        barcode:       editForm.barcode || undefined,
      });
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
    } catch {
      setModalError("Impossible de supprimer ce produit. Il est peut-être lié à des stocks ou mouvements.");
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

  const openStock = (p: Product) => {
    setStockForm({ shop: isAdmin ? "" : String(user?.shop ?? ""), quantity: "", reason: "" });
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
      key: "name", label: "Produit",
      render: (row: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: row.current_stock === 0 ? "#FEF2F2" : row.is_low_stock ? "#FFF7ED" : "#EFF6FF",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>📦</div>
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
      key: "is_active", label: "Statut",
      render: (row: Product) => <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} />,
    },
    {
      key: "actions", label: "",
      render: (row: Product) => (
        <ActionMenu items={[
          { icon: "✏️", label: "Modifier",                onClick: () => openEdit(row)                                           },
          { icon: "📦", label: "Ajouter du stock",        onClick: () => openStock(row)                                          },
          { icon: row.is_active ? "⏸️" : "▶️",
            label: row.is_active ? "Désactiver" : "Activer",
            onClick: () => handleToggle(row)                                                                                      },
          { icon: "🗑️", label: "Supprimer", danger: true, onClick: () => { setModalError(null); setDeleteModal(row); }           },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produits au total`}
        action={<Btn onClick={() => navigate(`${basePath}/products/create`)}>+ Nouveau produit</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Produits actifs"   value={active}   icon="✅" color="green"  loading={loading} />
        <StatCard label="Produits inactifs" value={inactive} icon="⏸️" color="purple" loading={loading} />
        <StatCard label="Stock bas"         value={lowStock} icon="⚠️" color="orange" loading={loading} />
        <StatCard label="Ruptures"          value={outStock} icon="🚫" color="red"    loading={loading} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",      label: "Tous"      },
          { key: "active",   label: "Actifs"    },
          { key: "inactive", label: "Inactifs"  },
          { key: "low",      label: "Stock bas" },
          { key: "out",      label: "Ruptures"  },
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
        emptyText="Aucun produit trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, SKU, catégorie..."
      />

      {/* ── Modal Modifier ─────────────────────────────────────── */}
      {editModal && (
        <Modal title={`Modifier — ${editModal.name}`} onClose={() => setEditModal(null)}>
          {modalError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
              {modalError}
            </div>
          )}
          <Field label="Nom" required>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Prix d'achat (F)" required>
              <input type="number" min="0" value={editForm.cost_price}
                onChange={e => setEditForm(f => ({ ...f, cost_price: e.target.value }))}
                style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="Prix de vente (F)" required>
              <input type="number" min="0" value={editForm.selling_price}
                onChange={e => setEditForm(f => ({ ...f, selling_price: e.target.value }))}
                style={iStyle} onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>
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
          <Field label="Description">
            <textarea value={editForm.description} rows={2}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...iStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setEditModal(null)}>Annuler</Btn>
            <Btn onClick={handleEdit} disabled={modalLoading}>{modalLoading ? "Enregistrement..." : "Enregistrer"}</Btn>
          </div>
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
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#15803D", fontWeight: 500 }}>
              🏪 {user?.shop_name}
            </div>
          )}
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
            <div style={{ fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>⚠️ Action irréversible</div>
            <div style={{ fontSize: 13.5, color: "#374151" }}>
              Vous allez supprimer <strong>{deleteModal.name}</strong> ({deleteModal.sku}).
              Cette action échouera si le produit a des stocks ou mouvements associés.
            </div>
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
