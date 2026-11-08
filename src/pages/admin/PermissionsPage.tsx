// src/pages/admin/PermissionsPage.tsx
// Écran des permissions (Super Admin) : grille par rôle, exceptions par personne,
// interrupteurs par module et journal. Chaque changement est enregistré tout de suite.
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Badge, Icon } from "../../components/ui";
import { userService } from "../../services/userService";
import {
  accessService,
  type Catalog, type CatalogPermission, type HistoryRow, type RoleGrid, type Switches, type UserAccess,
} from "../../services/accessService";
import { formatDateTime } from "../../utils/format";
import type { User, UserRole } from "../../types/user";

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin", SHOP_MANAGER: "Manager", EMPLOYEE: "Employé",
  MAGASINIER: "Magasinier", LIVREUR: "Livreur",
};
const KIND_LABELS: Record<string, string> = {
  view: "Voir", create: "Créer", update: "Modifier", delete: "Supprimer", special: "Action",
};

type Tab = "roles" | "people" | "switches" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "roles",    label: "Par rôle" },
  { key: "people",   label: "Par personne" },
  { key: "switches", label: "Interrupteurs" },
  { key: "history",  label: "Journal" },
];

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};
const errorMessage = (e: any) => e?.response?.data?.error ?? "Enregistrement impossible. Réessayez.";

/** Droits rangés par module, dans l'ordre du catalogue. */
function byModule(permissions: CatalogPermission[]) {
  const groups: { module: string; items: CatalogPermission[] }[] = [];
  for (const p of permissions) {
    const group = groups.find(g => g.module === p.module);
    if (group) group.items.push(p); else groups.push({ module: p.module, items: [p] });
  }
  return groups;
}

function Notice({ tone, children }: { tone: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  const colors = {
    info:  ["#EFF6FF", "#BFDBFE", "#1E40AF"],
    warn:  ["#FFFBEB", "#FDE68A", "#92400E"],
    error: ["#FEF2F2", "#FECACA", "#B91C1C"],
    ok:    ["#F0FDF4", "#BBF7D0", "#15803D"],
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} style={{
      background: colors[0], border: `1px solid ${colors[1]}`, color: colors[2],
      borderRadius: 10, padding: "10px 14px", fontSize: 13.5, marginBottom: 14,
    }}>{children}</div>
  );
}

