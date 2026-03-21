// src/pages/DashboardPage.tsx
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:underline"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          ✅ Connexion réussie !
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Nom :</span> {user?.first_name} {user?.last_name}</p>
          <p><span className="font-medium">Email :</span> {user?.email}</p>
          <p><span className="font-medium">Rôle :</span> {user?.role}</p>
          <p><span className="font-medium">Boutique :</span> {user?.shop_name ?? "Aucune (Super Admin)"}</p>
        </div>
      </div>
    </div>
  );
}
