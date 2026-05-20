import { formatCurrency } from "@/lib/utils";
import type { SearchableSelectOption } from "@/components/ui";
import type { BankAccountDropdown } from "@/types/bankAccount";
import type { CustomerDropdown } from "@/types/customer";
import type { SupplierDropdown } from "@/types/supplier";

function bal(n: number | null | undefined): string {
  return formatCurrency(Number(n) || 0);
}

/** Label for bank/cash account dropdowns and native option elements. */
export function bankAccountDropdownLabel(a: {
  accountName: string;
  accountType: string;
  currentBalance?: number | null;
}): string {
  return `${a.accountName} (${a.accountType}) — ${bal(a.currentBalance)}`;
}

export function bankAccountSearchText(a: {
  accountName: string;
  accountType: string;
  bankAccountId?: number;
}): string {
  return `${a.accountName} ${a.accountType} ${a.bankAccountId ?? ""}`.toLowerCase();
}

export function customerDropdownLabel(c: {
  customerCode: string;
  customerName: string;
  currentBalance?: number | null;
  creditLimit?: number | null;
}): string {
  const parts = [`${c.customerCode} — ${c.customerName}`, `Bal ${bal(c.currentBalance)}`];
  const limit = Number(c.creditLimit);
  if (limit > 0) parts.push(`Limit ${bal(limit)}`);
  return parts.join(" · ");
}

export function customerSearchText(c: {
  customerCode: string;
  customerName: string;
  customerTypeName?: string;
  customerId?: number;
}): string {
  return `${c.customerCode} ${c.customerName} ${c.customerTypeName ?? ""} ${c.customerId ?? ""}`.toLowerCase();
}

export function supplierDropdownLabel(s: {
  supplierCode: string;
  supplierName: string;
  currentBalance?: number | null;
}): string {
  return `${s.supplierCode} — ${s.supplierName} · Bal ${bal(s.currentBalance)}`;
}

export function supplierSearchText(s: {
  supplierCode: string;
  supplierName: string;
  supplierId?: number;
}): string {
  return `${s.supplierCode} ${s.supplierName} ${s.supplierId ?? ""}`.toLowerCase();
}

export function toBankSelectOptions(
  accounts: BankAccountDropdown[]
): SearchableSelectOption<number>[] {
  return accounts.map((a) => ({
    value: a.bankAccountId,
    label: bankAccountDropdownLabel(a),
    search: bankAccountSearchText(a),
  }));
}

export function toCustomerSelectOptions(
  customers: CustomerDropdown[]
): SearchableSelectOption<number>[] {
  return customers.map((c) => ({
    value: c.customerId,
    label: customerDropdownLabel(c),
    search: customerSearchText(c),
  }));
}

export function toSupplierSelectOptions(
  suppliers: SupplierDropdown[]
): SearchableSelectOption<number>[] {
  return suppliers.map((s) => ({
    value: s.supplierId,
    label: supplierDropdownLabel(s),
    search: supplierSearchText(s),
  }));
}

/** Pending-payments summary row (has extra due fields). */
export function pendingCustomerDropdownLabel(c: {
  customerCode: string;
  customerName: string;
  currentBalance?: number | null;
  totalRemaining?: number | null;
  creditLimit?: number | null;
}): string {
  const due = Number(c.totalRemaining) || 0;
  const base = customerDropdownLabel(c);
  if (due > 0) return `${base} · Due ${bal(due)}`;
  return base;
}
