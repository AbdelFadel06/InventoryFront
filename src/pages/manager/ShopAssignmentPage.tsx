// src/pages/manager/ShopAssignmentPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { shopService } from "../../services/shopService";
import { userService } from "../../services/userService";
import { PageHeader, Btn, Badge, StatCard, Icon } from "../../components/ui";
import { formatDate } from "../../utils/format";
import type { Shop, ShopAssignment } from "../../types/shop";
import type { User } from "../../types/user";

const capitalize = (s?: string | null) =>
  s?.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") ?? "";
const upperCase = (s?: string | null) => s?.toUpperCase() ?? "";
const initials2 = (u: { first_name?: string | null; last_name?: string | null; email?: string }) =>
  `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email?.[0]?.toUpperCase() || "?";

// ── Onglets boutiques ───────────────────────────────────────────────
function ShopTabs({ shops, active, onChange }: { shops: Shop[]; active: number; onChange: (id: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
      {shops.map(s => (
        <button key={s.id} onClick={() => onChange(s.id)}
          style={{
            padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, transition: "all 0.15s",
            background: active === s.id ? "#0F172A" : "#F1F5F9",
            color: active === s.id ? "#fff" : "#475569",
          }}>
          {s.name}
          <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
            {s.total_employees} emp.
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Carte employé ────────────────────────────────────────────────────
function EmployeeCard({
  user, selected, currentShopId, onToggle,
}: {
  user: User; selected: boolean; currentShopId: number; onToggle: () => void;
}) {
  const isHere = user.shop === currentShopId;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div onClick={onToggle}
      style={{
        border: selected ? "2px solid #6D28D9" : "1.5px solid #E2E8F0",
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        background: selected ? "#F5F3FF" : "#fff",
        display: "flex", alignItems: "center", gap: 12,
        transition: "all 0.15s", userSelect: "none",
      }}>
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: selected ? "none" : "1.5px solid #CBD5E1",
        background: selected ? "#6D28D9" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
      </div>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: user.is_active ? "linear-gradient(135deg,#8B5CF6,#6D28D9)" : "#E2E8F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: user.is_active ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700,
      }}>
        {initials}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {capitalize(user.first_name)} {upperCase(user.last_name)}
        </div>
        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 1 }}>{user.email}</div>
      </div>

      {/* Badge position actuelle */}
      <div style={{ flexShrink: 0 }}>
        {isHere ? (
          <Badge label="Ici" color="green" />
        ) : (
          <Badge label={user.shop_name ?? "Non affecté"} color="gray" />
        )}
      </div>
    </div>
  );
}

// ── Modal historique ─────────────────────────────────────────────────
function HistoryModal({ shopId, shopName, onClose }: { shopId: number; shopName: string; onClose: () => void }) {
  const [history, setHistory] = useState<ShopAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopService.getAssignmentHistory(shopId)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [shopId]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Historique des affectations</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>{shopName}</div>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#64748B" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>Chargement...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>Aucun historique</div>
          ) : history.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F8FAFC" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.is_active ? "linear-gradient(135deg,#8B5CF6,#6D28D9)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: a.is_active ? "#fff" : "#94A3B8", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {a.user_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{a.user_name}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
                  {formatDate(a.start_date)} → {a.end_date ? formatDate(a.end_date) : "en cours"}
                  {a.assigned_by_name && <span style={{ marginLeft: 8 }}>· par {a.assigned_by_name}</span>}
                </div>
                {a.note && <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2, fontStyle: "italic" }}>{a.note}</div>}
              </div>
              <Badge label={a.is_active ? "En cours" : "Terminé"} color={a.is_active ? "green" : "gray"} />
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────
export default function ShopAssignmentPage() {
  const { user } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [activeShopId, setActiveShopId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Charger boutiques du manager + employés du pool
  useEffect(() => {
    Promise.all([
      shopService.getAll(),
      userService.getEmployees(),
    ]).then(([shopsRes, empRes]) => {
      const myShops = (shopsRes.results ?? shopsRes as any) as Shop[];
      setShops(myShops);
      if (myShops.length > 0) setActiveShopId(myShops[0].id);
      const allEmp = (empRes.results ?? empRes as any) as User[];
      setEmployees(allEmp.filter((e: User) => e.role === "EMPLOYEE" || e.role === "LIVREUR"));
    }).finally(() => setLoading(false));
  }, []);

  const activeShop = shops.find(s => s.id === activeShopId);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.first_name ?? "").toLowerCase().includes(q) ||
      (e.last_name  ?? "").toLowerCase().includes(q) ||
      (e.email      ?? "").toLowerCase().includes(q)
    );
  });

  const alreadyHere = employees.filter(e => e.shop === activeShopId).length;

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
  };

  const handleAssign = async () => {
    if (!activeShopId || selected.size === 0) return;
    setSaving(true);
    try {
      const res = await shopService.assignEmployees(
        activeShopId,
        Array.from(selected),
        startDate,
        note || undefined,
      );
      showToast(res.message);
      setSelected(new Set());
      setNote("");
      // Rafraîchir les employés
      const empRes = await userService.getEmployees();
      const allEmp = (empRes.results ?? empRes as any) as User[];
      setEmployees(allEmp.filter((e: User) => e.role === "EMPLOYEE" || e.role === "LIVREUR"));
    } catch {
      showToast("Erreur lors de l'affectation", false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94A3B8" }}>
        Chargement...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Affectation des employés"
        subtitle="Gérez les rotations d'employés entre vos boutiques"
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Boutiques gérées" value={shops.length}    icon={<Icon name="shop"  size={18} color="#6D28D9" />} color="purple" />
        <StatCard label="Pool d'employés"  value={employees.length} icon={<Icon name="users" size={18} color="#0369A1" />} color="blue"   />
        <StatCard label="Dans cette boutique" value={alreadyHere}  icon={<Icon name="checkCircle" size={18} color="#15803D" />} color="green" />
      </div>

      {/* Sélection boutique */}
      {shops.length > 1 && (
        <ShopTabs shops={shops} active={activeShopId!} onChange={id => { setActiveShopId(id); setSelected(new Set()); }} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Liste employés */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          {/* Header liste */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="text" placeholder="Rechercher un employé..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={selectAll}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", color: "#475569", whiteSpace: "nowrap" }}>
              {selected.size === filtered.length && filtered.length > 0 ? "Tout déselect." : "Tout sélect."}
            </button>
          </div>

          {/* Grille employés */}
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>
                Aucun employé dans votre pool
              </div>
            ) : filtered.map(emp => (
              <EmployeeCard
                key={emp.id}
                user={emp}
                selected={selected.has(emp.id)}
                currentShopId={activeShopId!}
                onToggle={() => toggleSelect(emp.id)}
              />
            ))}
          </div>
        </div>

        {/* Panneau affectation */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: 20, position: "sticky", top: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
            Affecter à : <span style={{ color: "#6D28D9" }}>{activeShop?.name}</span>
          </div>

          {/* Sélection résumé */}
          <div style={{ background: selected.size > 0 ? "#F5F3FF" : "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: selected.size > 0 ? "#6D28D9" : "#CBD5E1" }}>
              {selected.size}
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>employé(s) sélectionné(s)</div>
          </div>

          {/* Date de début */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
              Date de début
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
              Note (optionnel)
            </label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Rotation semaine 15..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <Btn
            onClick={handleAssign}
            disabled={selected.size === 0 || saving}
            style={{ width: "100%", marginBottom: 10 }}
          >
            {saving ? "Affectation..." : `Affecter ${selected.size > 0 ? `(${selected.size})` : ""}`}
          </Btn>

          <button onClick={() => setShowHistory(true)}
            style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="clock" size={14} />
            Voir l'historique
          </button>

          {/* Employés actuellement ici */}
          {alreadyHere > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Actuellement ici
              </div>
              {employees.filter(e => e.shop === activeShopId).map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#8B5CF6,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {initials2(e)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 500 }}>
                    {capitalize(e.first_name)} {upperCase(e.last_name)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal historique */}
      {showHistory && activeShop && (
        <HistoryModal shopId={activeShop.id} shopName={activeShop.name} onClose={() => setShowHistory(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.ok ? "#15803D" : "#DC2626", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 2000, animation: "slideIn 0.2s ease" }}>
          {toast.msg}
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}
