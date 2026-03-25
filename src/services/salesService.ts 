// src/services/salesService.ts
import api from "../api/axiosInstance";
import type {
  CashierSession, Sale, Expense, DailyReport, SaleCreateInput,
} from "../types/sales";
import type { PaginatedResponse } from "../types/common";

// ── Sessions de caisse ─────────────────────────────────────────────
export const sessionService = {
  getAll: async (): Promise<PaginatedResponse<CashierSession>> => {
    const res = await api.get("/cashier-sessions/");
    return res.data;
  },
  getActive: async (): Promise<CashierSession | null> => {
    const res = await api.get("/cashier-sessions/active/");
    return res.data.session ?? null;
  },
  create: async (data: {
    shop: number; cashier: number; period_type: string;
    start_date: string; end_date: string; notes?: string;
  }): Promise<CashierSession> => {
    const res = await api.post("/cashier-sessions/", data);
    return res.data;
  },
  close: async (id: number): Promise<CashierSession> => {
    const res = await api.post(`/cashier-sessions/${id}/close/`);
    return res.data;
  },
};

// ── Ventes ────────────────────────────────────────────────────────
export const saleService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Sale>> => {
    const res = await api.get("/sales/", { params });
    return res.data;
  },
  create: async (data: SaleCreateInput): Promise<Sale> => {
    const res = await api.post("/sales/", data);
    return res.data;
  },
  cancel: async (id: number): Promise<Sale> => {
    const res = await api.post(`/sales/${id}/cancel/`);
    return res.data;
  },
  markDelivered: async (id: number): Promise<Sale> => {
    const res = await api.post(`/sales/${id}/mark_delivered/`);
    return res.data;
  },
  getDailyReport: async (date?: string, shopId?: number): Promise<DailyReport> => {
    const params: Record<string, any> = {};
    if (date)   params.date = date;
    if (shopId) params.shop = shopId;
    const res = await api.get("/sales/daily_report/", { params });
    return res.data;
  },
  getLivreurPoint: async (livreurId?: number, date?: string) => {
    const params: Record<string, any> = {};
    if (livreurId) params.livreur_id = livreurId;
    if (date)      params.date = date;
    const res = await api.get("/sales/livreur_point/", { params });
    return res.data;
  },
};

// ── Dépenses ──────────────────────────────────────────────────────
export const expenseService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Expense>> => {
    const res = await api.get("/expenses/", { params });
    return res.data;
  },
  create: async (data: {
    session: number; label: string; amount: number; sale_date: string;
  }): Promise<Expense> => {
    const res = await api.post("/expenses/", data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}/`);
  },
};
