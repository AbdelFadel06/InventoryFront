// src/components/sales/SaleCorrectionModal.tsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { userService } from "../../services/userService";

type DiscountType = "fixed" | "percent" | null;
type PaymentMethod = "cash" | "mobile_money" | "on_delivery";

interface Line {
  product: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType;
  discount_value: number;
}

interface ProductHit { id: number; name: string; sku: string; selling_price: string }
interface Livreur { id: number; first_name: string; last_name: string }

const fmtPrice = (n: number) => Math.round(n).toLocaleString("fr-FR") + " F";

/** Même calcul que le serveur (SaleItem.save). */
function lineTotal(l: Line) {
  const subtotal = l.unit_price * l.quantity;
  let discount = 0;
  if (l.discount_type === "percent" && l.discount_value) discount = subtotal * l.discount_value / 100;
  else if (l.discount_type === "fixed" && l.discount_value) discount = Math.min(l.discount_value, subtotal);
  return subtotal - discount;
}

const field: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid #E2E8F0",
  fontSize: 13.5, fontFamily: "inherit", boxSizing: "border-box", background: "#fff",
};
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#475569",
};

/**
 * Corriger une vente : fenêtre préremplie avec la vente d'origine. À l'enregistrement, le serveur
 * annule l'ancienne et crée la nouvelle en une seule opération.
 */
