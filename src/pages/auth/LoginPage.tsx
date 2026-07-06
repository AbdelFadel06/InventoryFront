// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate("/", { replace: true });
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: #F4F6FB;
        }

        /* ── Left panel ── */
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 64px;
          background: #fff;
          min-width: 0;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .login-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #1D4ED8, #3B82F6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-logo-text {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #0F172A;
          letter-spacing: -0.4px;
        }

        .login-form-area {
          max-width: 380px;
          width: 100%;
          margin: 0 auto;
        }

        .login-heading {
          font-family: 'Sora', sans-serif;
          font-size: 30px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.8px;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .login-sub {
          font-size: 14px;
          color: #94A3B8;
          margin-bottom: 36px;
          line-height: 1.5;
        }

        .login-field {
          margin-bottom: 20px;
        }
        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .login-input-wrap {
          position: relative;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #FAFBFF;
        }
        .login-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          background: #fff;
        }
        .login-input.has-icon { padding-right: 44px; }

        .login-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94A3B8; font-size: 16px; line-height: 1;
          padding: 0;
        }

        .login-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 13.5px;
          color: #DC2626;
          margin-bottom: 20px;
        }

        .login-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #1D4ED8, #3B82F6);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(59,130,246,0.35);
          margin-top: 8px;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.88; }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-footer {
          font-size: 12.5px;
          color: #94A3B8;
          text-align: center;
        }

        /* ── Right panel ── */
        .login-right {
          width: 52%;
          background: linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 70%, #3B82F6 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 56px;
          position: relative;
          overflow: hidden;
        }

        /* Orbs de fond */
        .login-right::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -120px; right: -120px;
        }
        .login-right::after {
          content: '';
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          bottom: -80px; left: -60px;
        }

        .login-right-content {
          position: relative; z-index: 1;
          text-align: left;
          width: 100%;
          max-width: 440px;
        }

        .login-right-title {
          font-family: 'Sora', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.8px;
          margin-bottom: 16px;
        }
        .login-right-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.72);
          line-height: 1.6;
          margin-bottom: 48px;
        }

        /* Carte preview */
        .login-preview {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 18px;
          padding: 22px;
          animation: floatUp 0.8s ease both;
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .preview-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }

        .preview-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        .preview-stat {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .preview-stat-val {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 3px;
        }
        .preview-stat-lbl {
          font-size: 10.5px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
        }
        .preview-stat-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          margin-top: 4px;
        }
        .badge-green { background: rgba(34,197,94,0.25); color: #4ADE80; }
        .badge-red   { background: rgba(239,68,68,0.25);  color: #F87171; }
        .badge-blue  { background: rgba(147,197,253,0.25); color: #93C5FD; }

        .preview-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .preview-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12px;
        }
        .preview-row-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }
        .preview-row-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .preview-row-qty {
          font-weight: 700;
          color: #fff;
          font-size: 12.5px;
        }

        /* Features */
        .login-features {
          display: flex;
          gap: 16px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .login-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.7);
        }
        .login-feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .login-right { display: none; }
          .login-left  { padding: 32px 32px; }
        }
        @media (max-width: 480px) {
          .login-left { padding: 24px 20px; }
          .login-heading { font-size: 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Gauche : formulaire ── */}
        <div className="login-left">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <span className="login-logo-text">ShopM</span>
          </div>

          {/* Formulaire centré */}
          <div className="login-form-area">
            <h1 className="login-heading">Bon retour</h1>
            <p className="login-sub">
              Connectez-vous pour accéder à votre tableau de bord et gérer vos stocks.
            </p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label">Adresse email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="prenom.nom@email.com"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <label className="login-label">Mot de passe</label>
                <div className="login-input-wrap">
                  <input
                    className="login-input has-icon"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="current-password"
                  />
                  <button type="button" className="login-eye" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Masquer" : "Afficher"}>
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "right", marginBottom: 16, marginTop: -4 }}>
                <Link to="/forgot-password" style={{
                  fontSize: 13, color: "#3B82F6", textDecoration: "none", fontWeight: 500,
                }}>
                  Mot de passe oublié ?
                </Link>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="login-footer">
            © 2026 ShopM — Gestion commerciale
          </div>
        </div>

        {/* ── Droite : visuel ── */}
        <div className="login-right">
          <div className="login-right-content">

            <h2 className="login-right-title">
              Gérez vos stocks<br />sans effort.
            </h2>
            <p className="login-right-sub">
              Suivez vos inventaires, gérez vos boutiques et pilotez vos équipes depuis une seule interface.
            </p>

            {/* Preview card */}
            <div className="login-preview">
              <div className="preview-title">Aperçu tableau de bord</div>

              <div className="preview-stats">
                <div className="preview-stat">
                  <div className="preview-stat-val">12</div>
                  <div className="preview-stat-lbl">Boutiques</div>
                  <div className="preview-stat-badge badge-green">↑ actives</div>
                </div>
                <div className="preview-stat">
                  <div className="preview-stat-val">3</div>
                  <div className="preview-stat-lbl">Ruptures</div>
                  <div className="preview-stat-badge badge-red">urgent</div>
                </div>
                <div className="preview-stat">
                  <div className="preview-stat-val">94%</div>
                  <div className="preview-stat-lbl">Inventoriés</div>
                  <div className="preview-stat-badge badge-blue">en cours</div>
                </div>
              </div>

              <div className="preview-rows">
                {[
                  { name: "Chaussures Nike Air", qty: "48 unités",  color: "#4ADE80", status: "OK"       },
                  { name: "Sac à dos Adidas",    qty: "3 unités",   color: "#F87171", status: "Critique" },
                  { name: "Casquette New Era",   qty: "21 unités",  color: "#4ADE80", status: "OK"       },
                  { name: "T-shirt Jordan",      qty: "0 unités",   color: "#F87171", status: "Rupture"  },
                ].map(row => (
                  <div className="preview-row" key={row.name}>
                    <div className="preview-row-left">
                      <div className="preview-row-dot" style={{ background: row.color }} />
                      {row.name}
                    </div>
                    <div className="preview-row-qty">{row.qty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="login-features">
              {["Multi-boutiques", "Inventaires temps réel", "Transferts de stock", "Historique complet"].map(f => (
                <div className="login-feature" key={f}>
                  <div className="login-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
