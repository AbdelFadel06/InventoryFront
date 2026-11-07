// src/hooks/useRegisterAccess.ts
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

/**
 * Droits de caisse de l'utilisateur connecté, pour afficher ou masquer les boutons.
 * Le serveur reste seul juge : ceci n'évite que des boutons qui échoueraient.
 */
export function useRegisterAccess() {
  const { user } = useAuth();
  const isManager = user?.role === "SHOP_MANAGER";
  const isEmployee = user?.role === "EMPLOYEE";
  const [isActiveCashier, setIsActiveCashier] = useState(false);

  useEffect(() => {
    if (!isEmployee) return;
    axiosInstance.get("/cashier-sessions/active/")
      .then(res => setIsActiveCashier(Boolean(res.data?.id)))
      .catch(() => setIsActiveCashier(false));
  }, [isEmployee]);

  return {
    /** Annuler une vente, corriger une livraison à tout moment. */
    canManageSales: isManager || user?.role === "SUPER_ADMIN",
    /** Valider l'argent d'un livreur, modifier une livraison pas encore collectée. */
    canOperateRegister: isManager || isActiveCashier,
  };
}
