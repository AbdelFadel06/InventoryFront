// src/pages/warehouse/WarehouseTransferPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { stockTransferService, stockService } from "../../services/stockService";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, Icon } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import type { Product } from "../../types/product";
import type { StockTransfer } from "../../types/stock";

// ── Couleurs statut ──────────────────────────────────────────────
const STATUS_COLOR: Record<string, "yellow" | "blue" | "green" | "red"> = {
  pending:    "yellow",
  in_transit: "blue",
  received:   "green",
  cancelled:  "red",
};
const STATUS_LABEL: Record<string, string> = {
  pending:    "En attente",
  in_transit: "En transit",
  received:   "Reçu",
  cancelled:  "Annulé",
};

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box" as const,
  background: "#fff",
};

const Field = ({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
  </div>
);

export default function WarehouseTransferPage() {
  const navigate       = useNavigate();
  const routerLocation = useLocation();
  const { user }       = useAuth();

  const routeState = routerLocation.state as { product?: number; shop?: number } | null;
  const isNewForm  = routerLocation.pathname.endsWith("/new");

  const [view, setView] = useState<"list" | "new">(isNewForm ? "new" : "list");
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const [form, setForm] = useState({
    product:  routeState?.product ? String(routeState.product) : "",
    quantity: "",
    notes:    "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const loadTransfers = () => {
    setLoading(true);
    stockTransferService.getAll({ transfer_type: "warehouse" })
      .then(res => setTransfers(res.results ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransfers();
    if (user?.shop) productService.getAll({ shop: user.shop }).then(res => setProducts(res.results ?? []));
  }, [user?.shop]);

  useEffect(() => {
    if (!form.product || !user?.shop) { setCurrentStock(null); return; }
    stockService.getAll({ product: form.product, shop: user.shop, location: "MAGASIN" })
      .then(res => {
        const s = (res.results ?? []).find(
          (st: any) => String(st.product) === form.product && st.location === "MAGASIN"
        );
        setCurrentStock(s ? s.quantity : 0);
      })
      .catch(() => setCurrentStock(null));
  }, [form.product]);

  const handleCreate = async () => {
    setError(null);
    if (!form.product || !form.quantity) {
      setError("Produit et quantité sont obligatoires.");
      return;
    }
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) { setError("Quantité invalide."); return; }
    if (!user?.shop) { setError("Compte non associé à une boutique."); return; }

    setSubmitting(true);
    try {
      await stockTransferService.create({
        transfer_type: "warehouse",
        from_shop:     user.shop,
        to_shop:       user.shop,  // même boutique — overridden by backend
        product:       Number(form.product),
        quantity:      qty,
        notes:         form.notes || undefined,
      });
      setForm({ product: "", quantity: "", notes: "" });
      setView("list");
      loadTransfers();
    } catch (e: any) {
      const data = e?.response?.data;
      setError(data?.quantity?.[0] ?? data?.error ?? data?.detail ?? "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: number) => {
    setActioning(id);
    try {
      await stockTransferService.send(id);
      loadTransfers();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Erreur lors de l'envoi.");
    } finally {
      setActioning(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Annuler ce transfert ?")) return;
    setActioning(id);
    try {
      await stockTransferService.cancel(id);
      loadTransfers();
    } finally {
      setActioning(null);
    }
  };

  const columns = [
    {
      key: "reference", label: "Référence",
      render: (row: StockTransfer) => (
        <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 5 }}>
          {row.reference}
        </span>
      ),
    },
    {
      key: "product_name", label: "Produit",
      render: (row: StockTransfer) => (
        <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>{row.product_name}</span>
      ),
    },
    {
      key: "quantity", label: "Quantité",
      render: (row: StockTransfer) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>{row.quantity}</span>
      ),
    },
    {
      key: "status", label: "Statut",
      render: (row: StockTransfer) => (
        <Badge label={STATUS_LABEL[row.status] ?? row.status} color={STATUS_COLOR[row.status] ?? "yellow"} />
      ),
    },
    {
      key: "created_at", label: "Date",
      render: (row: StockTransfer) => (
        <span style={{ fontSize: 12.5, color: "#64748B" }}>{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (row: StockTransfer) => (
        <div style={{ display: "flex", gap: 6 }}>
          {row.status === "pending" && (
            <Btn size="sm" variant="primary"
              disabled={actioning === row.id}
              onClick={() => handleSend(row.id)}>
              {actioning === row.id ? "..." : "Envoyer"}
            </Btn>
          )}
          {row.status === "in_transit" && (
            <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 500 }}>
              En attente de réception
            </span>
          )}
          {row.status === "received" && (
            <span style={{ fontSize: 12, color: "#15803D", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="check" size={12} color="#15803D" /> Reçu
            </span>
          )}
          {["pending", "in_transit"].includes(row.status) && (
            <Btn size="sm" variant="danger"
              disabled={actioning === row.id}
              onClick={() => handleCancel(row.id)}>
              Annuler
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transferts Magasin → Boutique"
        subtitle="Transférer des marchandises du magasin vers la boutique"
        action={
          <div style={{ display: "flex", gap: 10 }}>
            {view === "list" ? (
              <Btn onClick={() => setView("new")}>+ Nouveau transfert</Btn>
            ) : (
              <Btn variant="secondary" onClick={() => { setView("list"); setError(null); }}>← Liste</Btn>
            )}
          </div>
        }
      />

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {view === "new" ? (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "10px 14px", background: "#EFF6FF", borderRadius: 10 }}>
              <Icon name="info" size={16} color="#1D4ED8" />
              <span style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 500 }}>
                Les marchandises seront déduites du magasin après envoi, et ajoutées à la boutique après réception.
              </span>
            </div>

            <Field label="Produit" required>
              <select value={form.product} onChange={e => set("product")(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}>
                <option value="">Sélectionner un produit</option>
                {products.filter(p => p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
                ))}
              </select>
              {currentStock !== null && (
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 6, marginBottom: 0 }}>
                  Stock disponible en magasin : <strong style={{ color: currentStock === 0 ? "#DC2626" : "#0F172A" }}>{currentStock}</strong>
                </p>
              )}
            </Field>

            <Field label="Quantité à transférer" required>
              <input
                type="number" min={1} max={currentStock ?? undefined}
                value={form.quantity}
                onChange={e => set("quantity")(e.target.value)}
                placeholder="0"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={e => set("notes")(e.target.value)}
                placeholder="Remarques sur ce transfert..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </Field>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => { setView("list"); setError(null); }}>Annuler</Btn>
              <Btn onClick={handleCreate} disabled={submitting}>
                {submitting ? "Création..." : "Créer le transfert"}
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={transfers}
          loading={loading}
          emptyText="Aucun transfert pour le moment"
        />
      )}
    </div>
  );
}
