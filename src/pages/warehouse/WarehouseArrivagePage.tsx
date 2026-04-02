// src/pages/warehouse/WarehouseArrivagePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { stockMovementService, stockService } from "../../services/stockService";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Icon } from "../../components/ui";
import type { Product } from "../../types/product";

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
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
  </div>
);

export default function WarehouseArrivagePage() {
  const navigate       = useNavigate();
  const routerLocation = useLocation();
  const { user }       = useAuth();

  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const state = routerLocation.state as { product?: number; shop?: number } | null;

  const [form, setForm] = useState({
    product:    state?.product ? String(state.product) : "",
    quantity:   "",
    reference:  "",
    reason:     "",
    unit_price: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    productService.getAll().then(res => setProducts(res.results ?? []));
  }, []);

  useEffect(() => {
    if (!form.product || !user?.shop) { setCurrentStock(null); return; }
    stockService.getAll({ product: form.product, shop: user.shop, location: "MAGASIN" })
      .then(res => {
        const stock = (res.results ?? []).find(
          (s: any) => String(s.product) === form.product && s.location === "MAGASIN"
        );
        setCurrentStock(stock ? stock.quantity : 0);
      })
      .catch(() => setCurrentStock(null));
  }, [form.product]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.product || !form.quantity) {
      setError("Produit et quantité sont obligatoires.");
      return;
    }
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("La quantité doit être un nombre positif.");
      return;
    }
    if (!user?.shop) {
      setError("Votre compte n'est pas associé à une boutique.");
      return;
    }

    setLoading(true);
    try {
      await stockMovementService.addStock({
        product:       Number(form.product),
        shop:          user.shop,
        location:      "MAGASIN",
        quantity:      qty,
        movement_type: "entry",
        reference:     form.reference || undefined,
        reason:        form.reason    || undefined,
        unit_price:    form.unit_price ? Number(form.unit_price) : undefined,
      });
      navigate("/magasinier/stock");
    } catch (e: any) {
      const data = e?.response?.data;
      setError(data?.error ?? data?.detail ?? "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const newQty       = form.quantity !== "" ? (currentStock ?? 0) + parseInt(form.quantity || "0", 10) : null;
  const selectedProd = products.find(p => String(p.id) === form.product);

  return (
    <div>
      <PageHeader
        title="Enregistrer un arrivage"
        subtitle="Réception de marchandises en magasin"
        action={<Btn variant="secondary" onClick={() => navigate("/magasinier/stock")}>← Retour</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start", maxWidth: 820 }}>

        {/* Formulaire */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13.5, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <Field label="Produit" required>
            <select value={form.product} onChange={e => set("product")(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}>
              <option value="">Sélectionner un produit</option>
              {products.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
              ))}
            </select>
          </Field>

          <Field label="Quantité reçue" required hint="Nombre d'unités arrivées en magasin">
            <input
              type="number" min={1}
              value={form.quantity}
              onChange={e => set("quantity")(e.target.value)}
              placeholder="0"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <Field label="Référence bon de livraison" hint="Optionnel — numéro BL, facture fournisseur...">
            <input
              type="text" value={form.reference}
              onChange={e => set("reference")(e.target.value)}
              placeholder="Ex: BL-2026-001"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <Field label="Prix unitaire d'achat" hint="Optionnel — pour le calcul de valeur stock">
            <input
              type="number" min={0} step={1}
              value={form.unit_price}
              onChange={e => set("unit_price")(e.target.value)}
              placeholder="0"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <Field label="Notes / Observations">
            <textarea
              value={form.reason}
              onChange={e => set("reason")(e.target.value)}
              placeholder="Remarques sur la réception..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => navigate("/magasinier/stock")}>Annuler</Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Enregistrement..." : "Confirmer l'arrivage"}
            </Btn>
          </div>
        </div>

        {/* Panneau récapitulatif */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Aperçu magasin
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Actuel</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#64748B" }}>
                  {currentStock !== null ? currentStock : "—"}
                </div>
              </div>
              <div style={{ fontSize: 18, color: "#CBD5E1" }}>→</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Après</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#1D4ED8" }}>
                  {newQty !== null ? newQty : "—"}
                </div>
              </div>
            </div>
            {selectedProd && (
              <div style={{ fontSize: 12.5, color: "#64748B", textAlign: "center" }}>{selectedProd.name}</div>
            )}
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="info" size={14} color="#1D4ED8" />
              <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 500 }}>Stock magasin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
