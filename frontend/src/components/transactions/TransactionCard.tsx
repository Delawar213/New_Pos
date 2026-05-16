"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Hash,
  Calendar,
} from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { formatCurrency, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import {
  formatTransactionDate,
  getTransactionKind,
  getTransactionKindStyle,
  isJournalBalanced,
  transactionDisplayAmount,
} from "@/lib/transactionUtils";
import { TransactionJournalTable } from "./TransactionJournalTable";

interface TransactionCardProps {
  transaction: Transaction;
  defaultExpanded?: boolean;
  onViewDetail: (tx: Transaction) => void;
}

export function TransactionCard({
  transaction,
  defaultExpanded = false,
  onViewDetail,
}: TransactionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const details = transaction.transactionDetails ?? [];
  const kind = getTransactionKind(transaction);
  const kindStyle = getTransactionKindStyle(kind);
  const amount = transactionDisplayAmount(transaction);
  const balanced = isJournalBalanced(details);
  const lineCount = details.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              kindStyle.bg,
              kindStyle.border
            )}
          >
            {expanded ? (
              <ChevronDown className={cn("h-4 w-4", kindStyle.text)} />
            ) : (
              <ChevronRight className={cn("h-4 w-4", kindStyle.text)} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  kindStyle.bg,
                  kindStyle.text,
                  kindStyle.border
                )}
              >
                {kindStyle.label}
              </span>
              <StatusBadge status={transaction.status} variant="soft" size="sm" />
              {!balanced ? (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  Unbalanced
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
              {transaction.title}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{transaction.transactionCode}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatTransactionDate(transaction.transactionDate)}
              </span>
              {transaction.referenceNo ? (
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {transaction.referenceNo}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {lineCount} {lineCount === 1 ? "line" : "lines"}
              </span>
            </div>
            {transaction.description ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-600">{transaction.description}</p>
            ) : null}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
              {formatCurrency(amount)}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Amount</p>
          </div>
          <button
            type="button"
            onClick={() => onViewDetail(transaction)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Full view
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4">
          <TransactionJournalTable details={details} compact />
        </div>
      ) : null}
    </article>
  );
}
