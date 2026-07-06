// src/pages/auth/ResetPasswordPage.tsx
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

export default function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const uid   = params.get("uid")   ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const invalid = !uid || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      await axiosInstance.post("/auth/password-reset/confirm/", { uid, token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Une erreur est survenue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0F172A 0%,#1E293B 50%,#0F172A 100%)",
      padding: 20, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", padding: "32px 36px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>ShopM</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            {invalid ? "Lien invalide" : success ? "Mot de passe modifié !" : "Nouveau mot de passe"}
          </div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>
            {invalid
              ? "Ce lien est invalide ou a expiré."
              : success
              ? "Redirection vers la connexion…"
              : "Choisissez un nouveau mot de passe pour votre compte."}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "32px 36px 36px" }}>

          {/* Lien invalide */}
          {invalid && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#FEF2F2", border: "2px solid #FECACA",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 28,
              }}>✕</div>
              <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
                Ce lien de réinitialisation est invalide ou a expiré.<br/>
                Demandez un nouveau lien.
              </div>
              <Link to="/forgot-password" style={{
                display: "inline-block",
                background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                color: "#fff", textDecoration: "none",
                padding: "12px 28px", borderRadius: 10,
                fontWeight: 600, fontSize: 14,
              }}>
                Demander un nouveau lien
              </Link>
            </div>
          )}

          {/* Succès */}
          {!invalid && success && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#F0FDF4", border: "2px solid #BBF7D0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 28,
              }}>✓</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                Mot de passe modifié !
              </div>
              <div style={{ fontSize: 13.5, color: "#64748B", marginBottom: 24 }}>
                Vous allez être redirigé vers la page de connexion dans quelques secondes.
              </div>
              <Link to="/login" style={{ color: "#3B82F6", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                Aller à la connexion →
              </Link>
            </div>
          )}

          {/* Formulaire */}
          {!invalid && !success && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", borderRadius: 10, padding: "10px 14px",
                  fontSize: 13.5, marginBottom: 18,
                }}>
                  {error}
                </div>
              )}

              {/* Nouveau mot de passe */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                  Nouveau mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoFocus
                    required
                    style={{
                      width: "100%", padding: "12px 44px 12px 14px",
                      border: "1.5px solid #E2E8F0", borderRadius: 10,
                      fontSize: 14, color: "#0F172A", outline: "none",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16,
                  }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <div style={{ fontSize: 11.5, color: "#F97316", marginTop: 5 }}>
                    {8 - password.length} caractère(s) manquant(s)
                  </div>
                )}
              </div>

              {/* Confirmer */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: `1.5px solid ${confirm && confirm !== password ? "#EF4444" : confirm && confirm === password ? "#22C55E" : "#E2E8F0"}`,
                    borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                  onFocus={e => { if (!confirm || confirm === password) e.target.style.borderColor = "#3B82F6"; }}
                  onBlur={e => { e.target.style.borderColor = confirm && confirm !== password ? "#EF4444" : confirm === password ? "#22C55E" : "#E2E8F0"; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "#94A3B8" : "linear-gradient(135deg,#10B981,#059669)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(16,185,129,0.4)",
                }}
              >
                {loading ? "Enregistrement…" : "Définir mon mot de passe"}
              </button>

              <div style={{ textAlign: "center", marginTop: 18 }}>
                <Link to="/login" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>
                  ← Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
