import type { Sale, SaleStatus } from "@/types/sale";

/** API expects Pascal-ish status strings (e.g. `Completed`). */
export function toApiSaleStatus(status: SaleStatus): string {
  const s = String(status || "completed").toLowerCase();
  if (s === "returned") return "Returned";
  if (s === "cancelled") return "Cancelled";
  if (s === "pending") return "Pending";
  if (s === "completed") return "Completed";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Completed";
}

export function authUserIsAdmin(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  const rid = u.roleId ?? u.role_id;
  if (Number(rid) === 1) return true;
  const role = String(u.role ?? u.userRole ?? "").toLowerCase();
  return role.includes("admin");
}

/** Non-null → whole form should be read-only (except navigation away). */
export function saleUpdateBlockedReason(sale: Sale): string | null {
  if (sale.status === "cancelled") return "Cannot update a cancelled sale.";
  if (sale.status === "returned") return "Cannot update a returned sale.";
  return null;
}

/** Paid sales: backend only allows admin updates. */
export function saleEditRequiresAdmin(sale: Sale): boolean {
  if (sale.paidAmount > 0) return true;
  if (String(sale.paymentMethod ?? "").trim().toLowerCase() === "paid") return true;
  return false;
}
