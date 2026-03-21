// src/pages/admin/UserListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { PageHeader, Btn, Badge, DataTable, StatCard } from "../../components/ui";
import { formatDate } from "../../utils/format";
import type { User, UserRole } from "../../types/user";

const ROLE_CONFIG: Record<UserRole, { label: string; color: "blue" | "green" | "purple" }> = {
  SUPER_ADMIN:  { label: "Super Admin", color: "blue"   },
  SHOP_MANAGER: { label: "Manager",     color: "green"  },
  EMPLOYEE:     { label: "Employé",     color: "purple" },
};

export default function UserListPage() {
  const navigate = useNavigate();

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.results ?? res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (user: User) => {
    setTogglingId(user.id);
    try {
      await userService.toggleActive(user.id);
      await fetchUsers();
    } finally {
      setTogglingId(null);
    }
  };

  const admins   = users.filter(u => u.role === "SUPER_ADMIN").length;
  const managers = users.filter(u => u.role === "SHOP_MANAGER").length;
  const employees = users.filter(u => u.role === "EMPLOYEE").length;
  const inactive = users.filter(u => !u.is_active).length;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      (u.first_name ?? "").toLowerCase().includes(q) ||
      (u.last_name  ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)              ||
      (u.shop_name  ?? "").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      key: "name", label: "Utilisateur",
      render: (row: User) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: row.is_active
              ? "linear-gradient(135deg, #3B82F6, #1D4ED8)"
              : "#E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: row.is_active ? "#fff" : "#94A3B8",
            fontSize: 13, fontWeight: 700,
          }}>
            {`${row.first_name?.[0] ?? ""}${row.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>
              {row.first_name} {row.last_name}
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role", label: "Rôle",
      render: (row: User) => {
        const r = ROLE_CONFIG[row.role];
        return <Badge label={r.label} color={r.color} />;
      },
    },
    {
      key: "shop_name", label: "Boutique",
      render: (row: User) => row.shop_name ? (
        <span style={{
          background: "#F1F5F9", padding: "3px 10px",
          borderRadius: 6, fontSize: 12.5, color: "#374151", fontWeight: 500,
        }}>
          {row.shop_name}
        </span>
      ) : (
        <span style={{ color: "#CBD5E1", fontSize: 12.5 }}>—</span>
      ),
    },
    {
      key: "is_active", label: "Statut",
      render: (row: User) => (
        <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} />
      ),
    },
    {
      key: "created_at", label: "Créé le",
      render: (row: User) => (
        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (row: User) => (
        <Btn
          size="sm"
          variant={row.is_active ? "danger" : "secondary"}
          disabled={togglingId === row.id}
          onClick={() => handleToggle(row)}
        >
          {togglingId === row.id ? "..." : row.is_active ? "Désactiver" : "Activer"}
        </Btn>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} utilisateurs au total`}
        action={
          <Btn onClick={() => navigate("/admin/users/create")}>
            + Nouvel utilisateur
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Super Admins" value={admins}    icon="👑" color="blue"   loading={loading} />
        <StatCard label="Managers"     value={managers}  icon="👔" color="green"  loading={loading} />
        <StatCard label="Employés"     value={employees} icon="👥" color="purple" loading={loading} />
        <StatCard label="Inactifs"     value={inactive}  icon="⏸️" color="red"    loading={loading} />
      </div>

      {/* Filtres rôle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all",          label: "Tous"         },
          { key: "SUPER_ADMIN",  label: "Super Admins" },
          { key: "SHOP_MANAGER", label: "Managers"     },
          { key: "EMPLOYEE",     label: "Employés"     },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterRole(f.key as any)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterRole === f.key ? 600 : 400,
              background: filterRole === f.key ? "#0F172A" : "#fff",
              color:      filterRole === f.key ? "#fff"    : "#64748B",
              border:     filterRole === f.key ? "none"    : "1px solid #E2E8F0",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucun utilisateur trouvé"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, email, boutique..."
      />
    </div>
  );
}
