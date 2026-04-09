// src/pages/NotFoundPage.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN:  "/admin",
  SHOP_MANAGER: "/manager",
  EMPLOYEE:     "/employee",
  LIVREUR:      "/livreur",
  MAGASINIER:   "/magasinier",
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const goHome = () => {
    if (isAuthenticated && user?.role) {
      navigate(ROLE_HOME[user.role] ?? "/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .nf-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #F4F6FB;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          text-align: center;
        }

        .nf-code {
          font-family: 'Sora', sans-serif;
          font-size: 120px;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, #1D4ED8, #3B82F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -4px;
          margin-bottom: 16px;
        }

        .nf-title {
          font-family: 'Sora', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .nf-sub {
          font-size: 15px;
          color: #64748B;
          max-width: 360px;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .nf-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, #1D4ED8, #3B82F6);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(59,130,246,0.35);
          transition: opacity 0.15s;
        }
        .nf-btn:hover { opacity: 0.88; }

        .nf-icon {
          width: 80px;
          height: 80px;
          background: rgba(59,130,246,0.08);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
      `}</style>

      <div className="nf-root">
        <div className="nf-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <line x1="11" y1="8" x2="11" y2="11"/>
            <line x1="11" y1="14" x2="11.01" y2="14"/>
          </svg>
        </div>
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page introuvable</h1>
        <p className="nf-sub">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <button className="nf-btn" onClick={goHome}>
          Retour à l'accueil
        </button>
      </div>
    </>
  );
}
