// src/pages/manager/LivreurListPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, StatCard, Icon } from "../../components/ui";
import { userService } from "../../services/userService";
import api from "../../api/axiosInstance";
import type { User } from "../../types/user";

interface LivreurStat {
  livreur_id:      number;
  livreur_name:    string;
  total_colis:     number;
  colis_payes:     number;
  colis_non_payes: number;
  montant_total:   number;
}

interface Delivery {
  id:               number;
  reference:        string;
  total_amount:     string;
  payment_status:   "paid" | "pending";
  livreur_paid:     boolean;
  client_phone:     string | null;
  delivery_address: string | null;
  created_at:       string;
  cashier_name:     string | null;
  items_count:      number;
}

const fmtPrice = (n: number | string) =>
  Number(n).toLocaleString("fr-FR") + " F";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// ── Modal détail livreur ───────────────────────────────────────────
function LivreurDetailModal({
  livreur, shopId, onClose, onPaid,
}: {
  livreur: LivreurStat;
  shopId: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState(false);
  const [tab, setTab]               = useState<"all" | "unpaid">("unpaid");

  useEffect(() => {
    api.get("/sales/", { params: { sale_type: "delivery", livreur: livreur.livreur_id, date: undefined } })
      .then(r => setDeliveries((r.data.results ?? r.data) as Delivery[]))
      .finally(() => setLoading(false));
  }, [livreur.livreur_id]);

  const unpaid = deliveries.filter(d => !d.livreur_paid);
  const shown  = tab === "unpaid" ? unpaid : deliveries;

  const handlePayAll = async () => {
    if (unpaid.length === 0) return;
    setPaying(true);
    try {
      await api.post("/sales/mark_livreur_paid_bulk/", {
        livreur_id: livreur.livreur_id,
        sale_ids:   unpaid.map(d => d.id),
      });
      onPaid();
      onClose();
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Suivi livreur
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{livreur.livreur_name}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{livreur.total_colis} colis</span>
                <span style={{ fontSize: 12, color: "#4ADE80" }}>{livreur.colis_payes} payés</span>
                <span style={{ fontSize: 12, color: "#FBBF24" }}>{livreur.colis_non_payes} en attente</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #F1F5F9", padding: "0 24px" }}>
          {([["unpaid", "Non payés"], ["all", "Tous"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: tab === key ? 700 : 400, color: tab === key ? "#0F172A" : "#94A3B8", borderBottom: tab === key ? "2px solid #0F172A" : "2px solid transparent", marginBottom: -1 }}>
              {label} {key === "unpaid" ? `(${livreur.colis_non_payes})` : `(${livreur.total_colis})`}
            </button>
          ))}
        </div>

        {/* Liste livraisons */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>Chargement...</div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>
              {tab === "unpaid" ? "Aucune commission en attente" : "Aucune livraison"}
            </div>
          ) : shown.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F8FAFC" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{d.reference}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>{fmtDate(d.created_at)}</span>
                  {d.client_phone && <span>📞 {d.client_phone}</span>}
                  {d.delivery_address && <span>📍 {d.delivery_address}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{fmtPrice(d.total_amount)}</div>
                <Badge
                  label={d.livreur_paid ? "Commission payée" : "En attente"}
                  color={d.livreur_paid ? "green" : "orange"}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            {livreur.colis_non_payes > 0
              ? <><strong style={{ color: "#0F172A" }}>{livreur.colis_non_payes}</strong> commission(s) en attente</>
              : <span style={{ color: "#15803D" }}>Tout est à jour ✓</span>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
            {livreur.colis_non_payes > 0 && (
              <Btn onClick={handlePayAll} disabled={paying}>
                {paying ? "Traitement..." : `Tout marquer payé (${livreur.colis_non_payes})`}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte livreur ─────────────────────────────────────────────────
function LivreurCard({ stat, onOpen }: { stat: LivreurStat; onOpen: () => void }) {
  const initials = stat.livreur_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const pct = stat.total_colis > 0 ? Math.round((stat.colis_payes / stat.total_colis) * 100) : 100;

  return (
    <div onClick={onOpen}
      style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: 20, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#0284C7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{stat.livreur_name}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{stat.total_colis} colis au total</div>
        </div>
        <Icon name="chevronRight" size={16} color="#CBD5E1" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D" }}>{stat.colis_payes}</div>
          <div style={{ fontSize: 11, color: "#16A34A", marginTop: 1 }}>Points payés</div>
        </div>
        <div style={{ background: stat.colis_non_payes > 0 ? "#FFFBEB" : "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: stat.colis_non_payes > 0 ? "#D97706" : "#94A3B8" }}>
            {stat.colis_non_payes}
          </div>
          <div style={{ fontSize: 11, color: stat.colis_non_payes > 0 ? "#B45309" : "#94A3B8", marginTop: 1 }}>Non payés</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Commissions réglées</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#3B82F6", borderRadius: 3, transition: "width 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────
export default function LivreurListPage() {
  const { activeShop } = useAuth();

  const [stats, setStats]         = useState<LivreurStat[]>([]);
  const [livreurs, setLivreurs]   = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<LivreurStat | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, livreursRes] = await Promise.all([
        api.get("/sales/livreur_stats/"),
        userService.getLivreurs(),
      ]);
      setStats(statsRes.data);
      setLivreurs(livreursRes as User[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeShop?.id]);

  const totalColis   = stats.reduce((s, l) => s + l.total_colis, 0);
  const totalPayes   = stats.reduce((s, l) => s + l.colis_payes, 0);
  const totalEnAttente = stats.reduce((s, l) => s + l.colis_non_payes, 0);

  // Livreurs sans livraisons (nouveaux)
  const statsIds    = new Set(stats.map(s => s.livreur_id));
  const noDelivery  = livreurs.filter(l => !statsIds.has(l.id));

  return (
    <div>
      <PageHeader
        title="Livreurs"
        subtitle={`Points et commissions · ${activeShop?.name ?? "Boutique"}`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Livreurs actifs"  value={livreurs.length}   icon={<Icon name="users" size={18} color="#0284C7" />} color="blue"   loading={loading} />
        <StatCard label="Total colis"      value={totalColis}        icon={<Icon name="shop"  size={18} color="#6D28D9" />} color="purple" loading={loading} />
        <StatCard label="Points payés"     value={totalPayes}        icon={<Icon name="checkCircle" size={18} color="#15803D" />} color="green"  loading={loading} />
        <StatCard label="En attente"       value={totalEnAttente}    icon={<Icon name="clock" size={18} color="#D97706" />} color="orange" loading={loading} />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: 60 }}>Chargement...</div>
      ) : livreurs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: 60, fontSize: 14 }}>
          Aucun livreur enregistré pour cette boutique.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {stats.map(stat => (
            <LivreurCard key={stat.livreur_id} stat={stat} onOpen={() => setSelected(stat)} />
          ))}
          {noDelivery.map(l => (
            <LivreurCard
              key={l.id}
              stat={{ livreur_id: l.id, livreur_name: l.full_name, total_colis: 0, colis_payes: 0, colis_non_payes: 0, montant_total: 0 }}
              onOpen={() => setSelected({ livreur_id: l.id, livreur_name: l.full_name, total_colis: 0, colis_payes: 0, colis_non_payes: 0, montant_total: 0 })}
            />
          ))}
        </div>
      )}

      {selected && (
        <LivreurDetailModal
          livreur={selected}
          shopId={activeShop?.id ?? 0}
          onClose={() => setSelected(null)}
          onPaid={() => { fetchData(); }}
        />
      )}
    </div>
  );
}
