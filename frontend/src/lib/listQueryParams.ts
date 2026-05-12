import type { PaginationParams } from "@/types/common";

/** Query object for typical paginated list endpoints (`searchTerm`, `sortBy`, etc.). */
export function listQueryParams(params: PaginationParams | undefined): Record<string, string | number> {
  const p = params ?? {};
  const out: Record<string, string | number> = {
    pageNumber: p.pageNumber ?? 1,
    pageSize: p.pageSize ?? 10,
    sortDirection: p.sortDirection ?? "desc",
  };
  const term = p.searchTerm?.trim();
  if (term) out.searchTerm = term;
  if (p.sortBy?.trim()) out.sortBy = p.sortBy.trim();
  return out;
}
