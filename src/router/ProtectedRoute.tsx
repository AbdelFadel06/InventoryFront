// src/router/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/user";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Chargement...
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si rôle non autorisé → redirige vers sa propre interface
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
