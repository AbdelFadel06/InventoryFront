// src/pages/admin/CreateUserPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { shopService }  from "../../services/shopService";
import { useAuth }      from "../../context/AuthContext";
import { PageHeader, Btn } from "../../components/ui";
import type { Shop }    from "../../types/shop";

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

export default function CreateUserPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const isAdmin   = user?.role === "SUPER_ADMIN";
  const basePath  = isAdmin ? "/admin" : "/manager";

  const [shops, setShops]     = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    username:   "",
    password:   "",
    role:       isAdmin ? "EMPLOYEE" : "EMPLOYEE",
    shop:       isAdmin ? "" : String(user?.shop ?? ""),
    phone_number: "",
    gender:     "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isAdmin) {
      shopService.getAll()
        .then(res => setShops(res.results ?? res));
    }
  }, [isAdmin]);

  // Auto-generate username from email
  const handleEmailChange = (v: string) => {
    set("email")(v);
    if (!form.username) {
      const autoUsername = v.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      setForm(f => ({ ...f, email: v, username: autoUsername }));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("Prénom, nom, email et mot de passe sont obligatoires.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      await userService.create({
        first_name:   form.first_name,
        last_name:    form.last_name,
        email:        form.email,
        username:     form.username || form.email.split("@")[0],
        password:     form.password,
        role:         form.role as any,
        shop:         form.shop ? Number(form.shop) : undefined,
        phone_number: form.phone_number || undefined,
        gender:       form.gender as any || undefined,
      });
      navigate(`${basePath}/users`);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.email)    setError(`Email: ${data.email[0]}`);
      else if (data?.username) setError(`Username: ${data.username[0]}`);
      else if (data?.password) setError(`Mot de passe: ${data.password[0]}`);
      else if (data?.detail)   setError(data.detail);
      else setError("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  // Boutique affichée selon rôle
  const shopForManager = shops.find(s => String(s.id) === form.shop);

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Nouvel utilisateur" : "Nouvel employé"}
        subtitle={isAdmin
          ? "Créer un compte Super Admin, Manager ou Employé"
          : "Créer un compte employé pour votre boutique"}
        action={
          <Btn variant="secondary" onClick={() => navigate(`${basePath}/users`)}>
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

          <SectionTitle>Identité</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Prénom" required>
              <input value={form.first_name} onChange={e => set("first_name")(e.target.value)}
                placeholder="Ex: Abdel" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="Nom" required>
              <input value={form.last_name} onChange={e => set("last_name")(e.target.value)}
                placeholder="Ex: SALIOU" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Genre">
              <select value={form.gender} onChange={e => set("gender")(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Non spécifié</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </Field>
            <Field label="Téléphone">
              <input value={form.phone_number} onChange={e => set("phone_number")(e.target.value)}
                placeholder="+229 97 00 00 00" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </div>

          <SectionTitle>Compte</SectionTitle>

          <Field label="Email" required>
            <input type="email" value={form.email}
              onChange={e => handleEmailChange(e.target.value)}
              placeholder="prenom.nom@email.com" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <Field label="Nom d'utilisateur" hint="Généré automatiquement depuis l'email">
            <input value={form.username} onChange={e => set("username")(e.target.value)}
              placeholder="Ex: abdel.saliou" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>

          <Field label="Mot de passe" required hint="Minimum 8 caractères">
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => set("password")(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94A3B8", fontSize: 14,
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          <SectionTitle>Rôle & Boutique</SectionTitle>

          {isAdmin && (
            <Field label="Rôle" required>
              <select value={form.role} onChange={e => set("role")(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="EMPLOYEE">Employé</option>
                <option value="SHOP_MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </Field>
          )}

          {isAdmin ? (
            <Field label="Boutique assignée"
              hint={form.role === "SUPER_ADMIN" ? "Les Super Admins n'ont pas de boutique" : undefined}>
              <select
                value={form.shop}
                onChange={e => set("shop")(e.target.value)}
                disabled={form.role === "SUPER_ADMIN"}
                style={{ ...inputStyle, cursor: form.role === "SUPER_ADMIN" ? "not-allowed" : "pointer", opacity: form.role === "SUPER_ADMIN" ? 0.5 : 1 }}
              >
                <option value="">Aucune boutique</option>
                {shops.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          ) : (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 9, padding: "12px 14px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600, marginBottom: 4 }}>
                Boutique assignée automatiquement
              </div>
              <div style={{ fontSize: 13.5, color: "#0F172A", fontWeight: 600 }}>
                {user?.shop_name ?? "Votre boutique"}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => navigate(`${basePath}/users`)}>
              Annuler
            </Btn>
            <Btn onClick={handleSubmit} disabled={loading}>
              {loading ? "Création..." : "Créer l'utilisateur"}
            </Btn>
          </div>
        </div>

        {/* Panneau info rôles */}
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 14, padding: 22,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Droits par rôle
          </div>
          {[
            {
              role: "Super Admin", color: "#1D4ED8", bg: "#EFF6FF",
              perms: ["Accès complet", "Gestion multi-boutiques", "Validation inventaires", "Gestion utilisateurs"],
            },
            {
              role: "Manager", color: "#15803D", bg: "#F0FDF4",
              perms: ["Gestion de sa boutique", "Création d'employés", "Transferts de stock", "Démarrage inventaires"],
            },
            {
              role: "Employé", color: "#6D28D9", bg: "#F5F3FF",
              perms: ["Lecture produits/stocks", "Comptage inventaire", "Historique mouvements"],
            },
          ].map(r => (
            <div key={r.role} style={{
              background: r.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 8 }}>
                {r.role}
              </div>
              {r.perms.map(p => (
                <div key={p} style={{ fontSize: 12, color: r.color, opacity: 0.8, marginBottom: 3, display: "flex", gap: 6 }}>
                  <span>✓</span><span>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
