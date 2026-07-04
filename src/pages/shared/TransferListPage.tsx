// src/pages/shared/TransferListPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { transferService } from "../../services/transferService";
import { useAuth } from "../../context/AuthContext";
import { PageHeader, Btn, Badge, DataTable, PaginationBar } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import type { StockTransfer, TransferStatus } from "../../types/transfer";

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: "gray" | "blue" | "green" | "red" | "yellow" }> = {
  pending:    { label: "En attente",  color: "yellow" },
  in_transit: { label: "En transit", color: "blue"   },
  received:   { label: "Reçu",       color: "green"  },
  cancelled:  { label: "Annulé",     color: "red"    },
};

export default function TransferListPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const basePath  = user?.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<TransferStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTransfers = async (page = 1, q = "", status = filterStatus) => {
    setLoading(true);
    const params: Record<string, any> = { page };
    if (q) params.search = q;
    if (status !== "all") params.status = status;
    try {
      const res = await transferService.getAll(params);
      setTransfers(res.results ?? []);
      setTotalCount(res.count ?? 0);
    } catch {
      setError("Erreur lors du chargement des transferts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(currentPage, search, filterStatus); }, [currentPage]);
  useEffect(() => { fetchTransfers(1, "", "all"); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchTransfers(1, val, filterStatus); }, 300);
  };

  const handleFilterStatus = (status: typeof filterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
    fetchTransfers(1, search, status);
  };

  const handleAction = async (id: number, action: "send" | "receive" | "cancel") => {
    setActionLoading(id);
    setError(null);
    try {
      if (action === "send")    await transferService.send(id);
      if (action === "receive") await transferService.receive(id);
      if (action === "cancel")  await transferService.cancel(id);
      await fetchTransfers(currentPage, search, filterStatus);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Une erreur est survenue.");
    } finally {
      setActionLoading(null);
    }
  };

  // Stats rapides (current page)
  const pending   = transfers.filter(t => t.status === "pending").length;
  const inTransit = transfers.filter(t => t.status === "in_transit").length;
  const received  = transfers.filter(t => t.status === "received").length;

  const columns = [
    {
      key: "reference", label: "Référence",
      render: (row: StockTransfer) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1D4ED8", fontSize: 12.5 }}>
          {row.reference}
        </span>
      ),
    },
    {
      key: "product_name", label: "Produit",
      render: (row: StockTransfer) => (
        <div>
          <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>{row.product_name}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: "monospace" }}>{row.product_sku}</div>
        </div>
      ),
    },
    {
      key: "route", label: "Trajet",
      render: (row: StockTransfer) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span style={{
            background: "#F1F5F9", padding: "3px 8px", borderRadius: 6,
            color: "#374151", fontWeight: 500, fontSize: 12,
          }}>
            {row.from_shop_name}
          </span>
          <span style={{ color: "#94A3B8", fontSize: 16 }}>→</span>
          <span style={{
            background: "#EFF6FF", padding: "3px 8px", borderRadius: 6,
            color: "#1D4ED8", fontWeight: 500, fontSize: 12,
          }}>
            {row.to_shop_name}
          </span>
        </div>
      ),
    },
    {
      key: "quantity", label: "Quantité",
      render: (row: StockTransfer) => (
        <span style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          padding: "4px 12px", borderRadius: 20,
          fontWeight: 700, fontSize: 13, color: "#0F172A",
        }}>
          {row.quantity}
        </span>
      ),
    },
    {
      key: "status", label: "Statut",
      render: (row: StockTransfer) => {
        const s = STATUS_CONFIG[row.status];
        return <Badge label={s.label} color={s.color} />;
      },
    },
    {
      key: "created_at", label: "Date",
      render: (row: StockTransfer) => (
        <span style={{ fontSize: 12.5, color: "#64748B" }}>
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (row: StockTransfer) => {
        const loading = actionLoading === row.id;
        const isFromShop = user?.role === "SUPER_ADMIN" || row.from_shop === user?.shop;
        const isToShop   = user?.role === "SUPER_ADMIN" || row.to_shop  === user?.shop;

        return (
          <div style={{ display: "flex", gap: 6 }}>
            {row.status === "pending" && isFromShop && (
              <Btn size="sm" variant="primary" disabled={loading}
                onClick={() => handleAction(row.id, "send")}>
                {loading ? "..." : "Envoyer"}
              </Btn>
            )}
            {row.status === "in_transit" && isToShop && (
              <Btn size="sm" variant="secondary" disabled={loading}
                onClick={() => handleAction(row.id, "receive")}>
                {loading ? "..." : "Recevoir"}
              </Btn>
            )}
            {["pending", "in_transit"].includes(row.status) && isFromShop && (
              <Btn size="sm" variant="danger" disabled={loading}
                onClick={() => handleAction(row.id, "cancel")}>
                {loading ? "..." : "✕"}
              </Btn>
            )}
            {["received", "cancelled"].includes(row.status) && (
              <span style={{ fontSize: 12, color: "#94A3B8" }}>—</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transferts de stock"
        subtitle="Transferts entre boutiques"
        action={
          <Btn onClick={() => navigate(`${basePath}/transfers/create`)}>
            + Nouveau transfert
          </Btn>
        }
      />

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          color: "#DC2626", borderRadius: 10, padding: "12px 16px",
          fontSize: 13.5, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Stats rapides */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { label: "En attente",  value: pending,   color: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
          { label: "En transit",  value: inTransit, color: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
          { label: "Reçus",       value: received,  color: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.color, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: "10px 18px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.text }}>{s.value}</span>
            <span style={{ fontSize: 12.5, color: s.text, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select
          value={filterStatus}
          onChange={e => handleFilterStatus(e.target.value as typeof filterStatus)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: "#fff", fontSize: 13, color: "#0F172A",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_transit">En transit</option>
          <option value="received">Reçus</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      <DataTable
        columns={columns as any}
        data={transfers}
        loading={loading}
        emptyText="Aucun transfert trouvé"
        searchValue={search}
        onSearch={handleSearch}
        searchPlaceholder="Référence, produit, boutique..."
      />
      <PaginationBar currentPage={currentPage} totalCount={totalCount} onPage={setCurrentPage} />
    </div>
  );
}