// ── Par rôle ─────────────────────────────────────────────────────────────────
function RolesTab({ catalog, grid, setGrid }: {
  catalog: Catalog; grid: RoleGrid; setGrid: (g: RoleGrid) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (role: UserRole, code: string) => {
    const next = !grid[role]?.[code];
    setError(""); setBusy(`${role}:${code}`);
    const previous = grid;
    setGrid({ ...grid, [role]: { ...grid[role], [code]: next } });   // affichage immédiat
    try { await accessService.setRole(role, code, next); }
    catch (e) { setGrid(previous); setError(errorMessage(e)); }
    finally { setBusy(null); }
  };

  return (
    <>
      <Notice tone="info">
        Une case cochée donne le droit à <strong>tout le rôle</strong>, dans toutes les boutiques.
        Elle ne s'applique qu'aux modules dont l'interrupteur est sur « Grille active ».
      </Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "11px 16px", fontSize: 12, color: "#64748B", fontWeight: 600 }}>Droit</th>
              {catalog.roles.map(role => (
                <th key={role} style={{ padding: "11px 8px", fontSize: 12, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byModule(catalog.permissions).map(group => (
              <ModuleRows key={group.module} title={group.module} colSpan={catalog.roles.length + 1}>
                {group.items.map(p => (
                  <tr key={p.code} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "9px 16px" }}>
                      <div style={{ color: "#0F172A", fontWeight: 500 }}>{p.label}</div>
                      <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{KIND_LABELS[p.kind]}</div>
                    </td>
                    {catalog.roles.map(role => {
                      const locked = p.locked_for.includes(role);
                      const checked = !!grid[role]?.[p.code];
                      return (
                        <td key={role} style={{ textAlign: "center", padding: "9px 8px" }}>
                          {locked ? (
                            <span title="Toujours actif : le Super Admin ne peut pas se le retirer" style={{ color: "#94A3B8" }}>
                              <Icon name="lock" size={15} />
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={busy === `${role}:${p.code}`}
                              onChange={() => toggle(role, p.code)}
                              aria-label={`${p.label} — ${ROLE_LABELS[role]}`}
                              style={{ width: 17, height: 17, cursor: "pointer", accentColor: "#1D4ED8" }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </ModuleRows>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ModuleRows({ title, colSpan, children }: { title: string; colSpan: number; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={colSpan} style={{
          padding: "14px 16px 6px", fontSize: 12, fontWeight: 700, color: "#1D4ED8",
          textTransform: "uppercase", letterSpacing: "0.04em", borderTop: "1px solid #E2E8F0",
        }}>{title}</td>
      </tr>
      {children}
    </>
  );
}

// ── Par personne ─────────────────────────────────────────────────────────────
function PeopleTab({ catalog, grid }: { catalog: Catalog; grid: RoleGrid }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<UserAccess | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!search.trim()) { setResults([]); return; }
    timer.current = setTimeout(() => {
      userService.getAll({ search: search.trim(), page_size: 8 })
        .then(res => setResults(res.results ?? []))
        .catch(() => setResults([]));
    }, 300);
  }, [search]);

  const open = async (user: User) => {
    setError(""); setResults([]); setSearch("");
    try { setSelected(await accessService.user(user.id)); }
    catch (e) { setError(errorMessage(e)); }
  };

  const choose = async (code: string, value: string) => {
    if (!selected) return;
    const allowed = value === "inherit" ? null : value === "grant";
    setError("");
    try { setSelected(await accessService.setUser(selected.user, code, allowed)); }
    catch (e) { setError(errorMessage(e)); }
  };

  const exceptions = selected ? Object.keys(selected.overrides).length : 0;

  return (
    <>
      <Notice tone="info">
        Une exception ne concerne <strong>qu'une personne</strong> : elle lui ajoute ou lui retire un droit par rapport à son rôle.
      </Notice>
      {error && <Notice tone="error">{error}</Notice>}

      <div style={{ ...card, padding: 16, marginBottom: 16, position: "relative" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }} htmlFor="perm-search">Chercher une personne</label>
        <input
          id="perm-search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom ou email…" autoComplete="off"
          style={{
            display: "block", width: "100%", maxWidth: 420, marginTop: 6, padding: "9px 12px",
            border: "1px solid #E2E8F0", borderRadius: 9, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        {results.length > 0 && (
          <div role="listbox" style={{ ...card, position: "absolute", zIndex: 20, marginTop: 4, width: "min(420px, calc(100% - 32px))", overflow: "hidden" }}>
            {results.map(u => (
              <button key={u.id} role="option" aria-selected="false" onClick={() => open(u)} style={{
                display: "flex", justifyContent: "space-between", gap: 8, width: "100%", padding: "10px 14px",
                border: "none", borderBottom: "1px solid #F1F5F9", background: "#fff", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", fontSize: 13.5,
              }}>
                <span><strong>{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email}</strong>
                  <span style={{ color: "#94A3B8", marginLeft: 6 }}>{u.email}</span></span>
                <span style={{ color: "#64748B", whiteSpace: "nowrap" }}>{ROLE_LABELS[u.role]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15, color: "#0F172A" }}>{selected.name}</strong>
            <Badge label={ROLE_LABELS[selected.role]} color="blue" />
            <span style={{ fontSize: 13, color: "#64748B" }}>
              {exceptions === 0 ? "Aucune exception : mêmes droits que son rôle" : `${exceptions} exception${exceptions > 1 ? "s" : ""}`}
            </span>
          </div>
          {byModule(catalog.permissions).map(group => (
            <div key={group.module}>
              <div style={{ padding: "12px 16px 4px", fontSize: 12, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {group.module}
              </div>
              {group.items.map(p => {
                const fromRole = !!grid[selected.role]?.[p.code];
                const override = selected.overrides[p.code];
                const value = override === undefined ? "inherit" : override ? "grant" : "revoke";
                const locked = p.locked_for.includes(selected.role);
                return (
                  <div key={p.code} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                    padding: "8px 16px", borderTop: "1px solid #F1F5F9",
                    background: override === undefined ? "#fff" : "#FFFBEB",
                  }}>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: "#0F172A" }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>Son rôle : {fromRole ? "oui" : "non"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Badge label={selected.effective[p.code] ? "Autorisé" : "Refusé"} color={selected.effective[p.code] ? "green" : "gray"} />
                      {locked ? (
                        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Toujours actif</span>
                      ) : (
                        <select value={value} onChange={e => choose(p.code, e.target.value)}
                          aria-label={`${p.label} pour ${selected.name}`}
                          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, fontFamily: "inherit" }}>
                          <option value="inherit">Comme son rôle</option>
                          <option value="grant">Ajouté</option>
                          <option value="revoke">Retiré</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Interrupteurs ────────────────────────────────────────────────────────────
function SwitchesTab() {
  const [state, setState] = useState<Switches | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { accessService.switches().then(setState).catch(e => setError(errorMessage(e))); }, []);

  const flip = async (module: string, enabled: boolean) => {
    const label = state?.modules.find(m => m.module === module)?.label ?? module;
    const question = enabled
      ? `Activer la grille pour « ${label} » ? Les droits cochés s'appliqueront dans les 10 secondes.`
      : `Revenir aux anciennes règles pour « ${label} » ?`;
    if (!window.confirm(question)) return;
    setError(""); setBusy(module);
    try { setState(await accessService.setSwitch(module, enabled)); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(null); }
  };

  if (!state) return error ? <Notice tone="error">{error}</Notice> : null;

  return (
    <>
      {state.emergency_stop ? (
        <Notice tone="warn">
          <strong>Arrêt d'urgence actif</strong> (PERMISSIONS_FORCE_OLD dans le .env du serveur) :
          les anciennes règles s'appliquent partout, quels que soient les interrupteurs ci-dessous.
        </Notice>
      ) : (
        <Notice tone="info">
          « Grille active » : ce module suit les cases de l'onglet « Par rôle » et les exceptions.
          « Anciennes règles » : le module se comporte comme avant. Allumez les modules un par un.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div style={{ ...card, overflow: "hidden" }}>
        {state.modules.map(m => (
          <div key={m.module} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            padding: "14px 16px", borderTop: "1px solid #F1F5F9",
          }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0F172A" }}>{m.label}</div>
              <div style={{ fontSize: 12.5, color: m.effective ? "#15803D" : "#64748B", marginTop: 2 }}>
                {m.effective ? "Grille active" : "Anciennes règles"}
                {m.enabled && !m.effective && " (bloqué par l'arrêt d'urgence)"}
              </div>
            </div>
            <button
              role="switch" aria-checked={m.enabled} aria-label={`Grille pour ${m.label}`}
              disabled={busy === m.module} onClick={() => flip(m.module, !m.enabled)}
              style={{
                width: 50, height: 28, borderRadius: 14, border: "none", padding: 3, cursor: "pointer",
                background: m.enabled ? "#16A34A" : "#CBD5E1", display: "flex",
                justifyContent: m.enabled ? "flex-end" : "flex-start", transition: "background 0.15s",
              }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Journal ──────────────────────────────────────────────────────────────────
function HistoryTab() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { accessService.history().then(setRows).catch(e => setError(errorMessage(e))); }, []);

  const describe = (v: boolean | null, isSwitch: boolean) =>
    v === null ? (isSwitch ? "—" : "comme son rôle") : isSwitch ? (v ? "grille" : "anciennes règles") : v ? "oui" : "non";

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return null;
  if (rows.length === 0) return <Notice tone="info">Aucun changement pour le moment.</Notice>;

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      {rows.map(r => {
        const isSwitch = r.code.startsWith("interrupteur:");
        const target = isSwitch ? "Interrupteur" : r.role ? `Rôle ${ROLE_LABELS[r.role]}` : r.user ?? "—";
        return (
          <div key={r.id} style={{ padding: "11px 16px", borderTop: "1px solid #F1F5F9", fontSize: 13.5 }}>
            <div style={{ color: "#0F172A" }}>
              <strong>{target}</strong> · {r.label} : {describe(r.before, isSwitch)} → <strong>{describe(r.after, isSwitch)}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{formatDateTime(r.at)} · par {r.by ?? "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const [tab, setTab] = useState<Tab>("roles");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [grid, setGrid] = useState<RoleGrid | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([accessService.catalog(), accessService.roles()])
      .then(([c, g]) => { setCatalog(c); setGrid(g); })
      .catch(e => setError(errorMessage(e)));
  }, []);

  const ready = useMemo(() => !!catalog && !!grid, [catalog, grid]);

  return (
    <div>
      <PageHeader title="Permissions" subtitle="Qui peut faire quoi dans ShopM" />

      <div role="tablist" aria-label="Sections des permissions" style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 14px", borderRadius: 9, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer",
            fontWeight: tab === t.key ? 600 : 500,
            background: tab === t.key ? "#0F172A" : "#fff", color: tab === t.key ? "#fff" : "#475569",
            border: tab === t.key ? "1px solid #0F172A" : "1px solid #E2E8F0",
          }}>{t.label}</button>
        ))}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {tab === "roles" && ready && <RolesTab catalog={catalog!} grid={grid!} setGrid={setGrid} />}
      {tab === "people" && ready && <PeopleTab catalog={catalog!} grid={grid!} />}
      {tab === "switches" && <SwitchesTab />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}
