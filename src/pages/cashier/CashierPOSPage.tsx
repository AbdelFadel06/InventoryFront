// src/pages/cashier/CashierPOSPage.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Badge, Icon } from "../../components/ui";
import axiosInstance from "../../api/axiosInstance";
import { userService } from "../../services/userService";

// ── Types ────────────────────────────────────────────────────────
interface CashierSession {
  id: number;
  cashier: number;
  cashier_name: string;
  shop: number;
  shop_name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  selling_price: string;
  unit: string;
  current_stock: number;
  category_name: string | null;
  primary_image: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_type: "fixed" | "percent" | null;
  discount_value: number;
  discount_amount: number;
  subtotal: number;
  total_price: number;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  shop: number;
}

// ── Helpers ──────────────────────────────────────────────────────

const calcItem = (item: Omit<CartItem, "discount_amount" | "subtotal" | "total_price">): CartItem => {
  const subtotal = item.unit_price * item.quantity;
  let discount_amount = 0;
  if (item.discount_type === "percent" && item.discount_value > 0) {
    discount_amount = Math.round((subtotal * item.discount_value) / 100);
  } else if (item.discount_type === "fixed" && item.discount_value > 0) {
    discount_amount = Math.min(item.discount_value, subtotal);
  }
  return { ...item, subtotal, discount_amount, total_price: subtotal - discount_amount };
};

const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " F";

