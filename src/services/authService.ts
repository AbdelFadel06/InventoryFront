// src/services/authService.ts
import api from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import type { TokenObtainPair, TokenResponse } from "../types/auth";

export const authService = {
  login: async (credentials: TokenObtainPair): Promise<TokenResponse> => {
    const { data } = await api.post(ENDPOINTS.auth.login, credentials);
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    return data;
  },

  logout: () => {
    localStorage.clear();
    window.location.href = "/login";
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("access_token");
  },
};
