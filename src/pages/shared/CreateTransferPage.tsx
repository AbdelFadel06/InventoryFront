// src/pages/shared/CreateTransferPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { transferService } from "../../services/transferService";
import { shopService }     from "../../services/shopService";
import { productService }  from "../../services/productService";
import { stockService }    from "../../services/stockService";
import { useAuth }         from "../../context/AuthContext";
import { PageHeader, Btn, Icon } from "../../components/ui";
import type { Shop }    from "../../types/shop";
import type { Product } from "../../types/product";

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>{hint}</p>}
  </div>
);

const Select = ({
  value, onChange, children, disabled,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; disabled?: boolean;
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    style={{
      width: "100%", padding: "10px 12px",
      border: "1px solid #E2E8F0", borderRadius: 9,
      fontSize: 13.5, color: "#374151", background: "#fff",
      outline: "none", fontFamily: "inherit",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
    }}
    onFocus={e => (e.target.style.borderColor = "#3B82F6")}
    onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
  >
    {children}
  </select>
);

export default function CreateTransferPage() {
  const navigate = useNavigate();
  const { user, activeShop } = useAuth();
  const basePath = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [shops, setShops]       = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const [form, setForm] = useState({
    from_shop: user?.role === "SHOP_MANAGER" ? String(activeShop?.id ?? "") : "",
    to_shop:   "",
    product:   "",
    quantity:  "",
    notes:     "",
  });

  useEffect(() => {
    Promise.all([shopService.getAll(), productService.getAll()])
      .then(([shopsRes, productsRes]) => {
        setShops(shopsRes.results ?? shopsRes);
        setProducts(productsRes.results ?? []);
      });
  }, []);

  // Charger le stock actuel quand produit + boutique source sont sélectionnés
  useEffect(() => {
    if (!form.product || !form.from_shop) {
      setCurrentStock(null);
      return;
    }
    stockService.getAll({ product: form.product, shop: form.from_shop })
      .then(res => {
        const stocks = res.results ?? [];
        const stock = stocks.find(
          (s: any) => String(s.product) === form.product && String(s.shop) === form.from_shop
        );
        setCurrentStock(stock ? stock.quantity : 0);
      })
      .catch(() => setCurrentStock(null));
  }, [form.product, form.from_shop]);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const availableToShops = shops.filter(s => String(s.id) !== form.from_shop && s.is_active);
  const isManager = user?.role === "SHOP_MANAGER";

  const handleSubmit = async () => {
    setError(null);

    if (!form.from_shop || !form.to_shop || !form.product || !form.quantity) {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }

    const qty = Number(form.quantity);
    if (qty <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    if (currentStock !== null && qty > currentStock) {
      setError(`Stock insuffisant. Stock disponible : ${currentStock}`);
      return;
    }

    setLoading(true);
    try {
      await transferService.create({
        from_shop: Number(form.from_shop),
        to_shop:   Number(form.to_shop),
        product:   Number(form.product),
        quantity:  qty,
        notes:     form.notes || undefined,
      });
      navigate(`${basePath}/transfers`);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.quantity)  setError(data.quantity[0]);
      else if (data?.error) setError(data.error);
      else setError("Erreur lors de la création du transfert.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === form.product);

  return (
    <div>
      <PageHeader
        title="Nouveau transfert"
        subtitle="Transférer du stock entre deux boutiques"
        action={
          <Btn variant="secondary" onClick={() => navigate(`${basePath}/transfers`)}>
            ← Retour
          </Btn>
        }
      />

      <div style={{ maxWidth: 600 }}>
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

          {/* Boutique source */}
          <Field label="Boutique source *">
            {isManager ? (
              <input value={activeShop?.name ?? shops.find(s => String(s.id) === form.from_shop)?.name ?? ""} disabled style={{ width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 13.5, color: "#374151", background: "#F8FAFC", opacity: 0.8, boxSizing: "border-box" as const }} />
            ) : (
              <Select value={form.from_shop} onChange={set("from_shop")}>
                <option value="">Sélectionner la boutique source</option>
                {shops.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            )}
          </Field>

          {/* Boutique destination */}
          <Field label="Boutique destination *">
            <Select value={form.to_shop} onChange={set("to_shop")} disabled={!form.from_shop}>
              <option value="">Sélectionner la boutique destination</option>
              {availableToShops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>

          {/* Produit */}
          <Field label="Produit *">
            <Select value={form.product} onChange={set("product")}>
              <option value="">Sélectionner un produit</option>
              {products.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.sku}
                </option>
              ))}
            </Select>
          </Field>

          {/* Info stock disponible */}
          {currentStock !== null && form.product && form.from_shop && (
            <div style={{
              background: currentStock === 0 ? "#FEF2F2" : "#F0FDF4",
              border: `1px solid ${currentStock === 0 ? "#FECACA" : "#BBF7D0"}`,
              borderRadius: 9, padding: "10px 14px",
              marginBottom: 20, fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {currentStock === 0
                ? <Icon name="warning" size={16} color="#DC2626" />
                : <Icon name="package" size={16} color="#15803D" />
              }
              <span style={{ color: currentStock === 0 ? "#DC2626" : "#15803D", fontWeight: 500 }}>
                Stock disponible : <strong>{currentStock}</strong> {selectedProduct?.unit ?? ""}
              </span>
            </div>
          )}

          {/* Quantité */}
          <Field
            label="Quantité à transférer *"
            hint={currentStock !== null ? `Maximum : ${currentStock}` : undefined}
          >
            <input
              type="number"
              min={1}
              max={currentStock ?? undefined}
              value={form.quantity}
              onChange={e => set("quantity")(e.target.value)}
              placeholder="Ex: 10"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid #E2E8F0", borderRadius: 9,
                fontSize: 13.5, color: "#374151", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes (optionnel)">
            <textarea
              value={form.notes}
              onChange={e => set("notes")(e.target.value)}
              placeholder="Raison du transfert, instructions..."
              rows={3}
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid #E2E8F0", borderRadius: 9,
                fontSize: 13.5, color: "#374151", outline: "none",
                fontFamily: "inherit", resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          {/* Résumé */}
          {form.from_shop && form.to_shop && form.product && form.quantity && (
            <div style={{
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: 10, padding: "14px 16px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1D4ED8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Résumé du transfert
              </div>
              <div style={{ fontSize: 13.5, color: "#1E40AF", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="package" size={14} color="#1D4ED8" /> <strong>{form.quantity}</strong> × {selectedProduct?.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="store" size={14} color="#1D4ED8" /> {shops.find(s => String(s.id) === form.from_shop)?.name} → {shops.find(s => String(s.id) === form.to_shop)?.name}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => navigate(`${basePath}/transfers`)}>
              Annuler
            </Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Création..." : "Créer le transfert"}
            </Btn>
          </div>

        </div>
      </div>
    </div>
  );
}
