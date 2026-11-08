// src/services/accessService.ts
// Écran des permissions (Super Admin) : grille par rôle, exceptions par personne, interrupteurs, journal.
import api from "../api/axiosInstance";
import type { UserRole } from "../types/user";

export type PermissionKind = "view" | "create" | "update" | "delete" | "special";

export interface CatalogPermission {
  code: string;
  module: string;
  label: string;
  kind: PermissionKind;
  locked_for: UserRole[];
}

export interface Catalog { roles: UserRole[]; permissions: CatalogPermission[] }
export type RoleGrid = Record<UserRole, Record<string, boolean>>;

export interface UserAccess {
  user: number;
  name: string;
  role: UserRole;
  effective: Record<string, boolean>;
  overrides: Record<string, boolean>;
}

export interface ModuleSwitchState { module: string; label: string; enabled: boolean; effective: boolean }
export interface Switches { emergency_stop: boolean; modules: ModuleSwitchState[] }

export interface HistoryRow {
  id: number;
  at: string;
  by: string | null;
  role: UserRole | null;
  user: string | null;
  code: string;
  label: string;
  before: boolean | null;
  after: boolean | null;
}

export const accessService = {
  catalog: async (): Promise<Catalog> => (await api.get("/access/catalog/")).data,
  roles: async (): Promise<RoleGrid> => (await api.get("/access/roles/")).data,
  setRole: async (role: UserRole, code: string, allowed: boolean) =>
    (await api.put("/access/roles/", { role, code, allowed })).data,
  user: async (id: number): Promise<UserAccess> => (await api.get(`/access/users/${id}/`)).data,
  setUser: async (id: number, code: string, allowed: boolean | null): Promise<UserAccess> =>
    (await api.put(`/access/users/${id}/`, { code, allowed })).data,
  switches: async (): Promise<Switches> => (await api.get("/access/switches/")).data,
  setSwitch: async (module: string, enabled: boolean): Promise<Switches> =>
    (await api.put("/access/switches/", { module, enabled })).data,
  history: async (): Promise<HistoryRow[]> => (await api.get("/access/history/")).data,
};
