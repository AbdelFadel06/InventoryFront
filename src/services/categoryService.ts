// src/services/categoryService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type { Category, CategoryCreate } from "../types/category";
import type { PaginatedResponse } from "../types/common";

export const categoryService = {
  getAll: async (): Promise<PaginatedResponse<Category>> => {
    const { data } = await api.get(ENDPOINTS.categories.list, {
      params: { page_size: 500 },
    });
    return data;
  },

  getById: async (id: number): Promise<Category> => {
    const { data } = await api.get(ENDPOINTS.categories.detail(id));
    return data;
  },

  create: async (payload: CategoryCreate): Promise<Category> => {
    const { data } = await api.post(ENDPOINTS.categories.create, payload);
    return data;
  },

  update: async (id: number, payload: Partial<CategoryCreate>): Promise<Category> => {
    const { data } = await api.patch(ENDPOINTS.categories.detail(id), payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.categories.detail(id));
  },
};
