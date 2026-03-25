// src/router/RoleRedirect.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return null;

  const redirectMap = {
    SUPER_ADMIN:  "/admin",
    SHOP_MANAGER: "/manager",
    EMPLOYEE:     "/employee",
    LIVREUR:      "/livreur", 
  };

  return <Navigate to={redirectMap[user.role]} replace />;
}
