// src/components/NotificationBell.tsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/format";
import axiosInstance from "../api/axiosInstance";
import type { UserRole } from "../types/user";

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

interface StockCounts { out_of_stock: number; critical: number; low: number }

const REFRESH_MS = 60_000;
const EMPTY_STOCK: StockCounts = { out_of_stock: 0, critical: 0, low: 0 };
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Page des stocks de chaque rôle ; le livreur n'a pas d'alerte de stock. */
const STOCK_PAGE: Partial<Record<UserRole, string>> = {
  SUPER_ADMIN:  "/admin/stocks",
  SHOP_MANAGER: "/manager/stocks",
  EMPLOYEE:     "/employee/stocks",
  MAGASINIER:   "/magasinier/stock",
};

const BELL_PATH = "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0";

function Glyph({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICON = {
  out:     "M12 22a10 10 0 100-20 10 10 0 000 20z M15 9l-6 6 M9 9l6 6",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  low:     "M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6",
  flag:    "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  chevron: "M9 18l6-6-6-6",
  close:   "M18 6L6 18 M6 6l12 12",
};

/** Ligne de notification : un compteur et un lien vers la page à traiter. */
function NotificationRow({ icon, color, background, title, subtitle, onClick }: {
  icon: string; color: string; background: string; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      border: "1px solid #F1F5F9", borderRadius: 12, background: "#fff", cursor: "pointer",
      textAlign: "left", fontFamily: "inherit",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
    >
      <span style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0, background, color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Glyph d={icon} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "#64748B", marginTop: 2 }}>{subtitle}</span>
      </span>
      <span style={{ color: "#CBD5E1" }}><Glyph d={ICON.chevron} size={16} /></span>
    </button>
  );
}

/**
 * Cloche du topbar : alertes de stock de la boutique et ventes signalées de toutes les boutiques gérées.
 * Un clic ouvre un panneau latéral ; chaque notification mène à la page qui la traite.
 */
export default function NotificationBell() {
  const { user, activeShop, managedShops, setActiveShop } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;
  const stockPage = role ? STOCK_PAGE[role] : undefined;
  const isManager = role === "SHOP_MANAGER";

  const [stock, setStock] = useState<StockCounts>(EMPTY_STOCK);
  const [issues, setIssues] = useState<OpenIssue[]>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    // Chaque source est indépendante : l'échec de l'une ne vide pas l'autre.
    if (stockPage) {
      axiosInstance.get("/stocks/alerts/", { params: { type: "all" } })
        .then(res => {
          const stocks: { stock_status: string }[] = res.data?.stocks ?? [];
          setStock({
            out_of_stock: stocks.filter(s => s.stock_status === "out_of_stock").length,
            critical:     stocks.filter(s => s.stock_status === "critical").length,
            low:          stocks.filter(s => s.stock_status === "low").length,
          });
        })
        .catch(() => {});
    }
    if (isManager) {
      axiosInstance.get("/sale-issues/", { params: { status: "open", scope: "all", page_size: 5 } })
        .then(res => {
          const rows: OpenIssue[] = res.data?.results ?? res.data ?? [];
          setIssues(rows);
          setIssueCount(res.data?.count ?? rows.length);
        })
        .catch(() => {});
    }
  }, [stockPage, isManager]);

  // Au chargement, à chaque page, quand la boutique change, toutes les minutes et au retour sur l'onglet.
  useEffect(() => { load(); }, [load, location.pathname, activeShop?.id]);
  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener("focus", load);
    return () => { clearInterval(timer); window.removeEventListener("focus", load); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!stockPage && !isManager) return null;

  const total = issueCount + stock.out_of_stock + stock.critical + stock.low;

  const go = (path: string) => { setOpen(false); navigate(path); };

  const openIssue = (issue: OpenIssue) => {
    if (activeShop?.id !== issue.shop) {
      const shop = managedShops.find(s => s.id === issue.shop);
      if (shop) setActiveShop(shop);
    }
    go(`/manager/signalements?sale=${issue.sale}`);
  };

  const shopLabel = role === "SUPER_ADMIN"
    ? "Toutes les boutiques"
    : activeShop?.name ?? user?.shop_name ?? "Votre boutique";

  return (
    <>
      <button
        aria-label={total ? `${total} notification${total > 1 ? "s" : ""}` : "Notifications"}
        aria-expanded={open}
        onClick={() => { setOpen(true); load(); }}
        style={{
          width: 36, height: 36, borderRadius: 8, background: "#F1F5F9",
          border: "none", cursor: "pointer", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
        }}>
        <Glyph d={BELL_PATH} size={16} />
        {total > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px",
            borderRadius: 9, background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
          }}>
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.35)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <aside role="dialog" aria-modal="true" aria-label="Notifications" onClick={e => e.stopPropagation()} style={{
            width: "min(400px, 100vw)", height: "100%", background: "#F8FAFC",
            boxShadow: "-12px 0 32px rgba(15,23,42,0.18)", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "16px 18px", background: "#fff", borderBottom: "1px solid #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Notifications</div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                  {total === 0 ? "Tout est en ordre" : plural(total, "élément") + " à regarder"}
                </div>
              </div>
              <button aria-label="Fermer" onClick={() => setOpen(false)} style={{
                width: 34, height: 34, borderRadius: 8, border: "none", background: "#F1F5F9",
                color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Glyph d={ICON.close} size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {total === 0 && (
                <div style={{ padding: "40px 12px", textAlign: "center", fontSize: 13.5, color: "#94A3B8" }}>
                  Aucune notification pour le moment.
                </div>
              )}

              {issueCount > 0 && (
                <>
                  <NotificationRow
                    icon={ICON.flag} color="#B45309" background="#FFFBEB"
                    title={`${plural(issueCount, "vente")} signalée${issueCount > 1 ? "s" : ""}`}
                    subtitle="Toutes vos boutiques · à traiter"
                    onClick={() => go("/manager/signalements")}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 12, borderLeft: "2px solid #FDE68A", marginLeft: 18 }}>
                    {issues.map(issue => (
                      <button key={issue.id} onClick={() => openIssue(issue)} style={{
                        textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none",
                        background: "transparent", cursor: "pointer", fontFamily: "inherit",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                  </div>
                </>
              )}

              {stockPage && stock.out_of_stock > 0 && (
                <NotificationRow
                  icon={ICON.out} color="#DC2626" background="#FEF2F2"
                  title={`${plural(stock.out_of_stock, "produit")} en rupture`}
                  subtitle={`${shopLabel} · stock à 0`}
                  onClick={() => go(`${stockPage}?status=out_of_stock`)}
                />
              )}
              {stockPage && stock.critical > 0 && (
                <NotificationRow
                  icon={ICON.warning} color="#C2410C" background="#FFF7ED"
                  title={`${plural(stock.critical, "produit")} en stock critique`}
                  subtitle={`${shopLabel} · sous le minimum`}
                  onClick={() => go(`${stockPage}?status=critical`)}
                />
              )}
              {stockPage && stock.low > 0 && (
                <NotificationRow
                  icon={ICON.low} color="#7C3AED" background="#F5F3FF"
                  title={`${plural(stock.low, "produit")} en stock bas`}
                  subtitle={`${shopLabel} · à réapprovisionner`}
                  onClick={() => go(`${stockPage}?status=low`)}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
