// src/pages/shared/CreateInventoryPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "../../services/inventoryService";
import { shopService }      from "../../services/shopService";
import { useAuth }          from "../../context/AuthContext";
import { PageHeader, Btn, Icon } from "../../components/ui";
import type { Shop }        from "../../types/shop";

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

export default function CreateInventoryPage() {
  const navigate  = useNavigate();
  const { user, activeShop }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [shops, setShops]     = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    shop:           user?.role === "SHOP_MANAGER" ? String(activeShop?.id ?? user?.shop ?? "") : "",
    inventory_date: today,
    notes:          "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    shopService.getAll()
      .then(res => setShops(res.results ?? res));
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!form.shop || !form.inventory_date) {
      setError("La boutique et la date sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const inv = await inventoryService.create({
        shop:           Number(form.shop),
        inventory_date: form.inventory_date,
        notes:          form.notes || undefined,
      }) as any;

      if (inv?.id) {
        navigate(`${basePath}/inventories/${inv.id}`);
      } else {
        navigate(`${basePath}/inventories`);
      }
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.inventory_date) setError(data.inventory_date[0]);
      else if (data?.shop)      setError(data.shop[0]);
      else if (data?.detail)    setError(data.detail);
      else setError("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const selectedShop = shops.find(s => String(s.id) === form.shop);

  return (
    <div>
      <PageHeader
        title="Nouvel inventaire"
        subtitle="Créer un inventaire physique"
        action={
          <Btn variant="secondary" onClick={() => navigate(`${basePath}/inventories`)}>
            ← Retour
          </Btn>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start", maxWidth: 760 }}>

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

          <Field label="Boutique" required>
            {user?.role === "SHOP_MANAGER" ? (
              <input value={activeShop?.name ?? shops.find(s => String(s.id) === form.shop)?.name ?? ""} disabled style={{ ...inputStyle, opacity: 0.7 }} />
            ) : (
              <select
                value={form.shop}
                onChange={e => set("shop")(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              >
                <option value="">Sélectionner une boutique</option>
                {shops.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Date de l'inventaire" required hint="Ne peut pas être dans le futur">
            <input
              type="date"
              value={form.inventory_date}
              max={today}
              onChange={e => set("inventory_date")(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <Field label="Notes (optionnel)">
            <textarea
              value={form.notes}
              onChange={e => set("notes")(e.target.value)}
              placeholder="Observations générales, contexte de l'inventaire..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
            />
          </Field>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => navigate(`${basePath}/inventories`)}>
              Annuler
            </Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Création..." : "Créer l'inventaire"}
            </Btn>
          </div>
        </div>

        {/* Panneau info workflow */}
        <div style={{
          background: "#EFF6FF", border: "1px solid #BFDBFE",
          borderRadius: 14, padding: 22,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="inventory" size={14} color="#1D4ED8" /> Workflow inventaire</span>
          </div>
          {[
            { step: "1", label: "Créer",           desc: "Définir boutique + date",         active: true  },
            { step: "2", label: "Ajouter produits", desc: "Sélectionner les produits",       active: false },
            { step: "3", label: "Démarrer",         desc: "Lancer le comptage",              active: false },
            { step: "4", label: "Compter",          desc: "Saisir les quantités réelles",    active: false },
            { step: "5", label: "Terminer",         desc: "Finaliser le comptage",           active: false },
            { step: "6", label: "Valider",          desc: "Ajuster les stocks automatiquement", active: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 5 ? 14 : 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: s.active ? "#1D4ED8" : "#BFDBFE",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: s.active ? "#fff" : "#1D4ED8",
              }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: s.active ? 700 : 500, color: s.active ? "#1E40AF" : "#3B82F6" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11.5, color: "#60A5FA", marginTop: 1 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
