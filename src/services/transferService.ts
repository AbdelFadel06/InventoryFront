// src/services/transferService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type { StockTransfer, StockTransferCreate } from "../types/transfer";
import type { PaginatedResponse } from "../types/common";

export const transferService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<StockTransfer>> => {
    const res = await api.get(ENDPOINTS.stockTransfers.list, { params });
    return res.data;
  },

  getById: async (id: number): Promise<StockTransfer> => {
    const res = await api.get(ENDPOINTS.stockTransfers.detail(id));
    return res.data;
  },

  create: async (data: StockTransferCreate): Promise<StockTransfer> => {
    const res = await api.post(ENDPOINTS.stockTransfers.list, data);
    return res.data;
  },

  send: async (id: number): Promise<{ message: string; transfer: StockTransfer }> => {
    const res = await api.post(ENDPOINTS.stockTransfers.send(id));
    return res.data;
  },

  receive: async (id: number): Promise<{ message: string; transfer: StockTransfer }> => {
    const res = await api.post(ENDPOINTS.stockTransfers.receive(id));
    return res.data;
  },

  cancel: async (id: number): Promise<{ message: string; transfer: StockTransfer }> => {
    const res = await api.post(ENDPOINTS.stockTransfers.cancel(id));
    return res.data;
  },
};
