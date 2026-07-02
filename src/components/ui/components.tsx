// src/components/ui/components.tsx
import { Icon } from "./Icon";
interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  color?:   "blue" | "green" | "orange" | "red" | "purple";
  sub?:     string;
  loading?: boolean;
}

const COLOR_MAP = {
  blue:   { bg: "#EFF6FF", accent: "#3B82F6", text: "#1D4ED8" },
  green:  { bg: "#F0FDF4", accent: "#22C55E", text: "#15803D" },
  orange: { bg: "#FFF7ED", accent: "#F97316", text: "#C2410C" },
  red:    { bg: "#FEF2F2", accent: "#EF4444", text: "#DC2626" },
  purple: { bg: "#F5F3FF", accent: "#8B5CF6", text: "#6D28D9" },
  gray:   { bg: "#F8FAFC", accent: "#94A3B8", text: "#64748B" },
  yellow: { bg: "#FEFCE8", accent: "#EAB308", text: "#854D0E" },
};

export function StatCard({ label, value, icon, color = "blue", sub, loading }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "20px 22px",
      border: "1px solid #E2E8F0",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c.bg, display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: c.accent,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: "#94A3B8", fontWeight: 500, marginBottom: 4 }}>
          {label}
        </div>
        {loading ? (
          <div style={{
            height: 28, width: 64, borderRadius: 6,
            background: "#F1F5F9", animation: "pulse 1.5s infinite",
          }} />
        ) : (
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>
            {value}
          </div>
        )}
        {sub && !loading && (
          <div style={{ fontSize: 11.5, color: c.text, marginTop: 4, fontWeight: 500 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between", marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13.5, color: "#94A3B8", marginTop: 4, marginBottom: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// Btn — bouton réutilisable
// ─────────────────────────────────────────────────────────────────
interface BtnProps {
  children:  React.ReactNode;
  onClick?:  () => void;
  variant?:  "primary" | "secondary" | "danger" | "ghost";
  size?:     "sm" | "md";
  disabled?: boolean;
  type?:     "button" | "submit";
}

const BTN_STYLES = {
  primary:   { background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#fff",      border: "none" },
  secondary: { background: "#fff",    color: "#374151", border: "1px solid #D1D5DB" },
  danger:    { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA"  },
  ghost:     { background: "transparent", color: "#64748B", border: "none" },
};

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button" }: BtnProps) {
  const s = BTN_STYLES[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s,
        padding: size === "sm" ? "6px 14px" : "9px 20px",
        fontSize: size === "sm" ? 12.5 : 13.5,
        fontWeight: 600,
        borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        transition: "opacity 0.15s, box-shadow 0.15s",
        boxShadow: variant === "primary" ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.opacity = "0.88";
      }}
      onMouseLeave={e => {
        if (!disabled) e.currentTarget.style.opacity = "1";
      }}
    >
      {children}
    </button>
  );
}


// ─────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────
interface BadgeProps {
  label:   string;
  color?:  "blue" | "green" | "orange" | "red" | "gray" | "purple" | "yellow";
}

const BADGE_COLORS = {
  blue:   { bg: "#EFF6FF", color: "#1D4ED8" },
  green:  { bg: "#F0FDF4", color: "#15803D" },
  orange: { bg: "#FFF7ED", color: "#C2410C" },
  red:    { bg: "#FEF2F2", color: "#DC2626" },
  gray:   { bg: "#F8FAFC", color: "#64748B" },
  purple: { bg: "#F5F3FF", color: "#6D28D9" },
  yellow: { bg: "#FEFCE8", color: "#854D0E" },
};

export function Badge({ label, color = "gray" }: BadgeProps) {
  const c = BADGE_COLORS[color];
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11.5, fontWeight: 600,
      display: "inline-block",
    }}>
      {label}
    </span>
  );
}


// ─────────────────────────────────────────────────────────────────
// DataTable
// ─────────────────────────────────────────────────────────────────
interface Column<T> {
  key:      string;
  label:    string;
  width?:   string;
  render?:  (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns:   Column<T>[];
  data:      T[];
  loading?:  boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  searchValue?: string;
  onSearch?:  (v: string) => void;
  searchPlaceholder?: string;
  actions?:  React.ReactNode;
  rowStyle?: (row: T) => React.CSSProperties;
}

export function DataTable<T extends { id: number | string }>({
  columns, data, loading, emptyText = "Aucun résultat",
  onRowClick, searchValue, onSearch, searchPlaceholder = "Rechercher...",
  actions, rowStyle,
}: DataTableProps<T>) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      
    }}>
      {/* Table toolbar */}
      {(onSearch !== undefined || actions) && (
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          {onSearch !== undefined && (
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)", color: "#94A3B8",
                display: "flex", alignItems: "center",
              }}><Icon size={14} name="search" /></span>
              <input
                value={searchValue ?? ""}
                onChange={e => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%", padding: "8px 12px 8px 34px",
                  border: "1px solid #E2E8F0", borderRadius: 9,
                  fontSize: 13, color: "#374151", outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "#3B82F6")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {actions}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {columns.map(col => (
                <th key={col.key} style={{
                  textAlign: "left",
                  padding: "11px 18px",
                  color: "#64748B",
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #E2E8F0",
                  width: col.width,
                  whiteSpace: "nowrap",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{
                        height: 14, borderRadius: 4,
                        background: "#F1F5F9",
                        width: `${60 + Math.random() * 30}%`,
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: "48px", textAlign: "center",
                  color: "#94A3B8", fontSize: 14,
                }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const extraStyle = rowStyle?.(row) ?? {};
                const baseBg = (extraStyle.background ?? extraStyle.backgroundColor ?? "transparent") as string;
                return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: idx < data.length - 1 ? "1px solid #F1F5F9" : "none",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background 0.1s",
                    ...extraStyle,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = baseBg !== "transparent"
                      ? baseBg
                      : (onRowClick ? "#F8FAFC" : "transparent");
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = baseBg;
                  }}
                >
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "13px 18px", color: "#374151" }}>
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// PaginationBar
// ─────────────────────────────────────────────────────────────────
export function PaginationBar({
  currentPage,
  totalCount,
  pageSize = 10,
  onPage,
}: {
  currentPage: number;
  totalCount:  number;
  pageSize?:   number;
  onPage:      (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalCount <= pageSize) return null;

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: "7px 18px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
    border: "none", fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#F1F5F9" : "#0F172A",
    color: disabled ? "#94A3B8" : "#fff",
    transition: "background 0.15s",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
      <button style={btnStyle(currentPage <= 1)} disabled={currentPage <= 1} onClick={() => onPage(currentPage - 1)}>
        ← Précédent
      </button>
      <span style={{ fontSize: 13.5, color: "#64748B", fontWeight: 500 }}>
        Page {currentPage} / {totalPages}
        <span style={{ color: "#94A3B8", fontWeight: 400, marginLeft: 6 }}>({totalCount})</span>
      </span>
      <button style={btnStyle(currentPage >= totalPages)} disabled={currentPage >= totalPages} onClick={() => onPage(currentPage + 1)}>
        Suivant →
      </button>
    </div>
  );
}
