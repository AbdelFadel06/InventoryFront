// src/pages/auth/ForgotPasswordPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Veuillez saisir votre adresse email."); return; }
    setLoading(true);
    try {
      await axiosInstance.post("/auth/password-reset/", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Une erreur est survenue. Réessayez.";
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
            Mot de passe oublié ?
          </div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>
            Saisissez votre email et nous vous enverrons un lien de réinitialisation.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "32px 36px 36px" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#F0FDF4", border: "2px solid #BBF7D0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 28,
              }}>
                ✓
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                Email envoyé !
              </div>
              <div style={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6, marginBottom: 28 }}>
                Si un compte existe pour <strong>{email}</strong>, vous allez recevoir
                un email avec un lien de réinitialisation valable 3 jours.
              </div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>
                Vérifiez aussi votre dossier spam.
              </div>
              <Link to="/login" style={{
                display: "inline-block", color: "#3B82F6", fontWeight: 600,
                fontSize: 14, textDecoration: "none",
              }}>
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoFocus
                  required
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: "1.5px solid #E2E8F0", borderRadius: 10,
                    fontSize: 14, color: "#0F172A", outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "#94A3B8" : "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(59,130,246,0.4)",
                }}
              >
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Link to="/login" style={{ fontSize: 13.5, color: "#64748B", textDecoration: "none" }}>
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
