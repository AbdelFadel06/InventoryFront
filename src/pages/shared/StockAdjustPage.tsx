// src/pages/shared/StockAdjustPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { stockService }    from "../../services/stockService";
import { productService }  from "../../services/productService";
import { shopService }     from "../../services/shopService";
import { useAuth }         from "../../context/AuthContext";
import { PageHeader, Btn, Icon } from "../../components/ui";
import type { Product }    from "../../types/product";
import type { Shop }       from "../../types/shop";

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

export default function StockAdjustPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, activeShop }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [products, setProducts]   = useState<Product[]>([]);
  const [shops, setShops]         = useState<Shop[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const state = location.state as { product?: number; shop?: number; location?: string } | null;

  const [form, setForm] = useState({
    product:      state?.product ? String(state.product) : "",
    shop:         state?.shop    ? String(state.shop)    :
                  activeShop    ? String(activeShop.id)  :
                  (user?.role === "SHOP_MANAGER" || user?.role === "MAGASINIER") ? String(user?.shop ?? "") : "",
    loc:          state?.location ?? (user?.role === "MAGASINIER" ? "MAGASIN" : "BOUTIQUE"),
    new_quantity: "",
    reason:       "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([productService.getAll({ page_size: 500 }), shopService.getAll()])
      .then(([pRes, sRes]) => {
        setProducts(pRes.results ?? []);
        setShops(sRes.results ?? sRes);
      });
  }, []);

  useEffect(() => {
    if (!form.product || !form.shop) { setCurrentStock(null); return; }
    stockService.getAll({ product: form.product, shop: form.shop, location: form.loc })
      .then(res => {
        const stock = (res.results ?? []).find(
          (s: any) => String(s.product) === form.product && String(s.shop) === form.shop && s.location === form.loc
        );
        setCurrentStock(stock ? stock.quantity : 0);
      })
      .catch(() => setCurrentStock(null));
  }, [form.product, form.shop, form.loc]);

  const newQty      = Number(form.new_quantity);
  const difference  = currentStock !== null && form.new_quantity !== ""
    ? newQty - currentStock : null;

  const handleSubmit = async () => {
    setError(null);
    if (!form.product || !form.shop || form.new_quantity === "") {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    if (newQty < 0) { setError("La quantité ne peut pas être négative."); return; }
    if (!form.reason.trim()) { setError("Le motif est obligatoire pour un ajustement."); return; }

    setLoading(true);
    try {
      await stockService.adjust({
        product:      Number(form.product),
        shop:         Number(form.shop),
        location:     form.loc as any,
        new_quantity: newQty,
        reason:       form.reason,
      });
      navigate(`${basePath}/stocks`);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.error)       setError(data.error);
      else if (data?.detail) setError(data.detail);
      else setError("Erreur lors de l'ajustement.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === form.product);

  return (
    <div>
      <PageHeader
        title="Ajustement de stock"
        subtitle="Définir la quantité exacte en stock"
        action={
          <Btn variant="secondary" onClick={() => navigate(`${basePath}/stocks`)}>
            ← Retour
          </Btn>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start", maxWidth: 860 }}>

        {/* Formulaire */}
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 14, padding: 28,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: 9, padding: "10px 14px",
              fontSize: 13.5, marginBottom: 20,
            }}>
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

          <Field label="Emplacement" required>
            <select value={form.loc} onChange={e => setForm(f => ({ ...f, loc: e.target.value }))}
              disabled={user?.role === "MAGASINIER"}
              style={{ ...inputStyle, opacity: user?.role === "MAGASINIER" ? 0.7 : 1 }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}>
              <option value="BOUTIQUE">Boutique</option>
              <option value="MAGASIN">Magasin</option>
            </select>
          </Field>

          <Field label="Boutique" required>
            {(user?.role === "SHOP_MANAGER" || user?.role === "MAGASINIER") ? (
              <input value={activeShop?.name ?? shops.find(s => String(s.id) === form.shop)?.name ?? ""} disabled style={{ ...inputStyle, opacity: 0.7 }} />
            ) : (
              <select value={form.shop} onChange={e => set("shop")(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}>
                <option value="">Sélectionner une boutique</option>
                {shops.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Nouvelle quantité" required
            hint="Entrez la quantité réelle comptée physiquement">
            <input
              type="number" min={0}
              value={form.new_quantity}
              onChange={e => set("new_quantity")(e.target.value)}
              placeholder={currentStock !== null ? `Stock actuel: ${currentStock}` : "0"}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <Field label="Motif de l'ajustement" required>
            <textarea
              value={form.reason}
              onChange={e => set("reason")(e.target.value)}
              placeholder="Ex: Correction après inventaire physique, erreur de saisie..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => navigate(`${basePath}/stocks`)}>
              Annuler
            </Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Ajustement..." : "Confirmer l'ajustement"}
            </Btn>
          </div>
        </div>

        {/* Panneau aperçu */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Aperçu changement */}
          <div style={{
            background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 14, padding: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Aperçu
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Actuel</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#64748B" }}>
                  {currentStock !== null ? currentStock : "—"}
                </div>
              </div>
              <div style={{ fontSize: 20, color: "#CBD5E1" }}>→</div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Nouveau</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>
                  {form.new_quantity !== "" ? newQty : "—"}
                </div>
              </div>
            </div>

            {difference !== null && form.new_quantity !== "" && (
              <div style={{
                padding: "10px 14px", borderRadius: 9, textAlign: "center",
                background: difference === 0 ? "#F8FAFC"
                  : difference > 0 ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${difference === 0 ? "#E2E8F0"
                  : difference > 0 ? "#BBF7D0" : "#FECACA"}`,
              }}>
                <span style={{
                  fontWeight: 700, fontSize: 15,
                  color: difference === 0 ? "#64748B"
                    : difference > 0 ? "#15803D" : "#DC2626",
                }}>
                  {difference === 0 ? "Aucun changement"
                    : difference > 0 ? `+${difference} ajoutées`
                    : `${difference} retirées`}
                </span>
              </div>
            )}

            {selectedProduct && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: "#64748B", textAlign: "center" }}>
                {selectedProduct.name}
              </div>
            )}
          </div>

          {/* Avertissement */}
          <div style={{
            background: "#FFFBEB", border: "1px solid #FDE68A",
            borderRadius: 14, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="warning" size={14} color="#C2410C" /> Attention
            </div>
            <p style={{ fontSize: 12.5, color: "#92400E", margin: "0 0 6px" }}>
              • Un ajustement crée un mouvement de type "Ajustement manuel".
            </p>
            <p style={{ fontSize: 12.5, color: "#92400E", margin: "0 0 6px" }}>
              • Cette action est irréversible.
            </p>
            <p style={{ fontSize: 12.5, color: "#92400E", margin: 0 }}>
              • Utilisez cette fonction uniquement après un comptage physique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
