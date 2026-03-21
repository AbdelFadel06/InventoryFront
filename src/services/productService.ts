// src/services/productService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type {
  Product, ProductCreate, ProductUpdate,
  ProductStockByShop, BulkUpdatePrices, ProductStatistics
} from "../types/product";
import type { PaginatedResponse } from "../types/common";

export const productService = {
  getAll: async (): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get(ENDPOINTS.products.list);
    return data;
  },

  getById: async (id: number): Promise<Product> => {
    const { data } = await api.get(ENDPOINTS.products.detail(id));
    return data;
  },

  getStatistics: async (): Promise<ProductStatistics> => {
    const { data } = await api.get(ENDPOINTS.products.statistics);
    return data;
  },

  getLowStock: async (): Promise<{ total: number; products: Product[] }> => {
    const { data } = await api.get(ENDPOINTS.products.lowStock);
    return data;
  },

  getOutOfStock: async (): Promise<{ total: number; products: Product[] }> => {
    const { data } = await api.get(ENDPOINTS.products.outOfStock);
    return data;
  },

  getNeedsReorder: async (): Promise<{ total: number; products: Product[] }> => {
    const { data } = await api.get(ENDPOINTS.products.needsReorder);
    return data;
  },

  getStockByShop: async (id: number): Promise<ProductStockByShop> => {
    const { data } = await api.get(ENDPOINTS.products.stockByShop(id));
    return data;
  },

  create: async (payload: ProductCreate): Promise<Product> => {
    const { data } = await api.post(ENDPOINTS.products.create, payload);
    return data;
  },

  update: async (id: number, payload: Partial<ProductUpdate>): Promise<Product> => {
    const { data } = await api.patch(ENDPOINTS.products.detail(id), payload);
    return data;
  },

  bulkUpdatePrices: async (payload: BulkUpdatePrices): Promise<{ message: string }> => {
    const { data } = await api.post(ENDPOINTS.products.bulkUpdatePrices, payload);
    return data;
  },

  toggleActive: async (id: number): Promise<{ is_active: boolean }> => {
    const { data } = await api.post(ENDPOINTS.products.toggleActive(id));
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(ENDPOINTS.products.detail(id));
  },
};
