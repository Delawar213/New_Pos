import type { MutableRefObject } from "react";
import type { PaginationParams } from "@/types/common";

/**
 * When the debounced search string changes, request page 1; otherwise keep `currentPage`.
 * Uses a ref so the first load does not force-reset the page.
 */
export function buildPagedFetchArgs(
  currentPage: number,
  pageSize: number,
  debouncedSearch: string,
  prevSearchRef: MutableRefObject<string | null>,
  options?: { sortBy?: string; sortDirection?: "asc" | "desc" }
): PaginationParams {
  const q = debouncedSearch.trim() || undefined;
  const first = prevSearchRef.current === null;
  const searchChanged = !first && prevSearchRef.current !== debouncedSearch;
  prevSearchRef.current = debouncedSearch;
  return {
    pageNumber: searchChanged ? 1 : currentPage,
    pageSize,
    searchTerm: q,
    sortDirection: options?.sortDirection ?? "desc",
    ...(options?.sortBy?.trim() ? { sortBy: options.sortBy.trim() } : {}),
  };
}
