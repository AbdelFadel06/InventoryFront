// src/hooks/useClientPage.ts
// Pagination d'une liste déjà complète (et déjà filtrée) : des pages pleines de 10 lignes.
// À utiliser avec <PaginationBar currentPage={page} totalCount={total} onPage={setPage} />.
import { useEffect, useState } from "react";

export function useClientPage<T>(rows: T[], resetKey?: unknown, pageSize = 10) {
  const [page, setPage] = useState(1);
  // Nouveau filtre ou nouvelle recherche : retour à la première page.
  useEffect(() => { setPage(1); }, [resetKey]);

  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, lastPage);
  return {
    page: current,
    setPage,
    total: rows.length,
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
  };
}
