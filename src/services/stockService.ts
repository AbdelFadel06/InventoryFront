// src/services/stockService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type {
  Stock, StockAdjust,
  StockMovement, StockMovementCreate,
  StockTransfer, StockTransferCreate,
} from "../types/stock";
import type { PaginatedResponse } from "../types/common";

// ── Stocks ───────────────────────────────────────────────────────
export const stockService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Stock>> => {
    const { data } = await api.get(ENDPOINTS.stocks.list, { params });
    return data;
  },

  getById: async (id: number): Promise<Stock> => {
    const { data } = await api.get(ENDPOINTS.stocks.detail(id));
    return data;
  },

  getAlerts: async (type?: "critical" | "low" | "out" | "all") => {
    const { data } = await api.get(ENDPOINTS.stocks.alerts, { params: { type } });
    return data;
  },

  adjust: async (payload: StockAdjust) => {
    const { data } = await api.post(ENDPOINTS.stocks.adjust, payload);
    return data;
  },
};

// ── Stock Movements ──────────────────────────────────────────────
export const stockMovementService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<StockMovement>> => {
    const { data } = await api.get(ENDPOINTS.stockMovements.list, { params });
    return data;
  },

  getById: async (id: number): Promise<StockMovement> => {
    const { data } = await api.get(ENDPOINTS.stockMovements.detail(id));
    return data;
  },

  addStock: async (payload: StockMovementCreate): Promise<StockMovement> => {
    const { data } = await api.post(ENDPOINTS.stockMovements.addStock, payload);
    return data;
  },

  removeStock: async (payload: StockMovementCreate): Promise<StockMovement> => {
    const { data } = await api.post(ENDPOINTS.stockMovements.removeStock, payload);
    return data;
  },
};

// ── Stock Transfers ──────────────────────────────────────────────
export const stockTransferService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<StockTransfer>> => {
    const { data } = await api.get(ENDPOINTS.stockTransfers.list, { params });
    return data;
  },

  getById: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.get(ENDPOINTS.stockTransfers.detail(id));
    return data;
  },

  create: async (payload: StockTransferCreate): Promise<StockTransfer> => {
    const { data } = await api.post(ENDPOINTS.stockTransfers.create, payload);
    return data;
  },

  send: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.post(ENDPOINTS.stockTransfers.send(id));
    return data;
  },

  receive: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.post(ENDPOINTS.stockTransfers.receive(id));
    return data;
  },

  cancel: async (id: number): Promise<StockTransfer> => {
    const { data } = await api.post(ENDPOINTS.stockTransfers.cancel(id));
    return data;
  },

  update: async (id: number, payload: Partial<StockTransferCreate>): Promise<StockTransfer> => {
    const { data } = await api.patch(ENDPOINTS.stockTransfers.detail(id), payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.stockTransfers.detail(id));
  },
};
