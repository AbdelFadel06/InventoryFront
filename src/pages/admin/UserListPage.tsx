// src/pages/admin/UserListPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate }   from "react-router-dom";
import { userService }   from "../../services/userService";
import { shopService }   from "../../services/shopService";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import { formatDate }    from "../../utils/format";
import type { User, UserRole } from "../../types/user";
import type { Shop } from "../../types/shop";

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
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#fff"; }}>···</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{ position: "fixed", top: pos.top, right: pos.right, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 180, zIndex: 999, overflow: "hidden", animation: "fadeIn 0.1s ease" }}>
            {items.map((item, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", textAlign: "left", color: item.danger ? "#DC2626" : "#374151", borderBottom: i < items.length - 1 ? "1px solid #F8FAFC" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = item.danger ? "#FEF2F2" : "#F8FAFC")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Constantes ─────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; color: "blue"|"green"|"purple" }> = {
  SUPER_ADMIN:  { label: "Super Admin", color: "blue"   },
  SHOP_MANAGER: { label: "Manager",     color: "green"  },
  EMPLOYEE:     { label: "Employé",     color: "purple" },
};
const GENDER_LABELS: Record<string, string> = { M: "Masculin", F: "Féminin", O: "Autre" };
const capitalize = (s?: string) => s?.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") ?? "";
const upperCase  = (s?: string) => s?.toUpperCase() ?? "";

const iStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none", fontFamily: "inherit",
  boxSizing: "border-box", background: "#fff",
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

// ── User Info Modal ─────────────────────────────────────────────────
function UserInfoModal({ userId, baseUser, onClose, onRefresh, onEdit }: {
  userId: number; baseUser: User; onClose: () => void; onRefresh: () => void; onEdit: (u: User) => void;
}) {
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    userService.getById(userId)
      .then(data => setFullUser(data as User))
      .catch(() => setFullUser(baseUser))
      .finally(() => setFetching(false));
  }, [userId]);

  const user     = fullUser ?? baseUser;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const role     = ROLE_CONFIG[user.role] ?? { label: user.role, color: "gray" as const };

  const handleToggle = async () => {
    await userService.toggleActive(user.id);
    onRefresh();
    onClose();
  };

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

        <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", padding: "28px 28px 22px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {capitalize(user.first_name)} {upperCase(user.last_name)}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>@{user.username}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge label={role.label} color={role.color} />
                <Badge label={user.is_active ? "Actif" : "Inactif"} color={user.is_active ? "green" : "gray"} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 28px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Informations personnelles</div>
          <Row label="Email"             value={user.email} />
          <Row label="Téléphone"         value={user.phone_number} />
          <Row label="Genre"             value={fullUser?.gender ? GENDER_LABELS[fullUser.gender] : null} />
          <Row label="Date de naissance" value={fullUser?.date_of_birth ? formatDate(fullUser.date_of_birth) : null} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 0 2px" }}>Compte</div>
          <Row label="Boutique"   value={user.shop_name} />
          <Row label="Créé le"   value={formatDate(user.created_at)} />
          <Row label="Modifié le" value={fullUser?.updated_at ? formatDate(fullUser.updated_at) : null} />
        </div>

        <div style={{ padding: "20px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
          {fullUser && (
            <Btn variant="secondary" onClick={() => { onClose(); onEdit(fullUser); }}>
              Modifier
            </Btn>
          )}
          <Btn variant={user.is_active ? "danger" : "secondary"} onClick={handleToggle}>
            {user.is_active ? "Désactiver" : "Activer"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ──────────────────────────────────────────────
function EditUserModal({ user, shops, onClose, onRefresh }: {
  user: User; shops: Shop[]; onClose: () => void; onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    first_name:    user.first_name    ?? "",
    last_name:     user.last_name     ?? "",
    phone_number:  user.phone_number  ?? "",
    gender:        user.gender        ?? "",
    date_of_birth: user.date_of_birth ?? "",
    shop:          user.shop ? String(user.shop) : "",
    role:          user.role,
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Charger les données complètes (gender/dob absents du serializer de liste)
  useEffect(() => {
    userService.getById(user.id)
      .then(full => setForm({
        first_name:    full.first_name    ?? "",
        last_name:     full.last_name     ?? "",
        phone_number:  full.phone_number  ?? "",
        gender:        full.gender        ?? "",
        date_of_birth: full.date_of_birth ?? "",
        shop:          full.shop ? String(full.shop) : "",
        role:          full.role,
      }))
      .finally(() => setFetching(false));
  }, [user.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await userService.update(user.id, {
        first_name:    form.first_name   || undefined,
        last_name:     form.last_name    || undefined,
        phone_number:  form.phone_number || undefined,
        gender:        form.gender as any || undefined,
        date_of_birth: form.date_of_birth || undefined,
        shop:          form.shop ? Number(form.shop) : undefined,
        role:          form.role as any,
      });
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ padding: "22px 28px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
            Modifier — {capitalize(user.first_name)} {upperCase(user.last_name)}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 22 }}>×</button>
        </div>

        <div style={{ padding: "20px 28px" }}>
          {fetching ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
              Chargement des données…
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Prénom">
                  <input value={form.first_name} onChange={set("first_name")} style={iStyle}
                    onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                </Field>
                <Field label="Nom">
                  <input value={form.last_name} onChange={set("last_name")} style={iStyle}
                    onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                </Field>
              </div>
              <Field label="Téléphone">
                <input value={form.phone_number} onChange={set("phone_number")} placeholder="+229..." style={iStyle}
                  onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Genre">
                  <select value={form.gender} onChange={set("gender")} style={{ ...iStyle, cursor: "pointer" }}>
                    <option value="">Non spécifié</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                </Field>
                <Field label="Date de naissance">
                  <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} style={iStyle}
                    onFocus={e => (e.target.style.borderColor = "#3B82F6")} onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                </Field>
              </div>
              <Field label="Rôle">
                <select value={form.role} onChange={set("role")} style={{ ...iStyle, cursor: "pointer" }}>
                  <option value="EMPLOYEE">Employé</option>
                  <option value="SHOP_MANAGER">Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </Field>
              {form.role !== "SUPER_ADMIN" && (
                <Field label="Boutique">
                  <select value={form.shop} onChange={set("shop")} style={{ ...iStyle, cursor: "pointer" }}>
                    <option value="">Aucune boutique</option>
                    {shops.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "0 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSave} disabled={loading || fetching}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────
export default function UserListPage() {
  const navigate = useNavigate();

  const [users, setUsers]       = useState<User[]>([]);
  const [shops, setShops]       = useState<Shop[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [infoModal, setInfoModal] = useState<User | null>(null);
  const [editModal, setEditModal] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.results ?? res);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    shopService.getAll().then(res => setShops(res.results ?? res));
  }, []);

  const handleToggle = async (user: User) => {
    await userService.toggleActive(user.id);
    await fetchUsers();
  };

  const admins    = users.filter(u => u.role === "SUPER_ADMIN").length;
  const managers  = users.filter(u => u.role === "SHOP_MANAGER").length;
  const employees = users.filter(u => u.role === "EMPLOYEE").length;
  const inactive  = users.filter(u => !u.is_active).length;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.first_name ?? "").toLowerCase().includes(q) ||
      (u.last_name  ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.shop_name  ?? "").toLowerCase().includes(q);
    return matchSearch && (filterRole === "all" || u.role === filterRole);
  });

  const columns = [
    {
      key: "name", label: "Utilisateur",
      render: (row: User) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: row.is_active ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: row.is_active ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: 700 }}>
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
    { key: "role",         label: "Rôle",      render: (row: User) => { const r = ROLE_CONFIG[row.role] ?? { label: row.role, color: "gray" as const }; return <Badge label={r.label} color={r.color} />; } },
    { key: "shop_name",    label: "Boutique",   render: (row: User) => row.shop_name ? <span style={{ background: "#F1F5F9", padding: "3px 10px", borderRadius: 6, fontSize: 12.5, color: "#374151", fontWeight: 500 }}>{row.shop_name}</span> : <span style={{ color: "#CBD5E1", fontSize: 12.5 }}>—</span> },
    { key: "phone_number", label: "Téléphone",  render: (row: User) => <span style={{ fontSize: 12.5, color: "#64748B" }}>{row.phone_number ?? "—"}</span> },
    { key: "is_active",    label: "Statut",     render: (row: User) => <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} /> },
    {
      key: "actions", label: "",
      render: (row: User) => (
        <ActionMenu items={[
          { icon: <Icon name="eye" size={15} />,  label: "Voir les infos",    onClick: () => setInfoModal(row) },
          { icon: <Icon name="edit" size={15} />, label: "Modifier le profil", onClick: () => setEditModal(row) },
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
      <PageHeader title="Utilisateurs" subtitle={`${users.length} utilisateurs au total`}
        action={<Btn onClick={() => navigate("/admin/users/create")}>+ Nouvel utilisateur</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Super Admins" value={admins}    icon={<Icon name="lock"       size={22} />} color="blue"   loading={loading} />
        <StatCard label="Managers"     value={managers}  icon={<Icon name="person"     size={22} />} color="green"  loading={loading} />
        <StatCard label="Employés"     value={employees} icon={<Icon name="users"      size={22} />} color="purple" loading={loading} />
        <StatCard label="Inactifs"     value={inactive}  icon={<Icon name="xCircle"   size={22} />} color="red"    loading={loading} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ key: "all", label: "Tous" }, { key: "SUPER_ADMIN", label: "Super Admins" }, { key: "SHOP_MANAGER", label: "Managers" }, { key: "EMPLOYEE", label: "Employés" }].map(f => (
          <button key={f.key} onClick={() => setFilterRole(f.key as any)}
            style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: filterRole === f.key ? 600 : 400, background: filterRole === f.key ? "#0F172A" : "#fff", color: filterRole === f.key ? "#fff" : "#64748B", border: filterRole === f.key ? "none" : "1px solid #E2E8F0", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns as any} data={filtered} loading={loading} emptyText="Aucun utilisateur trouvé"
        searchValue={search} onSearch={setSearch} searchPlaceholder="Nom, email, boutique..." />

      {infoModal && (
        <UserInfoModal
          userId={infoModal.id}
          baseUser={infoModal}
          onClose={() => setInfoModal(null)}
          onRefresh={fetchUsers}
          onEdit={u => { setInfoModal(null); setEditModal(u); }}
        />
      )}

      {editModal && (
        <EditUserModal
          user={editModal}
          shops={shops}
          onClose={() => setEditModal(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
