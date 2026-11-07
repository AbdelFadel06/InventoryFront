// src/components/NotificationBell.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/format";
import axiosInstance from "../api/axiosInstance";

interface OpenIssue {
  id: number;
  sale: number;
  sale_reference: string;
  sale_total: string;
  reason_label: string;
  comment: string;
  shop: number;
  shop_name: string;
  reported_by_name: string | null;
  created_at: string;
}

const REFRESH_MS = 60_000;
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

const BELL_PATH = "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0";

/**
 * Cloche du manager : ventes signalées et non traitées, dans toutes ses boutiques.
 * Un clic bascule sur la bonne boutique et ouvre la vente.
 */
export default function NotificationBell() {
  const { user, activeShop, managedShops, setActiveShop } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = user?.role === "SHOP_MANAGER";
  const [issues, setIssues] = useState<OpenIssue[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!isManager) return;
    axiosInstance.get("/sale-issues/", { params: { status: "open", scope: "all", page_size: 10 } })
      .then(res => {
        setIssues(res.data.results ?? res.data);
        setCount(res.data.count ?? (res.data.results ?? res.data).length);
      })
      .catch(() => { /* la cloche ne doit jamais gêner l'écran */ });
  }, [isManager]);

  // Au chargement, à chaque changement de page, toutes les minutes et au retour sur l'onglet.
  useEffect(() => { load(); }, [load, location.pathname]);
  useEffect(() => {
    if (!isManager) return;
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener("focus", load);
    return () => { clearInterval(timer); window.removeEventListener("focus", load); };
  }, [isManager, load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!isManager) return null;

  const openIssue = (issue: OpenIssue) => {
    setOpen(false);
    if (activeShop?.id !== issue.shop) {
      const shop = managedShops.find(s => s.id === issue.shop);
      if (shop) setActiveShop(shop);
    }
    navigate(`/manager/signalements?sale=${issue.sale}`);
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        aria-label={count ? `${count} vente${count > 1 ? "s" : ""} signalée${count > 1 ? "s" : ""}` : "Notifications"}
        aria-expanded={open}
        onClick={() => { setOpen(o => !o); load(); }}
        style={{
          width: 36, height: 36, borderRadius: 8, background: open ? "#E2E8F0" : "#F1F5F9",
          border: "none", cursor: "pointer", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
        }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={BELL_PATH} />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px",
            borderRadius: 9, background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Ventes signalées" style={{
          position: "absolute", right: 0, top: 44, zIndex: 400,
          width: "min(360px, calc(100vw - 32px))", maxHeight: "70vh", overflowY: "auto",
          background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0",
          boxShadow: "0 12px 32px rgba(15,23,42,0.15)",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            Ventes signalées {count > 0 && <span style={{ color: "#DC2626" }}>({count})</span>}
          </div>

          {issues.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
              Rien à traiter pour le moment.
            </div>
          ) : issues.map(issue => (
            <button key={issue.id} onClick={() => openIssue(issue)} style={{
              width: "100%", textAlign: "left", padding: "12px 16px", border: "none",
              borderBottom: "1px solid #F1F5F9", background: "#fff", cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", gap: 3,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                <strong style={{ fontFamily: "monospace", color: "#0F172A" }}>{issue.sale_reference}</strong>
                <span style={{ color: "#0F172A", fontWeight: 600 }}>{fmtPrice(issue.sale_total)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#B45309" }}>
                {issue.reason_label}{issue.comment && ` : ${issue.comment}`}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>
                {issue.shop_name} · {issue.reported_by_name ?? "—"} · {formatDateTime(issue.created_at)}
              </div>
            </button>
          ))}

          <button onClick={() => { setOpen(false); navigate("/manager/signalements"); }} style={{
            width: "100%", padding: "11px 16px", border: "none", background: "#F8FAFC", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: "#2563EB", fontFamily: "inherit",
          }}>
            Ouvrir la page Signalements
          </button>
        </div>
      )}
    </div>
  );
}
