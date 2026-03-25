// src/pages/admin/CreateUserPage.tsx
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { userService }         from "../../services/userService";
import { shopService }         from "../../services/shopService";
import { useAuth }             from "../../context/AuthContext";
import { PageHeader, Btn }     from "../../components/ui";
import type { Shop }           from "../../types/shop";
import type { UserRole, Gender } from "../../types/user";
import { normalizeBeninPhone } from "../../utils/format";

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box" as const,
  background: "#fff",
};

const disabledInputStyle = {
  ...inputStyle,
  background: "#F8FAFC", color: "#94A3B8",
  cursor: "not-allowed", opacity: 0.7,
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
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const backPath     = isSuperAdmin ? "/admin" : "/manager";

  const [shops, setShops]     = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    email:            "",
    password:         "",
    password_confirm: "",
    first_name:       "",
    last_name:        "",
    phone_number:     "",
    gender:           "" as Gender | "",
    date_of_birth:    "",
    role:             "EMPLOYEE" as UserRole,
    shop:             isSuperAdmin ? ("" as number | "") : (currentUser?.shop ?? ""),
  });

  useEffect(() => {
    if (isSuperAdmin) {
      shopService.getAll().then(res => setShops(res.results ?? res));
    }
  }, [isSuperAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Force du mot de passe
  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)           score++;
    if (p.length >= 12)          score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p))  score++;
    if (score <= 1) return { label: "Faible", color: "#EF4444", width: "25%"  };
    if (score <= 2) return { label: "Moyen",  color: "#F97316", width: "50%"  };
    if (score <= 3) return { label: "Bon",    color: "#EAB308", width: "75%"  };
    return               { label: "Fort",   color: "#22C55E", width: "100%" };
  })();

  const pwdMatch = form.password_confirm
    ? form.password === form.password_confirm
    : null;

  const needsShop = form.role !== "SUPER_ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.password_confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (needsShop && !form.shop) {
      setError("Veuillez sélectionner une boutique.");
      return;
    }

    setLoading(true);
    try {
      await userService.create({
        email:            form.email,
        password:         form.password,
        password_confirm: form.password_confirm,
        first_name:       form.first_name,
        last_name:        form.last_name,
        phone_number:     form.phone_number ? normalizeBeninPhone(form.phone_number) : undefined,
        gender:           (form.gender as Gender) || undefined,
        date_of_birth:    form.date_of_birth || undefined,
        role:             form.role,
        shop:             form.shop !== "" ? Number(form.shop) : undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate(backPath), 1500);
    } catch (err: unknown) {
      setError("Erreur lors de la création. Vérifiez les informations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isSuperAdmin ? "Nouvel utilisateur" : "Nouvel employé"}
        subtitle={isSuperAdmin
          ? "Créer un compte Super Admin, Manager ou Employé"
          : `Boutique : ${currentUser?.shop_name ?? "votre boutique"}`}
        action={
          <Btn variant="secondary" onClick={() => navigate(backPath)}>
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

          {success && (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              color: "#15803D", borderRadius: 9, padding: "10px 14px",
              fontSize: 13.5, marginBottom: 20,
            }}>
              Utilisateur créé avec succès ! Redirection...
            </div>
          )}

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: 9, padding: "10px 14px",
              fontSize: 13.5, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <SectionTitle>Identité</SectionTitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Prénom" required>
                <input name="first_name" value={form.first_name} onChange={handleChange}
                  placeholder="Ex: Abdel" required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <Field label="Nom" required>
                <input name="last_name" value={form.last_name} onChange={handleChange}
                  placeholder="Ex: SALIOU" required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Genre">
                <select name="gender" value={form.gender} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Sélectionner --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="O">Autre</option>
                </select>
              </Field>
              <Field label="Téléphone">
                <input name="phone_number" value={form.phone_number} onChange={handleChange}
                  placeholder="+229 97 00 00 00" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
            </div>

            <Field label="Date de naissance">
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>

            <SectionTitle>Compte</SectionTitle>

            <Field label="Email" required>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="prenom.nom@email.com" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>

            {/* Mot de passe avec indicateur de force */}
            <Field label="Mot de passe" required hint="Minimum 8 caractères">
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14 }}>
                  {showPwd ? "●" : "○"}
                </button>
              </div>
              {pwdStrength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2 }}>
                    <div style={{
                      height: 4, borderRadius: 2,
                      width: pwdStrength.width, background: pwdStrength.color,
                      transition: "width 0.3s, background 0.3s",
                    }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: pwdStrength.color, fontWeight: 600, marginTop: 3, display: "block" }}>
                    Force : {pwdStrength.label}
                  </span>
                </div>
              )}
            </Field>

            {/* Confirmation mot de passe */}
            <Field label="Confirmer le mot de passe" required>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="password_confirm"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: pwdMatch === null ? "#E2E8F0" : pwdMatch ? "#22C55E" : "#EF4444",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e  => (e.target.style.borderColor = pwdMatch === null ? "#E2E8F0" : pwdMatch ? "#22C55E" : "#EF4444")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14 }}>
                  {showConfirm ? "●" : "○"}
                </button>
              </div>
              {pwdMatch !== null && (
                <span style={{ fontSize: 11.5, fontWeight: 600, marginTop: 4, display: "block", color: pwdMatch ? "#15803D" : "#DC2626" }}>
                  {pwdMatch ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                </span>
              )}
            </Field>

            <SectionTitle>Rôle & Boutique</SectionTitle>

            <Field label="Rôle" required>
              {isSuperAdmin ? (
                <select name="role" value={form.role} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }} required>
                  <option value="EMPLOYEE">Employé</option>
                  <option value="LIVREUR">Livreur</option>
                  <option value="SHOP_MANAGER">Manager de boutique</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              ) : (
                <select name="role" value={form.role} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="EMPLOYEE">Employé</option>
                  <option value="LIVREUR">Livreur</option>
                </select>
              )}
            </Field>

            {needsShop && (
              <Field label="Boutique" required>
                {isSuperAdmin ? (
                  <select name="shop" value={form.shop} onChange={handleChange}
                    style={{ ...inputStyle, cursor: "pointer" }} required>
                    <option value="">-- Sélectionner une boutique --</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input value={currentUser?.shop_name ?? ""} disabled style={disabledInputStyle} />
                )}
              </Field>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => navigate(backPath)}>
                Annuler
              </Btn>
              <Btn type="submit" disabled={loading}>
                {loading ? "Création en cours..." : "Créer l'utilisateur"}
              </Btn>
            </div>

          </form>
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
            { role: "Super Admin", color: "#1D4ED8", bg: "#EFF6FF", perms: ["Accès complet", "Gestion multi-boutiques", "Validation inventaires", "Gestion utilisateurs"] },
            { role: "Manager",     color: "#15803D", bg: "#F0FDF4", perms: ["Gestion de sa boutique", "Création d'employés", "Transferts de stock", "Démarrage inventaires"] },
            { role: "Employé",     color: "#6D28D9", bg: "#F5F3FF", perms: ["Lecture produits/stocks", "Comptage inventaire", "Historique mouvements"] },
          ].map(r => (
            <div key={r.role} style={{ background: r.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.role}</div>
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
