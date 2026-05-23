import type { PaginationParams } from "@/types/common";
import type { Sale } from "@/types/sale";
import type { Purchase } from "@/types/purchase";
import { dateInputToIso, startOfMonthInputDate, todayInputDate } from "@/lib/transactionDate";

export interface ListFiltersState {
  useDateRange: boolean;
  fromDate: string;
  toDate: string;
  /** Sale/purchase status (empty = all). */
  status: string;
  /** Purchase payment status from API (empty = all). */
  paymentStatus: string;
  /** Sales-only: balance due filter (client-side). */
  dueFilter: "all" | "with_due" | "fully_paid";
}

export function emptyListFilters(): ListFiltersState {
  return {
    useDateRange: false,
    fromDate: startOfMonthInputDate(),
    toDate: todayInputDate(),
    status: "",
    paymentStatus: "",
    dueFilter: "all",
  };
}

export function countActiveListFilters(
  filters: ListFiltersState,
  opts?: { includeDue?: boolean; includePaymentStatus?: boolean }
): number {
  let n = 0;
  if (filters.useDateRange) n += 1;
  if (filters.status) n += 1;
  if (opts?.includePaymentStatus && filters.paymentStatus) n += 1;
  if (opts?.includeDue && filters.dueFilter !== "all") n += 1;
  return n;
}

export function applySaleClientFilters(sales: Sale[], filters: ListFiltersState): Sale[] {
  if (filters.dueFilter === "all") return sales;
  if (filters.dueFilter === "with_due") {
    return sales.filter((s) => s.dueAmount > 0.009);
  }
  return sales.filter((s) => s.dueAmount <= 0.009);
}

export function applyPurchaseClientFilters(
  purchases: Purchase[],
  filters: ListFiltersState
): Purchase[] {
  void filters;
  return purchases;
}

/** Map UI filter state to API query fields. */
export function listFiltersToApiParams(
  filters: ListFiltersState
): Pick<PaginationParams, "fromDate" | "toDate" | "status" | "paymentStatus"> {
  const out: Pick<PaginationParams, "fromDate" | "toDate" | "status" | "paymentStatus"> = {};
  if (filters.useDateRange && filters.fromDate) {
    out.fromDate = dateInputToIso(filters.fromDate, false);
  }
  if (filters.useDateRange && filters.toDate) {
    out.toDate = dateInputToIso(filters.toDate, true);
  }
  if (filters.status.trim()) out.status = filters.status.trim();
  if (filters.paymentStatus.trim()) out.paymentStatus = filters.paymentStatus.trim();
  return out;
}
