// src/services/inventoryService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type {
  Inventory, InventoryCreate, InventoryLine,
  CountProductPayload, CountMultiplePayload,
  AddProductsPayload, InventoryDiscrepancyResponse,
  InventoryStatistics,
} from "../types/inventory";
import type { PaginatedResponse } from "../types/common";

export const inventoryService = {
  getAll: async (): Promise<PaginatedResponse<Inventory>> => {
    const { data } = await api.get(ENDPOINTS.inventories.list);
    return data;
  },

  getById: async (id: number): Promise<Inventory> => {
    const { data } = await api.get(ENDPOINTS.inventories.detail(id));
    return data;
  },

  getStatistics: async (): Promise<InventoryStatistics> => {
    const { data } = await api.get(ENDPOINTS.inventories.statistics);
    return data;
  },

  create: async (payload: InventoryCreate): Promise<Inventory> => {
    const { data } = await api.post(ENDPOINTS.inventories.create, payload);
    return data;
  },

  update: async (id: number, payload: Partial<InventoryCreate>): Promise<Inventory> => {
    const { data } = await api.patch(ENDPOINTS.inventories.detail(id), payload);
    return data;
  },

  // ── Actions workflow ─────────────────────────────────────────
  addProducts: async (id: number, payload: AddProductsPayload) => {
    const { data } = await api.post(ENDPOINTS.inventories.addProducts(id), payload);
    return data;
  },

  start: async (id: number): Promise<{ message: string; inventory: Inventory }> => {
    const { data } = await api.post(ENDPOINTS.inventories.start(id));
    return data;
  },

  countProduct: async (id: number, payload: CountProductPayload): Promise<{ message: string; line: InventoryLine; progress: number }> => {
    const { data } = await api.post(ENDPOINTS.inventories.countProduct(id), payload);
    return data;
  },

  countMultiple: async (id: number, payload: CountMultiplePayload): Promise<{ message: string; progress: number }> => {
    const { data } = await api.post(ENDPOINTS.inventories.countMultiple(id), payload);
    return data;
  },

  complete: async (id: number): Promise<{ message: string; inventory: Inventory }> => {
    const { data } = await api.post(ENDPOINTS.inventories.complete(id));
    return data;
  },

  validate: async (id: number): Promise<{ message: string; inventory: Inventory }> => {
    const { data } = await api.post(ENDPOINTS.inventories.validate(id));
    return data;
  },

  cancel: async (id: number): Promise<{ message: string; inventory: Inventory }> => {
    const { data } = await api.post(ENDPOINTS.inventories.cancel(id));
    return data;
  },

  getDiscrepancies: async (id: number): Promise<InventoryDiscrepancyResponse> => {
    const { data } = await api.get(ENDPOINTS.inventories.discrepancies(id));
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.inventories.detail(id));
  },
};