export default function SaleCorrectionModal({ saleId, onClose, onDone }: {
  saleId: number;
  onClose: () => void;
  onDone: (newSale: { id: number; reference: string }) => void;
}) {
  const [reference, setReference] = useState("");
  const [originalTotal, setOriginalTotal] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [saleType, setSaleType] = useState<"direct" | "delivery">("direct");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [livreur, setLivreur] = useState<number | "">("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [reason, setReason] = useState("");
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(`/sales/${saleId}/`),
      userService.getLivreurs().catch(() => []),
    ]).then(([res, livs]) => {
      const s = res.data;
      setReference(s.reference);
      setOriginalTotal(Number(s.total_amount));
      setLines(s.items.map((i: any) => ({
        product: i.product, name: i.product_name, sku: i.product_sku,
        quantity: i.quantity, unit_price: Number(i.unit_price),
        discount_type: i.discount_type ?? null, discount_value: Number(i.discount_value ?? 0),
      })));
      setSaleType(s.sale_type);
      setPayment(s.payment_method);
      setLivreur(s.livreur ?? "");
      setAddress(s.delivery_address ?? "");
      setPhone(s.client_phone ?? "");
      setOrderDiscount(Number(s.order_discount ?? 0));
      setLivreurs(livs as Livreur[]);
    }).catch(() => setError("Impossible de charger la vente."))
      .finally(() => setLoading(false));
  }, [saleId]);

  useEffect(() => {
    if (search.trim().length < 2) { setHits([]); return; }
    const timer = setTimeout(() => {
      axiosInstance.get("/products/", { params: { search: search.trim(), is_active: true, page_size: 8 } })
        .then(res => setHits(res.data.results ?? res.data))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const update = (index: number, patch: Partial<Line>) =>
    setLines(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const addProduct = (p: ProductHit) => {
    setLines(prev => prev.some(l => l.product === p.id) ? prev : [...prev, {
      product: p.id, name: p.name, sku: p.sku, quantity: 1,
      unit_price: Number(p.selling_price), discount_type: null, discount_value: 0,
    }]);
    setSearch("");
    setHits([]);
  };

  const itemsTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const newTotal = Math.max(0, itemsTotal - orderDiscount);

  const submit = async () => {
    if (!reason.trim()) { setError("Indiquez le motif de la correction."); return; }
    if (lines.length === 0) { setError("La vente doit garder au moins un article. Sinon, annulez-la."); return; }
    if (lines.some(l => !l.quantity || l.quantity < 1)) { setError("Chaque quantité doit être d'au moins 1."); return; }
    if (saleType === "delivery" && !livreur) { setError("Choisissez le livreur."); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await axiosInstance.post(`/sales/${saleId}/correct/`, {
        reason: reason.trim(),
        sale_type: saleType,
        payment_method: payment,
        livreur: saleType === "delivery" ? livreur : null,
        delivery_address: saleType === "delivery" ? address : "",
        client_phone: saleType === "delivery" ? phone : "",
        order_discount: orderDiscount.toFixed(2),
        items: lines.map(l => ({
          product: l.product, quantity: l.quantity, unit_price: l.unit_price.toFixed(2),
          ...(l.discount_type ? { discount_type: l.discount_type, discount_value: l.discount_value.toFixed(2) } : {}),
        })),
      });
      onDone(res.data);
    } catch (e: any) {
      const data = e?.response?.data;
      const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
      setError(
        data?.error ?? first(data?.items) ?? first(data?.non_field_errors) ?? first(data?.livreur)
          ?? (typeof data === "string" ? data : "La correction a échoué. Rien n'a été modifié."),
      );
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 550, background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div role="dialog" aria-modal="true" aria-label="Corriger la vente" onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: "#fff",
        borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Corriger la vente {reference}</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            Modifiez ce qui est faux. La vente actuelle sera annulée et remplacée par celle-ci, à la même date.
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Chargement...</div>
        ) : (
          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Articles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Articles</div>
              {lines.map((l, i) => (
                <div key={l.product} style={{
                  display: "flex", flexDirection: "column", gap: 8,
                  padding: 10, borderRadius: 10, border: "1px solid #F1F5F9",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</div>
                      <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                        {l.sku}{l.discount_type && ` · remise ${l.discount_value}${l.discount_type === "percent" ? " %" : " F"}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>{fmtPrice(lineTotal(l))}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <label style={{ ...labelStyle, width: 90 }}>
                      Quantité
                      <input type="number" min={1} value={l.quantity}
                        onChange={e => update(i, { quantity: Math.max(0, parseInt(e.target.value) || 0) })} style={field} />
                    </label>
                    <label style={{ ...labelStyle, flex: 1, maxWidth: 160 }}>
                      Prix unitaire (F)
                      <input type="number" min={0} value={l.unit_price}
                        onChange={e => update(i, { unit_price: Math.max(0, parseFloat(e.target.value) || 0) })} style={field} />
                    </label>
                    <div style={{ flex: 1 }} />
                    <button aria-label={`Retirer ${l.name}`} title="Retirer l'article" onClick={() => setLines(prev => prev.filter((_, j) => j !== i))} style={{
                      height: 38, padding: "0 12px", borderRadius: 9, border: "1px solid #FECACA", background: "#FEF2F2",
                      color: "#DC2626", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    }}>Retirer</button>
                  </div>
                </div>
              ))}
              <div style={{ position: "relative" }}>
                <input placeholder="Ajouter un article (nom ou code)..." value={search}
                  onChange={e => setSearch(e.target.value)} style={field} />
                {hits.length > 0 && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 5, background: "#fff",
                    border: "1px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", overflow: "hidden",
                  }}>
                    {hits.map(p => (
                      <button key={p.id} onClick={() => addProduct(p)} style={{
                        width: "100%", display: "flex", justifyContent: "space-between", gap: 8, padding: "9px 12px",
                        border: "none", borderBottom: "1px solid #F1F5F9", background: "#fff", cursor: "pointer",
                        fontSize: 13, fontFamily: "inherit", textAlign: "left",
                      }}>
                        <span>{p.name} <span style={{ color: "#94A3B8" }}>{p.sku}</span></span>
                        <span style={{ fontWeight: 600 }}>{fmtPrice(Number(p.selling_price))}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Vente */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              <label style={labelStyle}>
                Type
                <select value={saleType} onChange={e => {
                  const next = e.target.value as "direct" | "delivery";
                  setSaleType(next);
                  if (next === "direct" && payment === "on_delivery") setPayment("cash");
                }} style={field}>
                  <option value="direct">Vente directe</option>
                  <option value="delivery">Livraison</option>
                </select>
              </label>
              <label style={labelStyle}>
                Paiement
                <select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)} style={field}>
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  {saleType === "delivery" && <option value="on_delivery">À la livraison</option>}
                </select>
              </label>
              <label style={labelStyle}>
                Remise sur la vente (F)
                <input type="number" min={0} value={orderDiscount}
                  onChange={e => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))} style={field} />
              </label>
            </div>

            {saleType === "delivery" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                <label style={labelStyle}>
                  Livreur
                  <select value={livreur} onChange={e => setLivreur(e.target.value ? Number(e.target.value) : "")} style={field}>
                    <option value="">— Choisir —</option>
                    {livreurs.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
                  </select>
                </label>
                <label style={labelStyle}>
                  Adresse
                  <input value={address} onChange={e => setAddress(e.target.value)} style={field} />
                </label>
                <label style={labelStyle}>
                  Téléphone client
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={field} />
                </label>
              </div>
            )}

            {/* Totaux */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px",
              borderRadius: 10, background: "#F8FAFC", fontSize: 13.5,
            }}>
              <span style={{ color: "#64748B" }}>Avant : <s>{fmtPrice(originalTotal)}</s></span>
              <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>Nouveau total : {fmtPrice(newTotal)}</span>
            </div>

            <label style={labelStyle}>
              Motif de la correction (obligatoire)
              <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ex. : le client a pris 2 articles et non 3" style={{ ...field, resize: "vertical" }} />
            </label>

            {error && <div role="alert" style={{ fontSize: 13, color: "#B91C1C" }}>{error}</div>}
          </div>
        )}

        <div style={{ padding: "0 22px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff",
            cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
          }}>
            Retour
          </button>
          <button onClick={submit} disabled={saving || loading} style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            background: saving || loading ? "#94A3B8" : "#1D4ED8", color: "#fff",
            cursor: saving || loading ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
          }}>
            {saving ? "Enregistrement..." : "Enregistrer la correction"}
          </button>
        </div>
      </div>
    </div>
  );
}
