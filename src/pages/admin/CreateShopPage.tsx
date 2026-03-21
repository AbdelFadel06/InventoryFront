// src/pages/admin/CreateShopPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { shopService } from "../../services/shopService";
import { PageHeader, Btn } from "../../components/ui";

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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 12, fontWeight: 700, color: "#94A3B8",
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
    marginBottom: 16, marginTop: 4,
    paddingBottom: 8, borderBottom: "1px solid #F1F5F9",
  }}>
    {children}
  </div>
);

export default function CreateShopPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [form, setForm] = useState({
    name:    "",
    slogan:  "",
    ifu:     "",
    phone:   "",
    email:   "",
    address: "",
    city:    "",
    country: "Bénin",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Le nom de la boutique est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      await shopService.create({
        name:    form.name,
        slogan:  form.slogan  || undefined,
        ifu:     form.ifu     || undefined,
        phone:   form.phone   || undefined,
        email:   form.email   || undefined,
        address: form.address || undefined,
        city:    form.city    || undefined,
        country: form.country || undefined,
      });
      navigate("/admin/shops");
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.name)   setError(data.name[0]);
      else if (data?.ifu) setError(`IFU: ${data.ifu[0]}`);
      else setError("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nouvelle boutique"
        subtitle="Ajouter une boutique au système"
        action={
          <Btn variant="secondary" onClick={() => navigate("/admin/shops")}>
            ← Retour
          </Btn>
        }
      />

      <div style={{ maxWidth: 640 }}>
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

          <SectionTitle>Informations générales</SectionTitle>

          <Field label="Nom de la boutique" required>
            <input value={form.name} onChange={set("name")}
              placeholder="Ex: Revet Deco, NovaSneak..." style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <Field label="Slogan" hint="Phrase d'accroche optionnelle">
            <input value={form.slogan} onChange={set("slogan")}
              placeholder="Ex: La qualité à votre service" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <Field label="Numéro IFU" hint="Identifiant Fiscal Unique">
            <input value={form.ifu} onChange={set("ifu")}
              placeholder="Ex: 3202001234567" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <SectionTitle>Contact</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Téléphone">
              <input value={form.phone} onChange={set("phone")}
                placeholder="Ex: +229 97 00 00 00" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="boutique@email.com" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>

          <SectionTitle>Adresse</SectionTitle>

          <Field label="Adresse">
            <input value={form.address} onChange={set("address")}
              placeholder="Rue, quartier..." style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Ville">
              <input value={form.city} onChange={set("city")}
                placeholder="Ex: Cotonou" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="Pays">
              <input value={form.country} onChange={set("country")}
                placeholder="Ex: Bénin" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => navigate("/admin/shops")}>
              Annuler
            </Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Création..." : "Créer la boutique"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
