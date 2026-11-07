// src/components/OpenIssuesBanner.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

/** Rappelle au manager les ventes signalées par la caisse et pas encore traitées. */
export default function OpenIssuesBanner() {
  const { user, activeShop } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === "SHOP_MANAGER";
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isManager) return;
    axiosInstance.get("/sale-issues/", { params: { status: "open" } })
      .then(res => setCount(res.data?.count ?? 0))
      .catch(() => setCount(0));
  }, [isManager, activeShop?.id]);

  if (!isManager || count === 0) return null;

  return (
    <button className="no-print" onClick={() => navigate("/manager/signalements")} style={{
      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
      padding: "12px 16px", marginBottom: 20, borderRadius: 12, cursor: "pointer",
      background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
      fontSize: 14, fontWeight: 600, fontFamily: "inherit", textAlign: "left",
    }}>
      <span>{count} vente{count > 1 ? "s" : ""} signalée{count > 1 ? "s" : ""} à traiter</span>
      <span>Voir →</span>
    </button>
  );
}
