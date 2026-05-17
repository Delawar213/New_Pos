"use client";

import React, { useEffect, useState } from "react";
import { DecimalInput, Modal, ModalConfirmButton, StatusBadge } from "@/components/ui";
import type { Sale } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { customerSalePayment } from "@/store/slices/customer/customer.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { fetchSaleById } from "@/store/slices/sale/sale.slice";

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateInputToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function saleDueAmount(sale: Sale): number {
  const due = Number(sale.dueAmount);
  return Number.isFinite(due) ? Math.max(0, due) : 0;
}

function buildDescription(reference: string, notes: string, prefix: string): string {
  const parts = [reference.trim() && `Ref: ${reference.trim()}`, notes.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : prefix;
}

const lbl = "mb-1 block text-sm font-medium text-slate-700";
const hint = "mt-1 text-xs text-slate-500";
const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export interface SalePaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Sale from list or detail — refreshed on open for latest due/paid. */
  sale: Sale | null;
  onSuccess?: () => void;
}

export function SalePaymentModal({ open, onClose, sale, onSuccess }: SalePaymentModalProps) {
  const dispatch = useAppDispatch();
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);
  const { actionLoading: customerLoading } = useAppSelector((s) => s.customer);

  const [loadedSale, setLoadedSale] = useState<Sale | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);
  const [bankAccountId, setBankAccountId] = useState(0);
  const [paymentDate, setPaymentDate] = useState(todayInputDate);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [descriptionNotes, setDescriptionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) void dispatch(fetchBankAccountsDropdown());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || !sale) {
      setLoadedSale(null);
      return;
    }
    setSaleLoading(true);
    setReferenceNo("");
    setDescriptionNotes("");
    setPaymentDate(todayInputDate());
    void dispatch(fetchSaleById({ id: sale.id, updateSelection: false }))
      .unwrap()
      .then((fresh) => {
        setLoadedSale(fresh);
        const due = saleDueAmount(fresh);
        setPaymentAmount(due > 0 ? due : 0);
      })
      .catch(() => {
        setLoadedSale(sale);
        const due = saleDueAmount(sale);
        setPaymentAmount(due > 0 ? due : 0);
      })
      .finally(() => setSaleLoading(false));
  }, [open, sale, dispatch]);

  const activeSale = loadedSale ?? sale;
  const due = activeSale ? saleDueAmount(activeSale) : 0;
  const busy = submitting || customerLoading || saleLoading;

  const handleSubmit = async () => {
    if (!activeSale) return;
    if (bankAccountId <= 0) {
      dispatch(addToast({ type: "warning", title: "Bank required", message: "Select a bank account." }));
      return;
    }
    if (!paymentDate) {
      dispatch(addToast({ type: "warning", title: "Date required", message: "Enter payment date." }));
      return;
    }
    if (paymentAmount <= 0) {
      dispatch(addToast({ type: "warning", title: "Amount required", message: "Enter an amount greater than zero." }));
      return;
    }
    if (due > 0 && paymentAmount > due) {
      dispatch(
        addToast({
          type: "warning",
          title: "Amount too high",
          message: `Payment cannot exceed due amount ${formatCurrency(due)}.`,
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(
        customerSalePayment({
          saleId: activeSale.id,
          paymentAmount,
          bankAccountId,
          paymentDate: dateInputToIso(paymentDate),
          description: buildDescription(
            referenceNo || activeSale.invoiceNo,
            descriptionNotes,
            `Payment for ${activeSale.invoiceNo}`
          ),
        })
      );
      if (customerSalePayment.rejected.match(result)) {
        dispatch(
          addToast({
            type: "error",
            title: "Payment failed",
            message: result.payload || "Could not record payment.",
            duration: 6000,
          })
        );
        return;
      }
      const msg =
        typeof result.payload === "object" &&
        result.payload &&
        "message" in result.payload &&
        typeof (result.payload as { message?: string }).message === "string"
          ? (result.payload as { message: string }).message
          : "Sale payment recorded.";
      dispatch(addToast({ type: "success", title: "Payment recorded", message: msg, duration: 5000 }));
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={
        activeSale
          ? `Receive payment for ${activeSale.invoiceNo}`
          : "Loading sale…"
      }
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <ModalConfirmButton
            onClick={() => void handleSubmit()}
            disabled={busy || !activeSale || due <= 0 || bankAccountId <= 0 || paymentAmount <= 0}
          >
            {busy ? "Processing…" : "Record payment"}
          </ModalConfirmButton>
        </div>
      }
    >
      {saleLoading && !activeSale ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading sale…</p>
      ) : activeSale ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-slate-900">{activeSale.invoiceNo}</p>
                <p className="text-sm text-slate-600">{activeSale.customerName ?? "—"}</p>
              </div>
              {activeSale.paymentMethod ? (
                <StatusBadge status={activeSale.paymentMethod} variant="soft" size="sm" />
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-semibold tabular-nums">{formatCurrency(activeSale.grandTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <p className="font-semibold tabular-nums text-emerald-700">
                  {formatCurrency(activeSale.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Due</p>
                <p className="font-semibold tabular-nums text-rose-700">{formatCurrency(due)}</p>
              </div>
            </div>
            {due <= 0 ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">This sale is fully paid.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="sale-pay-bank" className={lbl}>
              Bank account <span className="text-red-500">*</span>
            </label>
            <select
              id="sale-pay-bank"
              value={bankAccountId || ""}
              onChange={(e) => setBankAccountId(Number(e.target.value) || 0)}
              className={cn(inputBase, "cursor-pointer")}
              disabled={busy}
            >
              <option value="">Select bank account</option>
              {dropdownAccounts.map((a) => (
                <option key={a.bankAccountId} value={a.bankAccountId}>
                  {a.accountName} ({a.accountType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sale-pay-date" className={lbl}>
                Payment date <span className="text-red-500">*</span>
              </label>
              <input
                id="sale-pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={cn(inputBase, "cursor-pointer")}
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="sale-pay-amount" className={lbl}>
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400">
                  £
                </span>
                <DecimalInput
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                  className="pl-8"
                  placeholder="0.00"
                  disabled={busy}
                />
              </div>
              {due > 0 ? (
                <button
                  type="button"
                  className={cn(hint, "text-left font-medium text-blue-600 hover:underline")}
                  onClick={() => setPaymentAmount(due)}
                  disabled={busy}
                >
                  Use full due: {formatCurrency(due)}
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="sale-pay-ref" className={lbl}>
              Reference
            </label>
            <input
              id="sale-pay-ref"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Receipt / transfer ref"
              className={inputBase}
              disabled={busy}
            />
          </div>

          <div>
            <label htmlFor="sale-pay-notes" className={lbl}>
              Notes <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="sale-pay-notes"
              value={descriptionNotes}
              onChange={(e) => setDescriptionNotes(e.target.value)}
              rows={2}
              className={cn(inputBase, "resize-y")}
              disabled={busy}
            />
          </div>
        </div>
      ) : (
        <p className="py-4 text-sm text-slate-500">No sale selected.</p>
      )}
    </Modal>
  );
}
