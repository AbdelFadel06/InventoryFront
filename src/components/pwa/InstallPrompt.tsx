"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Déjà installée ?
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Déjà refusé ?
    if (localStorage.getItem("pwa-install-dismissed")) return;

    // iOS — pas d'API beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: 440,
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: 16,
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      padding: "16px 20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "#0F172A",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#3B82F6", fontWeight: 900, fontSize: 22 }}>S</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
            Installer ShopM
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
            {isIOS
              ? "Ajoutez l'app sur votre écran d'accueil"
              : "Accédez directement depuis votre écran d'accueil"}
          </div>
        </div>

        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 20, padding: 4, lineHeight: 1, flexShrink: 0 }}>
          ×
        </button>
      </div>

      {/* iOS guide */}
      {isIOS && showIOSGuide && (
        <div style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#374151",
        }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Comment installer sur iPhone :</div>
          <div>1. Appuyez sur <strong>⬆ Partager</strong> en bas de Safari</div>
          <div>2. Sélectionnez <strong>« Sur l'écran d'accueil »</strong></div>
          <div>3. Appuyez sur <strong>Ajouter</strong></div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {isIOS ? (
          <button
            onClick={() => setShowIOSGuide(!showIOSGuide)}
            style={{
              flex: 1, padding: "10px 16px",
              background: "#0F172A", color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {showIOSGuide ? "Fermer le guide" : "Voir comment installer"}
          </button>
        ) : (
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              flex: 1, padding: "10px 16px",
              background: installing ? "#94A3B8" : "#1D4ED8",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              cursor: installing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
          >
            {installing ? "Installation..." : "Installer l'application"}
          </button>
        )}
        <button
          onClick={dismiss}
          style={{
            padding: "10px 16px", background: "#F8FAFC",
            color: "#64748B", border: "1px solid #E2E8F0",
            borderRadius: 10, fontSize: 13, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
