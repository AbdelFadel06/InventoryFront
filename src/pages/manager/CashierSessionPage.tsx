// src/pages/manager/CashierSessionPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, StatCard, Icon } from "../../components/ui";
import { formatDate, formatDateTime } from "../../utils/format";
import { userService } from "../../services/userService";
import axiosInstance from "../../api/axiosInstance";
import type { User } from "../../types/user";

// ── Types ─────────────────────────────────────────────────────────
interface CashierSession {
  id: number;
  shop: number;
  shop_name: string;
  cashier: number;
  cashier_name: string;
  created_by_name: string | null;
  period_type: "daily" | "weekly";
  start_date: string;
  end_date: string;
  status: "active" | "closed";
  is_active: boolean;
  notes: string | null;
  sales_count: number;
  total_sales: number;
  created_at: string;
  closed_at: string | null;
}

// ── Styles communs ─────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #E2E8F0", borderRadius: 9,
  fontSize: 13.5, color: "#374151", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", background: "#fff",
};

const Field = ({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
  </div>
);

// ── Modal création session ─────────────────────────────────────────
function CreateSessionModal({
  employees, shopId, onClose, onCreated,
}: {
  employees: User[];
  shopId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    cashier: "",
    period_type: "daily" as "daily" | "weekly",
    start_date: today,
    end_date: today,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handlePeriodChange = (type: "daily" | "weekly") => {
    const start = new Date(form.start_date);
    const end = new Date(start);
    if (type === "weekly") end.setDate(end.getDate() + 6);
    setForm(f => ({
      ...f,
      period_type: type,
      end_date: end.toISOString().split("T")[0],
    }));
  };

  const handleStartChange = (val: string) => {
    const start = new Date(val);
    const end = new Date(start);
    if (form.period_type === "weekly") end.setDate(end.getDate() + 6);
    setForm(f => ({
      ...f,
      start_date: val,
      end_date: end.toISOString().split("T")[0],
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.cashier) { setError("Veuillez sélectionner un caissier."); return; }
    setLoading(true);
    try {
      await axiosInstance.post("/cashier-sessions/", {
        shop: shopId,
        cashier: Number(form.cashier),
        period_type: form.period_type,
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        data?.non_field_errors?.[0] ??
        data?.cashier?.[0] ??
        data?.detail ??
        "Erreur lors de la création.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => String(e.id) === form.cashier);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
              Nouvelle session de caisse
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
              Désigner un caissier pour une période
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 22 }}>×</button>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", borderRadius: 9, padding: "10px 14px",
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <Field label="Caissier" required>
          <select
            value={form.cashier}
            onChange={e => set("cashier")(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">-- Sélectionner un employé --</option>
            {employees.map(emp => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.full_name} ({(emp.role as string) === "LIVREUR" ? "Livreur" : "Employé"})
              </option>
            ))}
          </select>
          {employees.length === 0 && (
            <p style={{ fontSize: 12, color: "#F97316", marginTop: 6, marginBottom: 0 }}>
              Aucun employé trouvé. Créez d'abord un employé dans votre boutique.
            </p>
          )}
        </Field>

        <Field label="Type de période" required>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { key: "daily", label: "Journalière", desc: "1 jour" },
              { key: "weekly", label: "Hebdomadaire", desc: "7 jours" },
            ].map(opt => (
              <button key={opt.key}
                type="button"
                onClick={() => handlePeriodChange(opt.key as "daily" | "weekly")}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 9,
                  border: form.period_type === opt.key ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                  background: form.period_type === opt.key ? "#EFF6FF" : "#fff",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: form.period_type === opt.key ? "#1D4ED8" : "#374151" }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date de début" required>
            <input type="date" value={form.start_date}
              onChange={e => handleStartChange(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
          <Field label="Date de fin" required>
            <input type="date" value={form.end_date}
              onChange={e => set("end_date")(e.target.value)}
              min={form.start_date}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#3B82F6")}
              onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </Field>
        </div>

        <Field label="Notes (optionnel)">
          <textarea value={form.notes} rows={2}
            onChange={e => set("notes")(e.target.value)}
            placeholder="Instructions particulières..."
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={e => (e.target.style.borderColor = "#3B82F6")}
            onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
        </Field>

        {selectedEmployee && (
          <div style={{
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 9, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "#15803D",
          }}>
            {selectedEmployee.full_name} sera caissier
            du <strong>{formatDate(form.start_date)}</strong> au <strong>{formatDate(form.end_date)}</strong>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? "Création..." : "Créer la session"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Modal détail session ───────────────────────────────────────────
function SessionDetailModal({ session, onClose, onRefresh }: {
  session: CashierSession;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    setClosing(true);
    try {
      await axiosInstance.post(`/cashier-sessions/${session.id}/close/`);
      onRefresh();
      onClose();
    } catch {
      setError("Erreur lors de la clôture.");
    } finally {
      setClosing(false);
    }
  };

  const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid #F1F5F9",
    }}>
      <span style={{ fontSize: 13, color: "#94A3B8" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: highlight ? 700 : 500, color: highlight ? "#0F172A" : "#374151" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        <div style={{
          background: session.is_active
            ? "linear-gradient(135deg, #059669, #10B981)"
            : "linear-gradient(135deg, #475569, #64748B)",
          padding: "22px 24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Session de caisse #{session.id}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {session.cashier_name}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                {session.period_type === "daily" ? "Journalière" : "Hebdomadaire"}
                {" · "}{formatDate(session.start_date)} → {formatDate(session.end_date)}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
              color: "#fff", fontSize: 18, width: 32, height: 32, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", borderRadius: 9, padding: "10px 14px",
              fontSize: 13, marginBottom: 14,
            }}>
              {error}
            </div>
          )}
          <Row label="Statut" value={session.is_active ? "Active" : "Clôturée"} highlight />
          <Row label="Ventes effectuées" value={`${session.sales_count} vente(s)`} />
          <Row label="Chiffre d'affaires" value={`${Number(session.total_sales).toLocaleString("fr-FR")} F`} highlight />
          <Row label="Créée par" value={session.created_by_name ?? "—"} />
          <Row label="Créée le" value={formatDateTime(session.created_at)} />
          {session.closed_at && (
            <Row label="Clôturée le" value={formatDateTime(session.closed_at)} />
          )}
          {session.notes && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, fontSize: 13, color: "#64748B" }}>
              {session.notes}
            </div>
          )}
        </div>

        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>Fermer</Btn>
          {session.is_active && (
            <Btn variant="danger" onClick={handleClose} disabled={closing}>
              {closing ? "Clôture..." : "Clôturer la session"}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────
export default function CashierSessionPage() {
  const { user, activeShop } = useAuth();

  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailSession, setDetailSession] = useState<CashierSession | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");

  const fetchData = async () => {
    setLoading(true);

    // Employés affectés à la boutique active uniquement
    try {
      const empRes = await userService.getEmployees(activeShop ? { shopId: activeShop.id } : undefined);
      // Seuls les EMPLOYEE peuvent être caissiers (pas LIVREUR ni MAGASINIER)
      setEmployees((empRes as User[]).filter(e => e.is_active && e.role === "EMPLOYEE"));
    } catch (e) {
      console.error("Erreur chargement employés :", e);
    }

    // Sessions
    try {
      const sessRes = await axiosInstance.get("/cashier-sessions/");
      const sessData = sessRes.data;
      setSessions(sessData.results ?? sessData);
    } catch (e) {
      console.error("Erreur chargement sessions :", e);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeShop?.id]);

  const active   = sessions.filter(s => s.status === "active").length;
  const closed   = sessions.filter(s => s.status === "closed").length;
  const totalCA  = sessions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + Number(s.total_sales), 0);

  const today = new Date().toISOString().split("T")[0];
  const activeSession = sessions.find(s =>
    s.status === "active" && s.start_date <= today && s.end_date >= today
  );

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      s.cashier_name.toLowerCase().includes(q) ||
      (s.shop_name ?? "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "active" ? s.status === "active" :
      s.status === "closed";
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: "cashier_name",
      label: "Caissier",
      render: (row: CashierSession) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: row.is_active
              ? "linear-gradient(135deg, #10B981, #059669)"
              : "#E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: row.is_active ? "#fff" : "#94A3B8", fontSize: 12, fontWeight: 700,
          }}>
            {row.cashier_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.cashier_name}</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
              {row.period_type === "daily" ? "Journalière" : "Hebdomadaire"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      label: "Période",
      render: (row: CashierSession) => (
        <div style={{ fontSize: 13, color: "#64748B" }}>
          <div>{formatDate(row.start_date)}</div>
          <div style={{ color: "#94A3B8", fontSize: 11.5 }}>→ {formatDate(row.end_date)}</div>
        </div>
      ),
    },
    {
      key: "sales_count",
      label: "Ventes",
      render: (row: CashierSession) => (
        <span style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          padding: "3px 10px", borderRadius: 20,
          fontWeight: 600, fontSize: 13, color: "#374151",
        }}>
          {row.sales_count}
        </span>
      ),
    },
    {
      key: "total_sales",
      label: "CA",
      render: (row: CashierSession) => (
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>
          {Number(row.total_sales).toLocaleString("fr-FR")} F
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (row: CashierSession) => (
        row.is_active
          ? <Badge label="Active" color="green" />
          : <Badge label="Clôturée" color="orange" />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row: CashierSession) => (
        <Btn size="sm" variant="ghost" onClick={() => setDetailSession(row)}>
          Détails →
        </Btn>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sessions de caisse"
        subtitle="Gérer les caissiers et leurs périodes"
        action={
          <Btn onClick={() => setShowCreate(true)}>+ Nouvelle session</Btn>
        }
      />

      {/* Bannière session active */}
      {!loading && activeSession && (
        <div style={{
          background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
          border: "1px solid #6EE7B7",
          borderRadius: 14, padding: "16px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="checkCircle" size={22} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#065F46" }}>
                Session active aujourd'hui
              </div>
              <div style={{ fontSize: 13, color: "#059669", marginTop: 1 }}>
                Caissier : <strong>{activeSession.cashier_name}</strong>
                {" · "}{activeSession.sales_count} vente(s)
                {" · "}{Number(activeSession.total_sales).toLocaleString("fr-FR")} F
              </div>
            </div>
          </div>
          <Btn size="sm" variant="secondary" onClick={() => setDetailSession(activeSession)}>
            Gérer
          </Btn>
        </div>
      )}

      {!loading && !activeSession && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A",
          borderRadius: 14, padding: "14px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ fontSize: 13.5, color: "#92400E" }}>
            <strong>Aucune session active aujourd'hui</strong> — Les employés ne peuvent pas enregistrer de ventes.
          </div>
          <Btn size="sm" onClick={() => setShowCreate(true)}>Créer une session</Btn>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Sessions actives"    value={active}                                      icon={<Icon name="checkCircle" size={22} />} color="green"  loading={loading} />
        <StatCard label="Sessions clôturées"  value={closed}                                      icon={<Icon name="clock" size={22} />} color="gray"   loading={loading} />
        <StatCard label="CA sessions actives" value={`${totalCA.toLocaleString("fr-FR")} F`}      icon={<Icon name="money" size={22} />} color="blue"   loading={loading} />
        <StatCard label="Employés disponibles" value={employees.length}                            icon={<Icon name="users" size={22} />} color="purple" loading={loading} />
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "active", "closed"] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12.5,
              fontWeight: filterStatus === f ? 600 : 400,
              background: filterStatus === f ? "#0F172A" : "#fff",
              color: filterStatus === f ? "#fff" : "#64748B",
              border: filterStatus === f ? "none" : "1px solid #E2E8F0",
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {f === "all" ? "Toutes" : f === "active" ? "Actives" : "Clôturées"}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filtered}
        loading={loading}
        emptyText="Aucune session trouvée"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Rechercher un caissier..."
        onRowClick={(row: any) => setDetailSession(row)}
      />

      {showCreate && (
        <CreateSessionModal
          employees={employees}
          shopId={activeShop?.id ?? user?.shop ?? 0}
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}

      {detailSession && (
        <SessionDetailModal
          session={detailSession}
          onClose={() => setDetailSession(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
