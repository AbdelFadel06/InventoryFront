// src/components/layout/MainLayout.tsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/user";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS: Record<string, string> = {
  dashboard:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  products:   "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  stocks:     "M3 3h18v18H3zM3 9h18M9 21V9",
  inventory:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  employees:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  shops:      "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  transfers:  "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  movements:  "M13 2L3 14h9l-1 8 10-12h-9l1-8",
  logout:     "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  menu:       "M4 6h16M4 12h16M4 18h16",
  close:      "M18 6L6 18M6 6l12 12",
  bell:       "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
};

type NavItem = { label: string; path: string; icon: string };

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard",   path: "/admin",             icon: "dashboard"  },
    { label: "Boutiques",   path: "/admin/shops",       icon: "shops"      },
    { label: "Produits",    path: "/admin/products",    icon: "products"   },
    { label: "Stocks",      path: "/admin/stocks",      icon: "stocks"     },
    { label: "Transferts",  path: "/admin/transfers",   icon: "transfers"  },
    { label: "Mouvements",  path: "/admin/movements",   icon: "movements"  },
    { label: "Inventaires", path: "/admin/inventories", icon: "inventory"  },
    { label: "Employés",    path: "/admin/users",       icon: "employees"  },
  ],
  SHOP_MANAGER: [
    { label: "Dashboard",   path: "/manager",             icon: "dashboard"  },
    { label: "Produits",    path: "/manager/products",    icon: "products"   },
    { label: "Stocks",      path: "/manager/stocks",      icon: "stocks"     },
    { label: "Transferts",  path: "/manager/transfers",   icon: "transfers"  },
    { label: "Mouvements",  path: "/manager/movements",   icon: "movements"  },
    { label: "Inventaires", path: "/manager/inventories", icon: "inventory"  },
    { label: "Équipe",      path: "/manager/users",       icon: "employees"  },
  ],
  EMPLOYEE: [
    { label: "Dashboard",   path: "/employee",             icon: "dashboard"  },
    { label: "Produits",    path: "/employee/products",    icon: "products"   },
    { label: "Stocks",      path: "/employee/stocks",      icon: "stocks"     },
    { label: "Inventaires", path: "/employee/inventories", icon: "inventory"  },
    { label: "Mouvements",  path: "/employee/movements",   icon: "movements"  },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:  "Super Admin",
  SHOP_MANAGER: "Manager",
  EMPLOYEE:     "Employé",
};

function SidebarContent({ collapsed, onNavClick, onLogout }: {
  collapsed: boolean; onNavClick?: () => void; onLogout: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;
  const navItems  = NAV_ITEMS[user.role] ?? [];
  const roleLabel = ROLE_LABELS[user.role];
  const initials  = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <>
      <div style={{
        padding: collapsed ? "20px 0" : "20px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 68,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: collapsed ? 16 : 0, transition: "margin 0.25s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>StockFlow</div>
            <div style={{ color: "#64748B", fontSize: 11 }}>Gestion d'inventaire</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}
            end={item.path.split("/").length <= 2}
            onClick={onNavClick}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 12,
              padding: collapsed ? "11px 0" : "11px 16px",
              justifyContent: collapsed ? "center" : "flex-start",
              margin: "2px 8px", borderRadius: 10, textDecoration: "none",
              color: isActive ? "#fff" : "#94A3B8",
              background: isActive ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(29,78,216,0.15))" : "transparent",
              borderLeft: isActive ? "3px solid #3B82F6" : "3px solid transparent",
              fontSize: 13.5, fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s", whiteSpace: "nowrap",
            })}>
            <span style={{ flexShrink: 0 }}><Icon d={ICONS[item.icon]} size={17} /></span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: collapsed ? "16px 0" : "16px" }}>
        {!collapsed && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#E2E8F0", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ color: "#64748B", fontSize: 11 }}>{roleLabel}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: collapsed ? "10px 0" : "10px",
          justifyContent: collapsed ? "center" : "flex-start",
          background: "none", border: "none", cursor: "pointer",
          color: "#64748B", fontSize: 13, borderRadius: 8,
          transition: "color 0.15s", fontFamily: "inherit",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
        >
          <Icon d={ICONS.logout} size={16} />
          {!collapsed && "Déconnexion"}
        </button>
      </div>
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile(768);
  const [collapsed,  setCollapsed]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  if (!user) return null;

  const initials  = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const handleLogout = () => { logout(); navigate("/login"); };

  // ── MOBILE ───────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8", fontFamily: "'DM Sans', sans-serif" }}>
        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 150,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
          }} />
        )}
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 200,
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
          display: "flex", flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          boxShadow: drawerOpen ? "4px 0 32px rgba(0,0,0,0.3)" : "none",
          overflow: "hidden",
        }}>
          <button onClick={() => setDrawerOpen(false)} style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", border: "none",
            cursor: "pointer", color: "#94A3B8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon d={ICONS.close} size={16} />
          </button>
          <SidebarContent collapsed={false} onNavClick={() => setDrawerOpen(false)} onLogout={handleLogout} />
        </aside>

        <header style={{
          position: "sticky", top: 0, zIndex: 100, height: 56,
          background: "#fff", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <button onClick={() => setDrawerOpen(true)} style={{
            width: 36, height: 36, borderRadius: 8, background: "#F1F5F9",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#374151", flexShrink: 0,
          }}>
            <Icon d={ICONS.menu} size={18} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>StockFlow</span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
        </header>

        <main style={{ padding: "16px", minHeight: "calc(100vh - 56px)" }}>
          {children}
        </main>
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8", fontFamily: "'DM Sans', sans-serif" }}>
      <aside style={{
        width: collapsed ? 68 : 240, minHeight: "100vh",
        background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
        position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 100, overflow: "hidden",
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
      }}>
        <SidebarContent collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      <div style={{
        flex: 1, marginLeft: collapsed ? 68 : 240,
        transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
        display: "flex", flexDirection: "column", minHeight: "100vh",
      }}>
        <header style={{
          height: 64, background: "#fff", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", padding: "0 28px", gap: 16,
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: 36, height: 36, borderRadius: 8, background: "#F1F5F9",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748B", flexShrink: 0, transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#E2E8F0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#F1F5F9")}
          >
            <Icon d={ICONS.menu} size={16} />
          </button>
          <div style={{ flex: 1 }} />
          <button style={{
            width: 36, height: 36, borderRadius: 8, background: "#F1F5F9",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B",
          }}>
            <Icon d={ICONS.bell} size={16} />
          </button>
          <div style={{ fontSize: 13, color: "#475569" }}>
            <span style={{ fontWeight: 600 }}>{user.first_name}</span>
            <span style={{
              marginLeft: 8, fontSize: 11, color: "#3B82F6",
              background: "#EFF6FF", padding: "2px 8px", borderRadius: 20, fontWeight: 500,
            }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
