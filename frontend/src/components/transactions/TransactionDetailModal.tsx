"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui";
import type { Transaction } from "@/types/transaction";
import { formatCurrency, cn } from "@/lib/utils";
import {
  formatTransactionDate,
  formatTransactionDateTime,
  getTransactionKind,
  getTransactionKindStyle,
  isJournalBalanced,
  sumDebits,
  sumCredits,
} from "@/lib/transactionUtils";
import { TransactionJournalTable } from "./TransactionJournalTable";
import { CheckCircle2, Scale } from "lucide-react";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, open, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const details = transaction.transactionDetails ?? [];
  const kind = getTransactionKind(transaction);
  const kindStyle = getTransactionKindStyle(kind);
  const balanced = isJournalBalanced(details);
  const totalDr = sumDebits(details);
  const totalCr = sumCredits(details);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction.title}
      description={transaction.transactionCode}
      size="xl"
      scrollableContent
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                  kindStyle.bg,
                  kindStyle.text,
                  kindStyle.border
                )}
              >
                {kindStyle.label}
              </span>
              <StatusBadge status={transaction.status} variant="soft" />
              {balanced ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Balanced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  <Scale className="h-3.5 w-3.5" />
                  Out of balance
                </span>
              )}
            </div>
            <p className="font-mono text-sm text-slate-600">{transaction.transactionCode}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {formatCurrency(Math.max(totalDr, totalCr))}
            </p>
            <p className="text-xs text-slate-500">Journal total</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Transaction date", value: formatTransactionDate(transaction.transactionDate) },
            { label: "Posted", value: formatTransactionDateTime(transaction.createdDatetime) },
            { label: "Reference", value: transaction.referenceNo || "—" },
            { label: "Lines", value: String(details.length) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        {transaction.description ? (
          <div className="rounded-lg border border-slate-100 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-1 text-sm text-slate-700">{transaction.description}</p>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">General ledger entries</h3>
          <TransactionJournalTable details={details} />
        </div>
      </div>
    </Modal>
  );
}
