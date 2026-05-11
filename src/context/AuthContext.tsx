// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types/user";
import type { Shop } from "../types/shop";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import { shopService } from "../services/shopService";
import type { TokenObtainPair } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: TokenObtainPair) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  // Boutique active (manager multi-boutiques)
  activeShop: Shop | null;
  managedShops: Shop[];
  setActiveShop: (shop: Shop) => void;
  needsShopSelection: boolean;      // true après login si manager multi-boutiques
  confirmShopSelection: () => void; // ferme le modal de sélection
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACTIVE_SHOP_KEY = "shopm_active_shop_id";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [managedShops, setManagedShops] = useState<Shop[]>([]);
  const [activeShop, setActiveShopState] = useState<Shop | null>(null);
  const [needsShopSelection, setNeedsShopSelection] = useState(false);

  const loadManagedShops = async (): Promise<Shop[]> => {
    try {
      const res = await shopService.getAll();
      const shops = (res.results ?? res as any) as Shop[];
      return shops;
    } catch {
      return [];
    }
  };

  const resolveActiveShop = (shops: Shop[]): Shop | null => {
    if (shops.length === 0) return null;
    const savedId = localStorage.getItem(ACTIVE_SHOP_KEY);
    if (savedId) {
      const found = shops.find(s => s.id === Number(savedId));
      if (found) return found;
    }
    return shops[0];
  };

  useEffect(() => {
    const init = async () => {
      if (authService.isAuthenticated()) {
        try {
          const me = await userService.getMe();
          setUser(me);
          if (me.role === "SHOP_MANAGER") {
            const shops = await loadManagedShops();
            setManagedShops(shops);
            const active = resolveActiveShop(shops);
            setActiveShopState(active);
          }
        } catch {
          authService.logout();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (credentials: TokenObtainPair) => {
    await authService.login(credentials);
    const me = await userService.getMe();
    setUser(me);

    if (me.role === "SHOP_MANAGER") {
      const shops = await loadManagedShops();
      setManagedShops(shops);
      const savedId = localStorage.getItem(ACTIVE_SHOP_KEY);
      const hasSaved = savedId && shops.some(s => s.id === Number(savedId));

      if (shops.length > 1 && !hasSaved) {
        // Multi-boutiques sans préférence sauvegardée → forcer la sélection
        setNeedsShopSelection(true);
        setActiveShopState(null);
      } else {
        const active = resolveActiveShop(shops);
        setActiveShopState(active);
      }
    }
  };

  const setActiveShop = (shop: Shop) => {
    setActiveShopState(shop);
    localStorage.setItem(ACTIVE_SHOP_KEY, String(shop.id));
  };

  const confirmShopSelection = () => {
    setNeedsShopSelection(false);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setManagedShops([]);
    setActiveShopState(null);
    setNeedsShopSelection(false);
    localStorage.removeItem(ACTIVE_SHOP_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      activeShop,
      managedShops,
      setActiveShop,
      needsShopSelection,
      confirmShopSelection,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
