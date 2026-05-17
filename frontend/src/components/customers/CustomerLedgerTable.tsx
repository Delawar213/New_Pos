"use client";

import React from "react";
import type { CustomerLedgerEntry } from "@/types/customer";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  balanceTone,
  customerLedgerTypeBadgeClass,
  ledgerAmountCell,
  summarizeCustomerLedger,
} from "@/lib/customerLedgerUtils";

interface CustomerLedgerTableProps {
  entries: CustomerLedgerEntry[];
  customerName?: string;
}

export function CustomerLedgerTable({ entries, customerName }: CustomerLedgerTableProps) {
  const { totalDebit, totalCredit, closingBalance } = summarizeCustomerLedger(entries);

  if (!entries.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
        No ledger entries for this period{customerName ? ` — ${customerName}` : ""}.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((row, idx) => {
              const dr = ledgerAmountCell(row.debit, "debit");
              const cr = ledgerAmountCell(row.credit, "credit");
              return (
                <tr
                  key={`${row.referenceNo}-${row.transactionDate}-${idx}`}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDate(row.transactionDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        customerLedgerTypeBadgeClass(row.transactionType)
                      )}
                    >
                      {row.transactionType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-medium text-slate-800">
                      {row.referenceNo || "—"}
                    </p>
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs text-slate-600">
                    {row.description || "—"}
                  </td>
                  <td className={cn("px-4 py-3 text-right", dr.className)}>
                    {dr.display === "—" ? dr.display : formatCurrency(row.debit)}
                  </td>
                  <td className={cn("px-4 py-3 text-right", cr.className)}>
                    {cr.display === "—" ? cr.display : formatCurrency(row.credit)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tabular-nums",
                      balanceTone(row.balance)
                    )}
                  >
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50/80 text-sm font-semibold text-slate-800">
              <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wide text-slate-500">
                Period totals
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-violet-800">
                {formatCurrency(totalDebit)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-emerald-800">
                {formatCurrency(totalCredit)}
              </td>
              <td className={cn("px-4 py-3 text-right tabular-nums", balanceTone(closingBalance))}>
                {formatCurrency(closingBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