// ── Composant ligne panier ────────────────────────────────────────
function CartItemRow({
  item, onQtyChange, onRemove, onDiscount,
}: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  onDiscount: () => void;
}) {
  const [qtyStr, setQtyStr] = useState(String(item.quantity));

  // Sync si la quantité change de l'extérieur (ex: bouton +/-)
  useEffect(() => { setQtyStr(String(item.quantity)); }, [item.quantity]);

  const commit = (raw: string) => {
    const v = parseInt(raw, 10);
    if (!isNaN(v) && v > 0) {
      onQtyChange(v);
    } else {
      setQtyStr(String(item.quantity)); // reset si invalide
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px",
      borderBottom: "1px solid #F1F5F9",
      background: "#fff",
    }}>
      {/* Produit */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.product.name}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{item.product.sku}</div>
        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
          {fmtPrice(item.unit_price)} × {item.quantity}
          {item.discount_amount > 0 && (
            <span style={{ color: "#DC2626", marginLeft: 6 }}>
              −{fmtPrice(item.discount_amount)}
            </span>
          )}
        </div>
      </div>

      {/* Qty controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => onQtyChange(item.quantity - 1)}
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid #E2E8F0",
            background: "#F8FAFC", cursor: "pointer", fontWeight: 700,
            fontSize: 14, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
          }}>−</button>
        <input
          type="number"
          className="qty-input"
          min={1}
          value={qtyStr}
          onChange={e => setQtyStr(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
          style={{
            width: 56, textAlign: "center", fontWeight: 700, fontSize: 13.5, color: "#0F172A",
            border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px",
            background: "#F8FAFC", outline: "none", fontFamily: "inherit",
          }}
          onWheel={e => e.currentTarget.blur()}
        />
        <button
          onClick={() => onQtyChange(item.quantity + 1)}
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid #E2E8F0",
            background: "#F8FAFC", cursor: "pointer", fontWeight: 700,
            fontSize: 14, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
          }}>+</button>
      </div>

      {/* Total */}
      <div style={{ textAlign: "right", minWidth: 70 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>
          {fmtPrice(item.total_price)}
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onDiscount} title="Réduction"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#F97316", fontSize: 13, padding: 2 }}>
            %
          </button>
          <button onClick={onRemove} title="Supprimer"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: 2 }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal réduction sur ligne ─────────────────────────────────────
function DiscountModal({ item, onApply, onClose }: {
  item: CartItem;
  onApply: (type: "fixed" | "percent", value: number) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"fixed" | "percent">(item.discount_type ?? "percent");
  const [value, setValue] = useState(String(item.discount_value || ""));

  const preview = (() => {
    const v = parseFloat(value) || 0;
    if (type === "percent") return Math.round((item.subtotal * v) / 100);
    return Math.min(v, item.subtotal);
  })();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24, width: 320,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
          Réduction — {item.product.name}
        </div>
        <div style={{ fontSize: 12.5, color: "#94A3B8", marginBottom: 16 }}>
          Sous-total : {fmtPrice(item.subtotal)}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { key: "percent", label: "En %" },
            { key: "fixed", label: "Montant fixe" },
          ].map(opt => (
            <button key={opt.key} onClick={() => setType(opt.key as any)}
              style={{
                flex: 1, padding: "8px", borderRadius: 8,
                border: type === opt.key ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                background: type === opt.key ? "#EFF6FF" : "#fff",
                cursor: "pointer", fontSize: 13, fontWeight: type === opt.key ? 600 : 400,
                color: type === opt.key ? "#1D4ED8" : "#64748B", fontFamily: "inherit",
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="number" min={0} max={type === "percent" ? 100 : undefined}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          placeholder={type === "percent" ? "Ex: 10 (%)" : "Montant (F)"}
          style={{
            width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
            borderRadius: 9, fontSize: 14, outline: "none", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "#3B82F6")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />

        {preview > 0 && (
          <div style={{
            background: "#FFF7ED", border: "1px solid #FED7AA",
            borderRadius: 8, padding: "8px 12px", marginTop: 10,
            fontSize: 13, color: "#C2410C", fontWeight: 500,
          }}>
            Réduction : −{fmtPrice(preview)} → <strong>{fmtPrice(item.subtotal - preview)}</strong>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #E2E8F0",
            background: "#fff", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
          }}>Annuler</button>
          <button onClick={() => { onApply(type, parseFloat(value) || 0); onClose(); }}
            style={{
              flex: 1, padding: "10px", borderRadius: 9, border: "none",
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              color: "#fff", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
            }}>
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal paiement ────────────────────────────────────────────────
function PaymentModal({
  cart, session, livreurs, onSuccess, onClose,
}: {
  cart: CartItem[];
  session: CashierSession;
  livreurs: User[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const total = cart.reduce((s, i) => s + i.total_price, 0);
  const [saleType, setSaleType] = useState<"direct" | "delivery">("direct");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "on_delivery">("cash");
  const [livreur, setLivreur] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [amountGiven, setAmountGiven] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = amountGiven ? Math.max(0, parseFloat(amountGiven) - total) : null;

  const handleSubmit = async () => {
    setError(null);
    if (saleType === "delivery" && !livreur) {
      setError("Veuillez sélectionner un livreur.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/sales/", {
        sale_type: saleType,
        payment_method: paymentMethod,
        livreur: saleType === "delivery" ? Number(livreur) : undefined,
        delivery_address: address || undefined,
        notes: notes || undefined,
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          discount_type: item.discount_type ?? undefined,
          discount_value: item.discount_value || 0,
        })),
      });
      onSuccess();
    } catch (e: any) {
      const d = e?.response?.data;
      const msg =
        d?.items?.[0] ??
        d?.non_field_errors?.[0] ??
        d?.detail ??
        "Erreur lors de l'enregistrement.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A, #1E293B)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Finaliser la vente
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 2 }}>
              {fmtPrice(total)}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
              {cart.length} article(s) · {cart.reduce((s, i) => s + i.quantity, 0)} unité(s)
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
            color: "#fff", fontSize: 20, width: 34, height: 34, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}>
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Type de vente */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Type de vente
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { key: "direct", label: "Vente directe", desc: "Client sur place" },
                { key: "delivery", label: "Livraison", desc: "Envoi par livreur" },
              ].map(opt => (
                <button key={opt.key} onClick={() => setSaleType(opt.key as any)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10,
                    border: saleType === opt.key ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                    background: saleType === opt.key ? "#EFF6FF" : "#F8FAFC",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                  }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: saleType === opt.key ? "#1D4ED8" : "#374151" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Livreur (si livraison) */}
          {saleType === "delivery" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Livreur
              </div>
              <select value={livreur} onChange={e => setLivreur(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
                  borderRadius: 9, fontSize: 13.5, color: "#374151", background: "#fff",
                  outline: "none", fontFamily: "inherit", marginBottom: 10,
                }}>
                <option value="">-- Sélectionner un livreur --</option>
                {livreurs.map(l => (
                  <option key={l.id} value={l.id}>{l.full_name || l.first_name + " " + l.last_name}</option>
                ))}
              </select>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Adresse de livraison..."
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
                  borderRadius: 9, fontSize: 13.5, color: "#374151", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }} />
            </div>
          )}

          {/* Moyen de paiement */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Moyen de paiement
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "cash", label: "Espèces" },
                { key: "mobile_money", label: "MoMo" },
                ...(saleType === "delivery" ? [{ key: "on_delivery", label: "À la livraison" }] : []),
              ].map(opt => (
                <button key={opt.key} onClick={() => setPaymentMethod(opt.key as any)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 9,
                    border: paymentMethod === opt.key ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                    background: paymentMethod === opt.key ? "#EFF6FF" : "#F8FAFC",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12.5,
                    fontWeight: paymentMethod === opt.key ? 600 : 400,
                    color: paymentMethod === opt.key ? "#1D4ED8" : "#374151",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant reçu (espèces) */}
          {paymentMethod === "cash" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Montant reçu
              </div>
              <input type="number" min={total} value={amountGiven}
                onChange={e => setAmountGiven(e.target.value)}
                placeholder={String(total)}
                autoFocus
                style={{
                  width: "100%", padding: "12px 14px", border: "1px solid #E2E8F0",
                  borderRadius: 9, fontSize: 16, fontWeight: 700, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                  borderColor: change !== null && change >= 0 ? "#22C55E" : "#E2E8F0",
                }} />
              {change !== null && change >= 0 && (
                <div style={{
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  borderRadius: 9, padding: "12px 16px", marginTop: 8,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 14, color: "#15803D", fontWeight: 500 }}>Monnaie à rendre</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#15803D" }}>{fmtPrice(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 4 }}>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optionnel)..."
              style={{
                width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
                borderRadius: 9, fontSize: 13.5, color: "#374151", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0",
            background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
            color: "#374151",
          }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{
              flex: 2, padding: "12px", borderRadius: 10, border: "none",
              background: loading ? "#94A3B8" : "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              boxShadow: loading ? "none" : "0 4px 14px rgba(16,185,129,0.4)",
            }}>
            {loading ? "Enregistrement..." : `✓ Encaisser ${fmtPrice(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal dépense ─────────────────────────────────────────────────
function ExpenseModal({ session, onSuccess, onClose }: {
  session: CashierSession;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!label.trim() || !amount) {
      setError("Libellé et montant obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/expenses/", {
        session: session.id,
        label: label.trim(),
        amount: parseFloat(amount),
        sale_date: today,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      const d = e?.response?.data;
      setError(d?.detail ?? d?.amount?.[0] ?? "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24, width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="expense" size={18} color="#F97316" /> Enregistrer une dépense
        </div>
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", borderRadius: 8, padding: "8px 12px",
            fontSize: 13, marginBottom: 12,
          }}>
            {error}
          </div>
        )}
        <input
          type="text" value={label} onChange={e => setLabel(e.target.value)}
          placeholder="Libellé (Ex: Livraison fournisseur...)"
          autoFocus
          style={{
            width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
            borderRadius: 9, fontSize: 13.5, outline: "none", fontFamily: "inherit",
            boxSizing: "border-box", marginBottom: 12,
          }}
          onFocus={e => (e.target.style.borderColor = "#3B82F6")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />
        <input
          type="number" min={0.01} step={1} value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Montant (F CFA)"
          style={{
            width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
            borderRadius: 9, fontSize: 14, fontWeight: 600, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16,
          }}
          onFocus={e => (e.target.style.borderColor = "#3B82F6")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #E2E8F0",
            background: "#fff", cursor: "pointer", fontFamily: "inherit",
          }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{
              flex: 1, padding: "10px", borderRadius: 9, border: "none",
              background: loading ? "#94A3B8" : "linear-gradient(135deg, #F97316, #EA580C)",
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, fontFamily: "inherit", fontSize: 13.5,
            }}>
            {loading ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Succès vente ──────────────────────────────────────────────────
function SaleSuccessOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "rgba(16,185,129,0.95)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ fontSize: 64, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="checkCircle" size={64} color="#fff" /></div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>Vente enregistrée !</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
        Fermeture automatique...
      </div>
    </div>
  );
}

// ── Page POS principale ───────────────────────────────────────────
export default function CashierPOSPage() {
  const { user } = useAuth();

  const [session, setSession] = useState<CashierSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [discountItem, setDiscountItem] = useState<number | null>(null);

  const [todaySales, setTodaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<any>(null);
  const barcodeJustFired = useRef(false);

  // Charger session active
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/cashier-sessions/active/");
        if (res.data?.id) {
          setSession(res.data);
        }
        // Charger produits et livreurs
        const [prods, livs] = await Promise.all([
          axiosInstance.get("/products/"),
          userService.getLivreurs().catch(() => []),
        ]);
        setProducts(prods.data.results ?? prods.data);
        setLivreurs(livs as User[]);
      } catch (e) {
        console.error(e);
      } finally {
        setSessionLoading(false);
      }
    };
    load();
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const report = await axiosInstance.get(`/sales/daily_report/?date=${today}`).catch(() => null);
      if (report) {
        setTodaySales(report.data.summary?.total_amount ?? 0);
        setTodayExpenses(report.data.summary?.total_expenses ?? 0);
      }
    } catch { }
  };

  // Recherche produit
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setShowResults(false); return; }
    const q = search.toLowerCase();
    const results = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(results);
    setShowResults(results.length > 0);
  }, [search, products]);

  // Scan code-barres (entrées clavier rapides)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si focus sur un champ de saisie normal
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" && (e.target as HTMLInputElement).id !== "barcode-search") return;
      if (tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 3) {
          const code = barcodeBuffer.current;
          const product = products.find(p => p.barcode === code || p.sku === code);
          if (product) {
            addToCart(product);
            barcodeJustFired.current = true;
            setTimeout(() => { barcodeJustFired.current = false; }, 50);
          }
          barcodeBuffer.current = "";
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.product.id === product.id);
      if (existing >= 0) {
        // Produit déjà dans le panier — le caissier ajuste la quantité manuellement
        return prev;
      }
      return [...prev, calcItem({
        product,
        quantity: 1,
        unit_price: parseFloat(product.selling_price),
        discount_type: null,
        discount_value: 0,
      })];
    });
    setSearch("");
    setShowResults(false);
    searchRef.current?.focus();
  }, []);

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({ ...updated[idx], quantity: qty });
      return updated;
    });
  };

  const applyDiscount = (idx: number, type: "fixed" | "percent", value: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({ ...updated[idx], discount_type: type, discount_value: value });
      return updated;
    });
  };

  const cartTotal = cart.reduce((s, i) => s + i.total_price, 0);
  const cartDiscount = cart.reduce((s, i) => s + i.discount_amount, 0);
  const cartItems = cart.reduce((s, i) => s + i.quantity, 0);

  if (sessionLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94A3B8" }}>
        Chargement...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "60vh", gap: 16,
      }}>
        <div style={{ fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="lock" size={48} color="#94A3B8" /></div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Aucune session active</div>
        <div style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", maxWidth: 320 }}>
          Le manager doit ouvrir une session de caisse avant que vous puissiez enregistrer des ventes.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <style>{`.qty-input::-webkit-inner-spin-button,.qty-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.qty-input{-moz-appearance:textfield}`}</style>
      {/* Header session */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A, #1E293B)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#22C55E",
            boxShadow: "0 0 0 3px rgba(34,197,94,0.3)",
          }} />
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Session active · {session.cashier_name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {session.shop_name} · Aujourd'hui
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>CA du jour</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#22C55E" }}>{fmtPrice(todaySales)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Dépenses</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F97316" }}>{fmtPrice(todayExpenses)}</div>
          </div>
          <button
            onClick={() => setShowExpense(true)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
              color: "#F97316", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
              fontFamily: "inherit",
            }}>
            + Dépense
          </button>
        </div>
      </div>

      {/* Corps principal */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Gauche : recherche + résultats ─────────────────────── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: "1px solid #E2E8F0", overflow: "hidden",
        }}>
          {/* Barre de recherche / scan */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9", background: "#fff" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 16, color: "#94A3B8", display: "flex", alignItems: "center",
              }}><Icon name="search" size={16} color="#94A3B8" /></span>
              <input
                id="barcode-search"
                ref={searchRef}
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => search && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Rechercher ou scanner un produit..."
                style={{
                  width: "100%", padding: "11px 14px 11px 38px",
                  border: "2px solid #E2E8F0", borderRadius: 10,
                  fontSize: 14, color: "#0F172A", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    if (barcodeJustFired.current) return;
                    addToCart(searchResults[0]);
                  }
                }}
              />
            </div>

            {/* Résultats dropdown */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: "absolute", left: 16, right: 16, zIndex: 100,
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                marginTop: 4, overflow: "hidden",
              }}>
                {searchResults.map((p, i) => (
                  <button key={p.id}
                    onMouseDown={() => addToCart(p)}
                    style={{
                      width: "100%", padding: "8px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: i < searchResults.length - 1 ? "1px solid #F8FAFC" : "none",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    {/* Miniature */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: "hidden",
                      background: p.primary_image ? "#F8FAFC" : "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {p.primary_image ? (
                        <img src={p.primary_image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{p.sku}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1D4ED8" }}>
                        {fmtPrice(parseFloat(p.selling_price))}
                      </div>
                      <div style={{ fontSize: 11, color: p.current_stock === 0 ? "#DC2626" : "#64748B" }}>
                        Stock: {p.current_stock}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grille rapide produits récents */}
          <div style={{ flex: 1, padding: "12px", overflowY: "auto", background: "#F8FAFC" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Produits disponibles
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {products.filter(p => p.current_stock > 0).slice(0, 24).map(p => (
                <button key={p.id}
                  onClick={() => addToCart(p)}
                  style={{
                    padding: 0, borderRadius: 10,
                    border: "1px solid #E2E8F0", background: "#fff",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    transition: "all 0.15s", overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: "100%", height: 90,
                    background: p.primary_image ? "#F8FAFC" : "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {p.primary_image ? (
                      <img
                        src={p.primary_image}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-5-5L5 21"/>
                      </svg>
                    )}
                  </div>
                  {/* Infos */}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>
                      {fmtPrice(parseFloat(p.selling_price))}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>
                      Stock: {p.current_stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Droite : panier ────────────────────────────────────── */}
        <div style={{
          width: 340, display: "flex", flexDirection: "column",
          background: "#fff", flexShrink: 0,
        }}>
          {/* Header panier */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Panier ({cartItems})
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 12.5 }}>
                Vider
              </button>
            )}
          </div>

          {/* Articles */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {cart.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "100%", color: "#94A3B8", gap: 8,
              }}>
                <div style={{ fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="cart" size={36} color="#CBD5E1" /></div>
                <div style={{ fontSize: 13.5 }}>Panier vide</div>
                <div style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", maxWidth: 200 }}>
                  Recherchez ou scannez un produit pour l'ajouter
                </div>
              </div>
            ) : (
              cart.map((item, idx) => (
                <CartItemRow
                  key={`${item.product.id}-${idx}`}
                  item={item}
                  onQtyChange={qty => updateQty(idx, qty)}
                  onRemove={() => updateQty(idx, 0)}
                  onDiscount={() => setDiscountItem(idx)}
                />
              ))
            )}
          </div>

          {/* Totaux */}
          {cart.length > 0 && (
            <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 16px" }}>
              {cartDiscount > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>Sous-total</span>
                    <span style={{ fontSize: 13, color: "#64748B" }}>
                      {fmtPrice(cart.reduce((s, i) => s + i.subtotal, 0))}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#F97316" }}>Réductions</span>
                    <span style={{ fontSize: 13, color: "#F97316", fontWeight: 600 }}>
                      −{fmtPrice(cartDiscount)}
                    </span>
                  </div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                  {fmtPrice(cartTotal)}
                </span>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
                }}>
                <Icon name="money" size={15} color="#fff" /> Encaisser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPayment && session && (
        <PaymentModal
          cart={cart}
          session={session}
          livreurs={livreurs}
          onSuccess={() => {
            setCart([]);
            setShowPayment(false);
            setShowSuccess(true);
            loadTodayStats();
          }}
          onClose={() => setShowPayment(false)}
        />
      )}

      {showExpense && session && (
        <ExpenseModal
          session={session}
          onSuccess={loadTodayStats}
          onClose={() => setShowExpense(false)}
        />
      )}

      {showSuccess && <SaleSuccessOverlay onClose={() => setShowSuccess(false)} />}

      {discountItem !== null && (
        <DiscountModal
          item={cart[discountItem]}
          onApply={(type, value) => applyDiscount(discountItem, type, value)}
          onClose={() => setDiscountItem(null)}
        />
      )}
    </div>
  );
}
