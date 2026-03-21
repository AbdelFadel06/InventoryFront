// src/pages/manager/ManagerUserListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { useAuth }     from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard } from "../../components/ui";
import { formatDate }  from "../../utils/format";
import type { User }   from "../../types/user";

export default function ManagerUserListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await userService.getEmployees();
      // Filtrer uniquement les employés de la boutique du manager
      const shopEmployees = (res.results ?? res).filter(
        (u: User) => u.shop === user?.shop
      );
      setEmployees(shopEmployees);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleToggle = async (emp: User) => {
    setTogglingId(emp.id);
    try {
      await userService.toggleActive(emp.id);
      await fetchEmployees();
    } finally {
      setTogglingId(null);
    }
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
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: row.is_active
              ? "linear-gradient(135deg, #8B5CF6, #6D28D9)"
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
      key: "phone_number", label: "Téléphone",
      render: (row: User) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {row.phone_number ?? "—"}
        </span>
      ),
    },
    {
      key: "is_active", label: "Statut",
      render: (row: User) => (
        <Badge label={row.is_active ? "Actif" : "Inactif"} color={row.is_active ? "green" : "gray"} />
      ),
    },
    {
      key: "created_at", label: "Depuis le",
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
        title="Mon équipe"
        subtitle={`Employés de ${user?.shop_name ?? "votre boutique"}`}
        action={
          <Btn onClick={() => navigate("/manager/users/create")}>
            + Nouvel employé
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="Total employés" value={employees.length} icon="👥" color="purple" loading={loading} />
        <StatCard label="Actifs"          value={active}           icon="✅" color="green"  loading={loading} />
        <StatCard label="Inactifs"        value={inactive}         icon="⏸️" color="gray"   loading={loading} />
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
    </div>
  );
}
