"use client";

import React, { useEffect } from "react";
import { Check, Printer, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { PosReceiptSnapshot } from "@/lib/posReceipt";
import { printPosReceipt } from "@/lib/posReceipt";

export interface PosSaleReceiptDialogProps {
  open: boolean;
  receipt: PosReceiptSnapshot | null;
  onDismiss: () => void;
}

export function PosSaleReceiptDialog({ open, receipt, onDismiss }: PosSaleReceiptDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open || !receipt) return null;

  const handlePrint = () => {
    printPosReceipt(receipt);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-receipt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onDismiss}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
        )}
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
                <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
              </div>
              <div className="min-w-0">
                <h2
                  id="pos-receipt-title"
                  className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                >
                  Sale completed
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">Your sale was saved successfully.</p>
                <p className="mt-3 font-mono text-base font-bold text-slate-900 sm:text-lg">
                  {receipt.invoiceNo}
                </p>
                {receipt.saleId != null ? (
                  <p className="text-xs tabular-nums text-slate-500">Sale #{receipt.saleId}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 text-xs sm:gap-3 sm:text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="font-semibold text-slate-500">Total</p>
              <p className="mt-0.5 font-bold tabular-nums text-slate-900">
                {formatCurrency(receipt.grandTotal)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="font-semibold text-slate-500">Paid</p>
              <p className="mt-0.5 font-bold tabular-nums text-slate-900">
                {formatCurrency(receipt.paidAmount)}
              </p>
            </div>
            {receipt.changeDue > 0 ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                <p className="font-semibold text-emerald-800">Change</p>
                <p className="mt-0.5 font-bold tabular-nums text-emerald-900">
                  {formatCurrency(receipt.changeDue)}
                </p>
              </div>
            ) : null}
            {receipt.onAccountAmount > 0 ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
                <p className="font-semibold text-amber-900">On account</p>
                <p className="mt-0.5 font-bold tabular-nums text-amber-950">
                  {formatCurrency(receipt.onAccountAmount)}
                </p>
              </div>
            ) : null}
          </div>
          <p className="text-center text-xs text-slate-500">
            {receipt.itemCount} item{receipt.itemCount === 1 ? "" : "s"} · {receipt.customerName}
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print receipt
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
