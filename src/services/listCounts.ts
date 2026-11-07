// src/services/listCounts.ts
// Totaux d'une liste paginée, calculés par le serveur sur toute la liste filtrée
// (et non sur la seule page affichée). Ne pas envoyer le filtre de statut :
// les compteurs couvrent alors tous les statuts.
import axiosInstance from "../api/axiosInstance";

export interface ListCounts {
  total: number;
  by: Record<string, number>;
}

export async function getListCounts<T = ListCounts>(resource: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await axiosInstance.get(`/${resource}/counts/`, { params });
  return data;
}

/** Lecture d'un compteur, 0 s'il est absent. */
export const countOf = (counts: ListCounts | null, key: string) => counts?.by?.[key] ?? 0;
