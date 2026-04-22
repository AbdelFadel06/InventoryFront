// src/pages/shared/StockMovementPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { stockMovementService } from "../../services/stockService";
import { productService }       from "../../services/productService";
import { shopService }          from "../../services/shopService";
import { useAuth }              from "../../context/AuthContext";
import { PageHeader, Btn, Icon } from "../../components/ui";
import type { Product }         from "../../types/product";
import type { Shop }            from "../../types/shop";

interface Props { mode: "add" | "remove"; }

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

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box" as const,
  background: "#fff",
};

export default function StockMovementPage({ mode }: Props) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, activeShop }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";
  const isAdd     = mode === "add";

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops]       = useState<Shop[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  // Pré-remplissage depuis navigation state
  const state = location.state as { product?: number; shop?: number } | null;

  const [form, setForm] = useState({
    product:       state?.product ? String(state.product) : "",
    shop:          state?.shop    ? String(state.shop)    :
                   user?.role === "SHOP_MANAGER" ? String(activeShop?.id ?? "") : "",
    location:      "BOUTIQUE",
    quantity:      "",
    movement_type: isAdd ? "entry" : "exit",
    reason:        "",
    reference:     "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([productService.getAll(), shopService.getAll()])
      .then(([pRes, sRes]) => {
        setProducts(pRes.results ?? []);
        setShops(sRes.results ?? sRes);
      });
  }, []);

  // Stock actuel
  useEffect(() => {
    if (!form.product || !form.shop) { setCurrentStock(null); return; }
    import("../../services/stockService").then(({ stockService }) => {
      stockService.getAll({ product: form.product, shop: form.shop })
        .then(res => {
          const stock = (res.results ?? []).find(
            (s: any) => String(s.product) === form.product && String(s.shop) === form.shop
          );
          setCurrentStock(stock ? stock.quantity : 0);
        })
        .catch(() => setCurrentStock(null));
    });
  }, [form.product, form.shop]);

  const REMOVE_TYPES = [
    { value: "exit",       label: "Vente / Sortie"   },
    { value: "damage",     label: "Casse / Perte"     },
    { value: "return",     label: "Retour fournisseur"},
    { value: "adjustment", label: "Ajustement manuel" },
  ];

  const handleSubmit = async () => {
    setError(null);
    if (!form.product || !form.shop || !form.quantity) {
      setError("Produit, boutique et quantité sont obligatoires.");
      return;
    }
    const qty = Number(form.quantity);
    if (qty <= 0) { setError("La quantité doit être supérieure à 0."); return; }
    if (!isAdd && currentStock !== null && qty > currentStock) {
      setError(`Stock insuffisant. Stock actuel : ${currentStock}`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        product:       Number(form.product),
        shop:          Number(form.shop),
        location:      form.location,
        movement_type: form.movement_type,
        quantity:      qty,
        reason:        form.reason || undefined,
        reference:     form.reference || undefined,
      };
      if (isAdd) {
        await stockMovementService.addStock(payload);
      } else {
        await stockMovementService.removeStock(payload);
      }
      navigate(`${basePath}/stocks`);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.error)    setError(data.error);
      else if (data?.quantity) setError(data.quantity[0]);
      else setError("Erreur lors de l'opération.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === form.product);

  return (
    <div>
      <PageHeader
        title={isAdd ? "Ajouter du stock" : "Retirer du stock"}
        subtitle={isAdd
          ? "Enregistrer une réception ou entrée de stock"
          : "Enregistrer une sortie, vente ou perte"}
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
            <select value={form.product} onChange={e => set("product")(e.target.value)}
              style={inputStyle}>
              <option value="">Sélectionner un produit</option>
              {products.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
              ))}
            </select>
          </Field>

          <Field label="Boutique" required>
            {user?.role === "SHOP_MANAGER" ? (
              <input
                value={activeShop?.name ?? shops.find(s => String(s.id) === form.shop)?.name ?? ""}
                disabled
                style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
              />
            ) : (
              <select value={form.shop} onChange={e => set("shop")(e.target.value)} style={inputStyle}>
                <option value="">Sélectionner une boutique</option>
                {shops.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Emplacement" required hint="BOUTIQUE = espace de vente · MAGASIN = entrepôt">
            <select value={form.location} onChange={e => set("location")(e.target.value)} style={inputStyle}>
              <option value="BOUTIQUE">Boutique (espace de vente)</option>
              <option value="MAGASIN">Magasin (entrepôt)</option>
            </select>
          </Field>

          {!isAdd && (
            <Field label="Type de sortie" required>
              <select value={form.movement_type} onChange={e => set("movement_type")(e.target.value)}
                style={inputStyle}>
                {REMOVE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Quantité" required
              hint={!isAdd && currentStock !== null ? `Max: ${currentStock}` : undefined}>
              <input
                type="number" min={1}
                max={!isAdd && currentStock !== null ? currentStock : undefined}
                value={form.quantity}
                onChange={e => set("quantity")(e.target.value)}
                placeholder="0"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </Field>
            <Field label="Référence" hint="N° commande, BL...">
              <input type="text" value={form.reference}
                onChange={e => set("reference")(e.target.value)}
                placeholder="Ex: BC-2024-001"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </Field>
          </div>

          <Field label="Motif">
            <textarea value={form.reason}
              onChange={e => set("reason")(e.target.value)}
              placeholder={isAdd ? "Ex: Réception commande fournisseur..." : "Ex: Vente client, produit endommagé..."}
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
              {loading ? "Enregistrement..." : isAdd ? "Ajouter le stock" : "Retirer le stock"}
            </Btn>
          </div>
        </div>

        {/* Panneau info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Stock actuel */}
          {currentStock !== null && form.product && form.shop && (
            <div style={{
              background: "#fff", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: 20,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Stock actuel
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: currentStock === 0 ? "#DC2626" : "#0F172A", marginBottom: 4 }}>
                {currentStock}
              </div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                {selectedProduct?.name}
              </div>

              {form.quantity && Number(form.quantity) > 0 && (
                <div style={{
                  marginTop: 16, padding: "12px 14px",
                  background: isAdd ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${isAdd ? "#BBF7D0" : "#FECACA"}`,
                  borderRadius: 9,
                }}>
                  <div style={{ fontSize: 12, color: isAdd ? "#15803D" : "#DC2626", fontWeight: 600, marginBottom: 4 }}>
                    Après opération
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: isAdd ? "#15803D" : "#DC2626" }}>
                    {isAdd
                      ? currentStock + Number(form.quantity)
                      : Math.max(0, currentStock - Number(form.quantity))
                    }
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    {isAdd ? `+${form.quantity}` : `-${form.quantity}`} unités
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div style={{
            background: isAdd ? "#EFF6FF" : "#FFF7ED",
            border: `1px solid ${isAdd ? "#BFDBFE" : "#FED7AA"}`,
            borderRadius: 14, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isAdd ? "#1D4ED8" : "#C2410C", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isAdd
                ? <><Icon name="info" size={14} color="#1D4ED8" /> Info</>
                : <><Icon name="warning" size={14} color="#C2410C" /> Attention</>
              }
            </span>
            </div>
            {isAdd ? (
              <>
                <p style={{ fontSize: 12.5, color: "#1E40AF", margin: "0 0 6px" }}>• Un mouvement d'entrée sera créé automatiquement.</p>
                <p style={{ fontSize: 12.5, color: "#1E40AF", margin: "0 0 6px" }}>• Le stock sera mis à jour immédiatement.</p>
                <p style={{ fontSize: 12.5, color: "#1E40AF", margin: 0 }}>• La référence permet de relier à un bon de commande.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: "#92400E", margin: "0 0 6px" }}>• Le stock ne peut pas devenir négatif.</p>
                <p style={{ fontSize: 12.5, color: "#92400E", margin: "0 0 6px" }}>• Choisissez le bon type de sortie pour la traçabilité.</p>
                <p style={{ fontSize: 12.5, color: "#92400E", margin: 0 }}>• Cette action est irréversible.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
