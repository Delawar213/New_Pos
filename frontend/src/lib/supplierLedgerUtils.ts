import type { SupplierLedgerEntry } from "@/types/supplier";
import { cn } from "@/lib/utils";

export function supplierLedgerTypeBadgeClass(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("payment")) return "bg-emerald-100 text-emerald-800";
  if (t.includes("return")) return "bg-amber-100 text-amber-800";
  if (t.includes("purchase")) return "bg-violet-100 text-violet-800";
  if (t.includes("opening")) return "bg-slate-100 text-slate-700";
  return "bg-blue-100 text-blue-800";
}

export function summarizeSupplierLedger(entries: SupplierLedgerEntry[]) {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const row of entries) {
    totalDebit += row.debit;
    totalCredit += row.credit;
  }
  const closingBalance =
    entries.length > 0 ? entries[entries.length - 1].balance : 0;
  return { totalDebit, totalCredit, closingBalance, count: entries.length };
}

export function balanceTone(balance: number): string {
  if (balance > 0) return "text-emerald-700";
  if (balance < 0) return "text-rose-700";
  return "text-slate-700";
}

export function balanceLabel(balance: number): string {
  if (balance > 0) return "Credit balance (supplier owes you less / advance)";
  if (balance < 0) return "Debit balance (amount owed to supplier)";
  return "Settled";
}

export function ledgerAmountCell(
  amount: number,
  tone: "debit" | "credit"
): { display: string; className: string } {
  if (amount <= 0) {
    return { display: "—", className: "text-slate-300" };
  }
  return {
    display: amount.toFixed(2),
    className: cn(
      "font-medium tabular-nums",
      tone === "debit" ? "text-violet-800" : "text-emerald-800"
    ),
  };
}
