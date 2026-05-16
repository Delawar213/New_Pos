import type { Transaction, TransactionDetail } from "@/types/transaction";

export type TransactionKind = "purchase" | "sale" | "return" | "payment" | "other";

const KIND_STYLES: Record<
  TransactionKind,
  { label: string; bg: string; text: string; border: string }
> = {
  purchase: { label: "Purchase", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  sale: { label: "POS Sale", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  return: { label: "Sale Return", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  payment: { label: "Payment", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  other: { label: "Journal", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

export function getTransactionKind(tx: Transaction): TransactionKind {
  const t = `${tx.title ?? ""} ${tx.description ?? ""}`.toLowerCase();
  if (t.includes("sale return") || t.includes("return -")) return "return";
  if (t.includes("pos sale") || (t.includes("sale") && !t.includes("return"))) return "sale";
  if (t.includes("purchase")) return "purchase";
  if (t.includes("payment") || t.includes("refund")) return "payment";
  return "other";
}

export function getTransactionKindStyle(kind: TransactionKind) {
  return KIND_STYLES[kind];
}

export function sumDebits(details: TransactionDetail[]): number {
  return details.reduce((s, d) => s + Number(d.debit || 0), 0);
}

export function sumCredits(details: TransactionDetail[]): number {
  return details.reduce((s, d) => s + Number(d.credit || 0), 0);
}

export function isJournalBalanced(details: TransactionDetail[]): boolean {
  const dr = sumDebits(details);
  const cr = sumCredits(details);
  return Math.abs(dr - cr) < 0.01;
}

/** Primary monetary amount for list display (max of debit/credit totals). */
export function transactionDisplayAmount(tx: Transaction): number {
  const details = tx.transactionDetails ?? [];
  return Math.max(sumDebits(details), sumCredits(details));
}

export function formatTransactionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTransactionDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Asset: "bg-blue-100 text-blue-800",
  Liability: "bg-slate-100 text-slate-800",
  Revenue: "bg-emerald-100 text-emerald-800",
  Expense: "bg-rose-100 text-rose-800",
  Cash: "bg-cyan-100 text-cyan-800",
  Customer: "bg-indigo-100 text-indigo-800",
  Supplier: "bg-violet-100 text-violet-800",
};

export function accountTypeBadgeClass(accountType: string): string {
  return ACCOUNT_TYPE_COLORS[accountType] ?? "bg-slate-100 text-slate-700";
}
