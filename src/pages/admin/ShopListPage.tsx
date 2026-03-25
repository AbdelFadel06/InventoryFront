// src/pages/admin/ShopListPage.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { shopService } from "../../services/shopService";
import { userService } from "../../services/userService";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import type { Shop } from "../../types/shop";
import type { User } from "../../types/user";

// ── Dropdown action menu ───────────────────────────────────────────
interface ActionItem {
  label:   string;
  icon:    React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

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
        style={{
          width: 32, height: 32, borderRadius: 8,
          border: "1px solid #E2E8F0", background: open ? "#F1F5F9" : "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#64748B", fontFamily: "inherit", letterSpacing: 2,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#fff"; }}>
        ···
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{
            position: "fixed", top: pos.top, right: pos.right,
            background: "#fff", border: "1px solid #E2E8F0",
            borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 190, zIndex: 999, overflow: "hidden",
            animation: "fadeIn 0.1s ease",
          }}>
            {items.map((item, i) => (
              <button key={i}
                onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13.5, fontFamily: "inherit", textAlign: "left",
                  color: item.danger ? "#DC2626" : "#374151",
                  borderBottom: i < items.length - 1 ? "1px solid #F8FAFC" : "none",
                }}
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

export default function ShopListPage() {
  const navigate = useNavigate();

  const [shops, setShops]       = useState<Shop[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  // Modal assignation manager
  const [assignModal, setAssignModal]         = useState<Shop | null>(null);
  const [selectedManager, setSelectedManager] = useState("");
  const [assigning, setAssigning]             = useState(false);
  const [assignError, setAssignError]         = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, managersRes] = await Promise.all([
        shopService.getAll(),
        userService.getManagers(),
      ]);
      setShops(shopsRes.results ?? shopsRes);
      setManagers(managersRes.results ?? managersRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (shop: Shop) => {
    try {
      await shopService.toggleActive(shop.id);
      await fetchData();
    } catch { console.error("Erreur toggle"); }
  };

  const openAssign = (shop: Shop) => {
    setAssignModal(shop);
    setSelectedManager(shop.manager ? String(shop.manager) : "");
    setAssignError(null);
  };

  const handleAssignManager = async () => {
    if (!assignModal || !selectedManager) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await shopService.assignManager(assignModal.id, Number(selectedManager));
      setAssignModal(null);
      setSelectedManager("");
      await fetchData();
    } catch {
      setAssignError("Erreur lors de l'assignation.");
    } finally {
      setAssigning(false);
    }
  };

  const active   = shops.filter(s => s.is_active).length;
  const inactive = shops.filter(s => !s.is_active).length;
  const noMgr    = shops.filter(s => !s.manager).length;

  const filtered = shops.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q) ||
      (s.manager_name ?? "").toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "name", label: "Boutique",
      render: (row: Shop) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: row.is_active ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)" : "#F8FAFC",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="store" size={14} color="#1D4ED8" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.name}</div>
            {row.city && <div style={{ fontSize: 11.5, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}><Icon name="target" size={11} color="#94A3B8" /> {row.city}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "phone_number", label: "Téléphone",
      render: (row: Shop) => (
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {row.phone_number ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="phone" size={13} color="#64748B" /> {row.phone_number}</span> : "—"}
        </span>
      ),
    },
    {
      key: "manager_name", label: "Manager",
      render: (row: Shop) => row.manager_name ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {(row.manager_name as string)[0]?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
            {row.manager_name}
          </span>
        </div>
      ) : (
        <span style={{
          fontSize: 12, color: "#F97316", fontWeight: 600,
          background: "#FFF7ED", border: "1px solid #FED7AA",
          padding: "3px 10px", borderRadius: 6,
        }}>
          Non assigné
        </span>
      ),
    },
    {
      key: "total_employees", label: "Employés",
      render: (row: Shop) => (
        <span style={{
          fontWeight: 600, fontSize: 14, color: "#374151",
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          padding: "3px 10px", borderRadius: 20,
        }}>
          {(row as any).total_employees ?? 0}
        </span>
      ),
    },
    {
      key: "is_active", label: "Statut",
      render: (row: Shop) => (
        <Badge label={row.is_active ? "Active" : "Inactive"} color={row.is_active ? "green" : "gray"} />
      ),
    },
    {
      key: "actions", label: "",
      render: (row: Shop) => (
        <ActionMenu items={[
          ...(row.manager_name ? [
            {
              icon: <Icon name="person" size={15} />,
              label: "Changer de manager",
              onClick: () => openAssign(row),
            },
          ] : [
            {
              icon: <Icon name="plus" size={15} />,
              label: "Assigner un manager",
              onClick: () => openAssign(row),
            },
          ]),
          {
            icon: row.is_active
              ? <Icon name="xCircle" size={15} />
              : <Icon name="checkCircle" size={15} />,
            label: row.is_active ? "Désactiver" : "Activer",
            onClick: () => handleToggle(row),
            danger: row.is_active,
          },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Boutiques"
        subtitle={`${shops.length} boutiques au total`}
        action={
          <Btn onClick={() => navigate("/admin/shops/create")}>
            + Nouvelle boutique
          </Btn>
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Boutiques actives"   value={active}          icon={<Icon name="store"   size={18} color="#15803D" />} color="green"  loading={loading} />
        <StatCard label="Boutiques inactives" value={inactive}        icon={<Icon name="store"   size={18} color="#64748B" />} color="orange" loading={loading} />
        <StatCard label="Sans manager"        value={noMgr}           icon={<Icon name="warning" size={18} color="#C2410C" />} color="orange" loading={loading} sub={noMgr > 0 ? "À assigner" : undefined} />
        <StatCard label="Total managers"      value={managers.length} icon={<Icon name="users"   size={18} color="#1D4ED8" />} color="blue"   loading={loading} />
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucune boutique trouvée"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Nom, ville, manager..."
      />

      {/* ── Modal assignation manager ─────────────────────── */}
      {assignModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28,
            width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                {assignModal.manager_name ? "Changer le manager" : "Assigner un manager"}
              </h3>
              <button onClick={() => setAssignModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 22 }}>×</button>
            </div>

            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>
              Boutique : <strong>{assignModal.name}</strong>
            </p>

            {/* Manager actuel */}
            {assignModal.manager_name && (
              <div style={{
                background: "#F0FDF4", border: "1px solid #BBF7D0",
                borderRadius: 9, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#15803D",
              }}>
                Manager actuel : <strong>{assignModal.manager_name}</strong>
              </div>
            )}

            {assignError && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                color: "#DC2626", borderRadius: 9, padding: "10px 14px",
                fontSize: 13, marginBottom: 16,
              }}>
                {assignError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                {assignModal.manager_name ? "Nouveau manager" : "Manager"} *
              </label>
              <select
                value={selectedManager}
                onChange={e => setSelectedManager(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid #E2E8F0", borderRadius: 9,
                  fontSize: 13.5, color: "#374151", outline: "none",
                  fontFamily: "inherit", background: "#fff",
                }}
              >
                <option value="">-- Sélectionner un manager --</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {(m as any).full_name || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email}
                    {m.shop && m.shop !== assignModal.id ? " (déjà assigné)" : ""}
                  </option>
                ))}
              </select>
              {managers.length === 0 && (
                <p style={{ fontSize: 12, color: "#F97316", marginTop: 6 }}>
                  Aucun manager disponible. Créez d'abord un utilisateur avec le rôle Manager.
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => { setAssignModal(null); setSelectedManager(""); }}>
                Annuler
              </Btn>
              <Btn onClick={handleAssignManager} disabled={assigning || !selectedManager}>
                {assigning ? "Assignation..." : "Confirmer"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
