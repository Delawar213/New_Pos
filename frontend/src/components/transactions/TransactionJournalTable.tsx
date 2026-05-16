"use client";

import React from "react";
import type { TransactionDetail } from "@/types/transaction";
import { formatCurrency, cn } from "@/lib/utils";
import { accountTypeBadgeClass, sumCredits, sumDebits } from "@/lib/transactionUtils";

interface TransactionJournalTableProps {
  details: TransactionDetail[];
  compact?: boolean;
}

export function TransactionJournalTable({ details, compact = false }: TransactionJournalTableProps) {
  const totalDr = sumDebits(details);
  const totalCr = sumCredits(details);

  if (!details.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
        No journal lines for this transaction.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5">Account</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Reference</th>
              <th className="hidden px-4 py-2.5 lg:table-cell">Narration</th>
              <th className="px-4 py-2.5 text-right">Debit</th>
              <th className="px-4 py-2.5 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((line) => (
              <tr key={line.detailId} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{line.accountName}</p>
                  {line.bankAccountName ? (
                    <p className="text-[11px] text-slate-500">{line.bankAccountName}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      accountTypeBadgeClass(line.accountType)
                    )}
                  >
                    {line.accountType}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell">
                  {line.refTable && line.refId != null ? (
                    <span>
                      {line.refTable} #{line.refId}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-slate-600 lg:table-cell">
                  {line.description || "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {Number(line.debit) > 0 ? (
                    <span className="font-medium text-slate-800">{formatCurrency(Number(line.debit))}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {Number(line.credit) > 0 ? (
                    <span className="font-medium text-slate-800">{formatCurrency(Number(line.credit))}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold">
              <td colSpan={compact ? 3 : 4} className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate-600">
                Totals
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                {formatCurrency(totalDr)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                {formatCurrency(totalCr)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
