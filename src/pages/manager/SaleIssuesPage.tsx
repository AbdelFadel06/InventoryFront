// src/pages/manager/SaleIssuesPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SaleDetailModal } from "../shared/SalesListPage";
import { PageHeader, Badge, DataTable } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import axiosInstance from "../../api/axiosInstance";

interface SaleIssue {
  id: number;
  sale: number;
  sale_reference: string;
  sale_total: string;
  sale_status: "completed" | "cancelled";
  reason_label: string;
  comment: string;
  status: "open" | "resolved";
  reported_by_name: string | null;
  created_at: string;
  resolved_by_name: string | null;
  resolution_note: string;
}

const fmtPrice = (n: number | string) => Number(n).toLocaleString("fr-FR") + " F";

const actionButton = (color: string, background: string, border: string): React.CSSProperties => ({
  padding: "5px 10px", borderRadius: 7, border: `1px solid ${border}`, background, color,
  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
});

export default function SaleIssuesPage() {
  const { activeShop } = useAuth();
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [issues, setIssues] = useState<SaleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ?sale=<id> : ouverture directe depuis la cloche.
  const [searchParams, setSearchParams] = useSearchParams();
  const openSaleId = Number(searchParams.get("sale")) || null;
  const openSale = (saleId: number | null) => {
    setSearchParams(saleId ? { sale: String(saleId) } : {}, { replace: true });
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/sale-issues/", { params: { status: filter, page_size: 100 } });
      setIssues(res.data.results ?? res.data);
    } catch {
      setError("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, activeShop?.id]);

  const run = async (issue: SaleIssue, action: () => Promise<unknown>) => {
    setBusyId(issue.id);
    setError(null);
    try {
      await action();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "L'opération a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = (issue: SaleIssue) => {
    const note = window.prompt(`Clôturer le signalement de ${issue.sale_reference}.\n\nComment le problème a-t-il été traité ?`)?.trim();
    if (note) run(issue, () => axiosInstance.post(`/sale-issues/${issue.id}/resolve/`, { note }));
  };

  const handleCancelSale = (issue: SaleIssue) => {
    const reason = window.prompt(`Annuler la vente ${issue.sale_reference} ? Le stock sera remis en place.\n\nMotif (obligatoire) :`)?.trim();
    if (reason) run(issue, () => axiosInstance.post(`/sales/${issue.sale}/cancel/`, { reason }));
  };

  const columns = [
    { key: "sale_reference", label: "Vente", render: (i: SaleIssue) => (
      <button onClick={() => openSale(i.sale)} title="Voir la vente" style={{
        background: "none", border: "none", padding: 0, cursor: "pointer", color: "#2563EB",
        fontFamily: "monospace", fontWeight: 700, fontSize: 12, textDecoration: "underline",
      }}>
        {i.sale_reference}
      </button>
    ) },
    { key: "sale_total", label: "Montant", render: (i: SaleIssue) => fmtPrice(i.sale_total) },
    { key: "reason_label", label: "Motif", render: (i: SaleIssue) => (
      <div>
        <Badge label={i.reason_label} color="yellow" />
        {i.comment && <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>{i.comment}</div>}
      </div>
    ) },
    { key: "reported_by_name", label: "Signalé par", render: (i: SaleIssue) => (
      <div>
        <div>{i.reported_by_name ?? "—"}</div>
        <div style={{ fontSize: 12, color: "#94A3B8" }}>{formatDateTime(i.created_at)}</div>
      </div>
    ) },
    filter === "open"
      ? { key: "actions", label: "Actions", render: (i: SaleIssue) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button disabled={busyId === i.id} onClick={() => handleResolve(i)} style={actionButton("#047857", "#ECFDF5", "#A7F3D0")}>
            Clôturer
          </button>
          {i.sale_status === "completed" && (
            <button disabled={busyId === i.id} onClick={() => handleCancelSale(i)} style={actionButton("#DC2626", "#FEF2F2", "#FECACA")}>
              Annuler la vente
            </button>
          )}
        </div>
      ) }
      : { key: "resolution_note", label: "Traitement", render: (i: SaleIssue) => (
        <div>
          <div>{i.resolution_note}</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>{i.resolved_by_name ?? "—"}</div>
        </div>
      ) },
  ];

  return (
    <div>
      <PageHeader
        title="Signalements"
        subtitle="Ventes signalées par la caisse. Pour corriger une livraison, passez par la page Livraisons."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["open", "resolved"] as const).map(value => (
          <button key={value} onClick={() => setFilter(value)} style={{
            padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            border: filter === value ? "1px solid #1D4ED8" : "1px solid #E2E8F0",
            background: filter === value ? "#EFF6FF" : "#fff",
            color: filter === value ? "#1D4ED8" : "#64748B",
          }}>
            {value === "open" ? "À traiter" : "Traités"}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 9, background: "#FEF2F2", color: "#B91C1C", fontSize: 13 }}>
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={issues}
        loading={loading}
        emptyText={filter === "open" ? "Aucune vente à traiter." : "Aucun signalement traité."}
      />

      {openSaleId && (
        <SaleDetailModal saleId={openSaleId} onClose={() => openSale(null)} onRefresh={load} />
      )}
    </div>
  );
}
