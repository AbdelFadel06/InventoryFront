// src/pages/manager/ManagerUserListPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate }  from "react-router-dom";
import { userService }  from "../../services/userService";
import { useAuth }      from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import { formatDate }   from "../../utils/format";
import type { User }    from "../../types/user";

// ── ActionMenu position fixed ──────────────────────────────────────
interface ActionItem { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; }

function ActionMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest("[data-action-menu]")?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <div data-action-menu="" style={{ display: "inline-block" }}>
      <button ref={btnRef} onClick={handleOpen}
        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: open ? "#F1F5F9" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#64748B", fontFamily: "inherit", letterSpacing: 2 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#fff"; }}>
        ···
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{ position: "fixed", top: pos.top, right: pos.right, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 180, zIndex: 999, overflow: "hidden", animation: "fadeIn 0.1s ease" }}>
            {items.map((item, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", textAlign: "left", color: item.danger ? "#DC2626" : "#374151", borderBottom: i < items.length - 1 ? "1px solid #F8FAFC" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = item.danger ? "#FEF2F2" : "#F8FAFC")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
const GENDER_LABELS: Record<string, string> = { M: "Masculin", F: "Féminin", O: "Autre" };
const capitalize = (s?: string) => s?.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") ?? "";
const upperCase  = (s?: string) => s?.toUpperCase() ?? "";

// ── User Info Modal — charge les données complètes via /users/{id}/ ─
function UserInfoModal({ userId, baseUser, onClose, onToggle }: {
  userId:   number;
  baseUser: User;       // données partielles pour affichage immédiat
  onClose:  () => void;
  onToggle: () => void;
}) {
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [fetching, setFetching] = useState(true);

  // Charge les données complètes dès l'ouverture
  useEffect(() => {
    userService.getById(userId)
      .then(data => setFullUser(data as User))
      .catch(() => setFullUser(baseUser)) // fallback si erreur
      .finally(() => setFetching(false));
  }, [userId]);

  // Affiche les données partielles pendant le chargement
  const user     = fullUser ?? baseUser;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const Row = ({ label, value }: { label: string; value?: string | null }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 12.5, color: "#94A3B8", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500, textAlign: "right", marginLeft: 16 }}>
        {fetching && !fullUser ? <span style={{ color: "#E2E8F0" }}>···</span> : (value ?? "—")}
      </span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", padding: "28px 28px 22px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {capitalize(user.first_name)} {upperCase(user.last_name)}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>@{user.username}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge
                  label={user.role === "LIVREUR" ? "Livreur" : user.role === "MAGASINIER" ? "Magasinier" : "Employé"}
                  color={user.role === "LIVREUR" ? "blue" : user.role === "MAGASINIER" ? "orange" : "purple"}
                />
                <Badge label={user.is_active ? "Actif" : "Inactif"} color={user.is_active ? "green" : "gray"} />
              </div>
            </div>
          </div>
        </div>

        {/* Infos */}
        <div style={{ padding: "20px 28px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
            Informations personnelles
          </div>
          <Row label="Email"             value={user.email} />
          <Row label="Téléphone"         value={user.phone_number} />
          <Row label="Genre"             value={fullUser?.gender ? GENDER_LABELS[fullUser.gender] : null} />
          <Row label="Date de naissance" value={fullUser?.date_of_birth ? formatDate(fullUser.date_of_birth) : null} />

          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 2px" }}>
            Compte
          </div>
          <Row label="Boutique"   value={user.shop_name} />
          <Row label="Créé le"   value={formatDate(user.created_at)} />
          <Row label="Modifié le" value={fullUser?.updated_at ? formatDate(fullUser.updated_at) : null} />
        </div>

        {/* Actions */}
        <div style={{ padding: "20px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
          <Btn variant={user.is_active ? "danger" : "secondary"} onClick={() => { onToggle(); onClose(); }}>
            {user.is_active ? "Désactiver le compte" : "Activer le compte"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────
export default function ManagerUserListPage() {
  const navigate  = useNavigate();
  const { user, activeShop }  = useAuth();

  const [employees, setEmployees]   = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [infoModal, setInfoModal]   = useState<User | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Filtre par boutique active si le manager a sélectionné une boutique
      // Filtre par affectation courante (user.shop) pour la boutique active
      const res = await userService.getEmployees(activeShop ? { shopId: activeShop.id } : undefined);
      setEmployees(res.results ?? res as any);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch quand la boutique active change
  useEffect(() => { fetchEmployees(); }, [activeShop?.id]);

  const handleToggle = async (emp: User) => {
    await userService.toggleActive(emp.id);
    await fetchEmployees();
  };

  const active   = employees.filter(e => e.is_active).length;
  const inactive = employees.filter(e => !e.is_active).length;

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.first_name ?? "").toLowerCase().includes(q) ||
      (e.last_name  ?? "").toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "name", label: "Employé",
      render: (row: User) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: row.is_active ? "linear-gradient(135deg, #8B5CF6, #6D28D9)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: row.is_active ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700 }}>
            {`${row.first_name?.[0] ?? ""}${row.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>
              {capitalize(row.first_name)} {upperCase(row.last_name)}
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role", label: "Rôle",
      render: (row: User) => (
        <Badge
          label={row.role === "LIVREUR" ? "Livreur" : row.role === "MAGASINIER" ? "Magasinier" : "Employé"}
          color={row.role === "LIVREUR" ? "blue" : row.role === "MAGASINIER" ? "orange" : "purple"}
        />
      ),
    },
    {
      key: "phone_number", label: "Téléphone",
      render: (row: User) => <span style={{ fontSize: 12.5, color: "#64748B" }}>{row.phone_number ?? "—"}</span>,
    },
    {
      key: "is_active", label: "Statut",
      render: (row: User) => <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} />,
    },
    {
      key: "created_at", label: "Depuis le",
      render: (row: User) => <span style={{ fontSize: 12.5, color: "#94A3B8" }}>{formatDate(row.created_at)}</span>,
    },
    {
      key: "actions", label: "",
      render: (row: User) => (
        <ActionMenu items={[
          { icon: <Icon name="eye" size={15} />, label: "Voir les infos",  onClick: () => setInfoModal(row) },
          { icon: row.is_active ? <Icon name="xCircle" size={15} /> : <Icon name="checkCircle" size={15} />,
            label: row.is_active ? "Désactiver" : "Activer",
            onClick: () => handleToggle(row),
            danger: row.is_active },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mon équipe"
        subtitle={`Employés de ${activeShop?.name ?? user?.shop_name ?? "votre boutique"}`}
        action={<Btn onClick={() => navigate("/manager/users/create")}>+ Nouvel employé</Btn>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total employés" value={employees.length} icon={<Icon name="users"       size={18} color="#6D28D9" />} color="purple" loading={loading} />
        <StatCard label="Actifs"         value={active}           icon={<Icon name="checkCircle" size={18} color="#15803D" />} color="green"  loading={loading} />
        <StatCard label="Inactifs"       value={inactive}         icon={<Icon name="xCircle"     size={18} color="#C2410C" />} color="orange" loading={loading} />
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun employé dans votre boutique"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, email..."
      />

      {infoModal && (
        <UserInfoModal
          userId={infoModal.id}
          baseUser={infoModal}
          onClose={() => setInfoModal(null)}
          onToggle={() => handleToggle(infoModal)}
        />
      )}
    </div>
  );
}
