// src/services/shopService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type { Shop, ShopCreate, ShopUpdate, ShopStatistics } from "../types/shop";
import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/common";

export const shopService = {
  getAll: async (): Promise<PaginatedResponse<Shop>> => {
    const { data } = await api.get(ENDPOINTS.shops.list);
    return data;
  },

  getById: async (id: number): Promise<Shop> => {
    const { data } = await api.get(ENDPOINTS.shops.detail(id));
    return data;
  },

  getStatistics: async (): Promise<ShopStatistics> => {
    const { data } = await api.get(ENDPOINTS.shops.statistics);
    return data;
  },

  getEmployees: async (id: number): Promise<{ shop: string; total_employees: number; employees: User[] }> => {
    const { data } = await api.get(ENDPOINTS.shops.employees(id));
    return data;
  },

  getStaff: async (id: number): Promise<{ shop: string; total_staff: number; employees: User[] }> => {
    const { data } = await api.get(ENDPOINTS.shops.staff(id));
    return data;
  },

  create: async (payload: ShopCreate): Promise<Shop> => {
    const { data } = await api.post(ENDPOINTS.shops.create, payload);
    return data;
  },

  update: async (id: number, payload: Partial<ShopUpdate>): Promise<Shop> => {
    const { data } = await api.patch(ENDPOINTS.shops.detail(id), payload);
    return data;
  },

  assignManager: async (id: number, managerId: number): Promise<Shop> => {
    const { data } = await api.post(ENDPOINTS.shops.assignManager(id), { manager_id: managerId });
    return data;
  },

  toggleActive: async (id: number): Promise<{ is_active: boolean }> => {
    const { data } = await api.post(ENDPOINTS.shops.toggleActive(id));
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.shops.detail(id));
  },
};
