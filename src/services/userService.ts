// src/services/userService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type { User, UserCreate, UserUpdate, ChangePassword } from "../types/user";
import type { PaginatedResponse } from "../types/common";

export const userService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get(ENDPOINTS.users.list, { params });
    return data;
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await api.get(ENDPOINTS.users.detail(id));
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get(ENDPOINTS.users.me);
    return data;
  },

  getManagers: async (): Promise<User[]> => {
    const { data } = await api.get(ENDPOINTS.users.managers);
    return data;
  },

  /**
   * Retourne les employés.
   * - shopId      : filtre par boutique courante (affectation active) — pour la page Équipe
   * - homeShopId  : filtre par boutique d'appartenance permanente
   * - Sans param  : tout le pool (toutes boutiques gérées) — pour la page Affectation
   */
  getEmployees: async (options?: { shopId?: number; homeShopId?: number }): Promise<User[]> => {
    const params: Record<string, number> = {};
    if (options?.shopId)     params.shop      = options.shopId;
    if (options?.homeShopId) params.home_shop = options.homeShopId;
    const { data } = await api.get(ENDPOINTS.users.employees, { params });
    return data;
  },

  getLivreurs: async (): Promise<User[]> => {
    const { data } = await api.get(ENDPOINTS.users.livreurs);
    return data;
  },

  create: async (payload: UserCreate & { password_confirm?: string }): Promise<User> => {
    const { data } = await api.post(ENDPOINTS.users.create, payload);
    return data;
  },

  update: async (id: number, payload: Partial<UserUpdate>): Promise<User> => {
    const { data } = await api.patch(ENDPOINTS.users.detail(id), payload);
    return data;
  },

  updateProfile: async (payload: Partial<UserUpdate>): Promise<User> => {
    const { data } = await api.patch(ENDPOINTS.users.updateProfile, payload);
    return data;
  },

  changePassword: async (payload: ChangePassword): Promise<void> => {
    await api.post(ENDPOINTS.users.changePassword, payload);
  },

  toggleActive: async (id: number): Promise<{ is_active: boolean }> => {
    const { data } = await api.post(ENDPOINTS.users.toggleActive(id));
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.users.detail(id));
  },
};
