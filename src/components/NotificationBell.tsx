// src/components/NotificationBell.tsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/format";
import axiosInstance from "../api/axiosInstance";
import { disablePush, enablePush, getPushState, sendTestPush, type PushState } from "../services/pushService";

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
interface ShopStock extends StockCounts { shopId: number; shopName: string }

const REFRESH_MS = 60_000;
const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
const sum = (rows: ShopStock[], key: keyof StockCounts) => rows.reduce((t, r) => t + r[key], 0);

const STOCK_ROWS: { key: keyof StockCounts; icon: "out" | "warning" | "low"; color: string; background: string; label: string; hint: string }[] = [
  { key: "out_of_stock", icon: "out",     color: "#DC2626", background: "#FEF2F2", label: "en rupture",       hint: "stock à 0" },
  { key: "critical",     icon: "warning", color: "#C2410C", background: "#FFF7ED", label: "en stock critique", hint: "sous le minimum" },
  { key: "low",          icon: "low",     color: "#7C3AED", background: "#F5F3FF", label: "en stock bas",      hint: "à réapprovisionner" },
];

const PUSH_TEXT: Record<PushState, string> = {
  "loading":        "",
  "unsupported":    "Ce navigateur ne permet pas les notifications.",
  "needs-install":  "Sur iPhone : touchez Partager puis « Sur l'écran d'accueil », et ouvrez ShopM depuis cette icône pour activer les notifications.",
  "not-configured": "Les notifications sur téléphone ne sont pas encore disponibles.",
  "denied":         "Notifications bloquées : autorisez-les pour ShopM dans les réglages du téléphone.",
  "off":            "Recevez les ventes signalées et les ruptures, même appli fermée.",
  "on":             "Activées sur cet appareil.",
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

/** Activer ou couper les notifications sur l'appareil en cours. */
function PushSettings() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => { getPushState().then(setState).catch(() => setState("unsupported")); }, []);

  const run = async (action: () => Promise<PushState>) => {
    setBusy(true); setNote("");
    try { setState(await action()); }
    catch { setNote("Impossible pour le moment. Réessayez."); }
    finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true); setNote("");
    try { await sendTestPush(); setNote("Notification d'essai envoyée."); }
    catch { setNote("Envoi impossible pour le moment."); }
    finally { setBusy(false); }
  };

  if (state === "loading") return null;

  const button = (label: string, onClick: () => void, primary = false) => (
    <button disabled={busy} onClick={onClick} style={{
      padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
      cursor: busy ? "wait" : "pointer", border: primary ? "none" : "1px solid #E2E8F0",
      background: primary ? "#0F172A" : "#fff", color: primary ? "#fff" : "#334155",
    }}>{label}</button>
  );

  return (
    <div style={{ padding: "14px 18px", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>Sur ce téléphone</div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 3 }}>{PUSH_TEXT[state]}</div>
      {(state === "off" || state === "on") && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {state === "off" && button("Activer les notifications", () => run(enablePush), true)}
          {state === "on" && button("Envoyer un essai", test)}
          {state === "on" && button("Désactiver", () => run(disablePush))}
        </div>
      )}
      {note && <div role="status" style={{ fontSize: 12.5, color: "#475569", marginTop: 8 }}>{note}</div>}
    </div>
  );
}

/**
 * Cloche du topbar, réservée aux managers : ventes signalées et alertes de stock
 * de toutes leurs boutiques. Un clic ouvre un panneau latéral ; chaque notification
 * mène à la page qui la traite, sur la bonne boutique.
 */
export default function NotificationBell() {
  const { user, activeShop, managedShops, setActiveShop } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = user?.role === "SHOP_MANAGER";

  const [stock, setStock] = useState<ShopStock[]>([]);
  const [issues, setIssues] = useState<OpenIssue[]>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (!isManager) return;
    // Chaque source est indépendante : l'échec de l'une ne vide pas l'autre.
    Promise.all(managedShops.map(shop =>
      axiosInstance.get("/stocks/alerts/", { params: { type: "all" }, headers: { "X-Active-Shop": String(shop.id) } })
        .then(res => {
          const stocks: { stock_status: string }[] = res.data?.stocks ?? [];
          const count = (status: string) => stocks.filter(s => s.stock_status === status).length;
          return { shopId: shop.id, shopName: shop.name, out_of_stock: count("out_of_stock"), critical: count("critical"), low: count("low") };
        })
        .catch(() => null)
    )).then(rows => setStock(rows.filter((r): r is ShopStock => r !== null)));

    axiosInstance.get("/sale-issues/", { params: { status: "open", scope: "all", page_size: 5 } })
      .then(res => {
        const rows: OpenIssue[] = res.data?.results ?? res.data ?? [];
        setIssues(rows);
        setIssueCount(res.data?.count ?? rows.length);
      })
      .catch(() => {});
  }, [isManager, managedShops]);

  // Au chargement, à chaque page, toutes les minutes et au retour sur l'onglet.
  useEffect(() => { load(); }, [load, location.pathname]);
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

  if (!isManager) return null;

  const total = issueCount + sum(stock, "out_of_stock") + sum(stock, "critical") + sum(stock, "low");

  const go = (path: string, shopId?: number) => {
    if (shopId && activeShop?.id !== shopId) {
      const shop = managedShops.find(s => s.id === shopId);
      if (shop) setActiveShop(shop);
    }
    setOpen(false);
    navigate(path);
  };

  const openIssue = (issue: OpenIssue) => go(`/manager/signalements?sale=${issue.sale}`, issue.shop);

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

              {STOCK_ROWS.flatMap(row => stock.filter(s => s[row.key] > 0).map(s => (
                <NotificationRow
                  key={`${row.key}-${s.shopId}`}
                  icon={ICON[row.icon]} color={row.color} background={row.background}
                  title={`${plural(s[row.key], "produit")} ${row.label}`}
                  subtitle={`${s.shopName} · ${row.hint}`}
                  onClick={() => go(`/manager/stocks?status=${row.key}`, s.shopId)}
                />
              )))}
            </div>
            <PushSettings />
          </aside>
        </div>
      )}
    </>
  );
}
