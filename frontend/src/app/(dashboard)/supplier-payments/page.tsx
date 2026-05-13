"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { SearchableSelect, StatusBadge } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import type { Purchase } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { clearUnpaidPurchases, fetchUnpaidPurchasesBySupplier } from "@/store/slices/purchases/purchases.slice";
import {
  fetchSuppliers,
  fetchSuppliersDropdown,
  supplierBulkPayment,
} from "@/store/slices/supplier/supplier.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";

const CREATED_BY = 1;

function remainingBalance(p: Purchase): number {
  const n = Number(p.remainingAmount);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local date (YYYY-MM-DD) → ISO string for API */
function dateInputToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const lbl = "mb-1 block text-sm font-medium text-slate-700";
const hint = "mt-1 text-xs text-slate-500";
const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function buildDescription(
  voucher: string,
  reference: string,
  notes: string,
  discountAmount: number
): string {
  const parts = [
    voucher.trim() && `Voucher: ${voucher.trim()}`,
    reference.trim() && `Ref: ${reference.trim()}`,
    discountAmount > 0 && `Discount: ${formatCurrency(discountAmount)}`,
    notes.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Supplier payment";
}

export default function SupplierPaymentsPage() {
  const dispatch = useAppDispatch();
  const { unpaidPurchases, unpaidLoading, unpaidError } = useAppSelector((s) => s.purchases);
  const { dropdownSuppliers, suppliers: suppliersFromList, dropdownFetchFailed, actionLoading } =
    useAppSelector((s) => s.supplier);
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);

  const [voucherNo, setVoucherNo] = useState("");
  const [supplierId, setSupplierId] = useState(0);
  const [bankAccountId, setBankAccountId] = useState(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInputDate);
  /** Gross / paid total before discount — user editable */
  const [grossAmount, setGrossAmount] = useState("");
  /** Settlement discount subtracted from gross; net is sent to the API */
  const [discountAmount, setDiscountAmount] = useState("");
  const [descriptionNotes, setDescriptionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchSuppliersDropdown());
    void dispatch(fetchSuppliers({ pageNumber: 1, pageSize: 200 }));
    void dispatch(fetchBankAccountsDropdown());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearUnpaidPurchases());
    };
  }, [dispatch]);

  useEffect(() => {
    if (supplierId <= 0) {
      dispatch(clearUnpaidPurchases());
      return;
    }
    void dispatch(fetchUnpaidPurchasesBySupplier(supplierId));
  }, [dispatch, supplierId]);

  const suppliers = useMemo(
    () =>
      dropdownSuppliers.length > 0
        ? dropdownSuppliers
        : suppliersFromList.map((s) => ({
            supplierId: s.supplierId,
            supplierCode: s.supplierCode,
            supplierName: s.supplierName,
            currentBalance: s.currentBalance ?? 0,
          })),
    [dropdownSuppliers, suppliersFromList]
  );

  const supplierOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.supplierId,
        label: `${s.supplierCode} — ${s.supplierName}`,
        search: `${s.supplierCode} ${s.supplierName}`.toLowerCase(),
      })),
    [suppliers]
  );

  const totalOutstanding = useMemo(
    () => unpaidPurchases.reduce((sum, p) => sum + remainingBalance(p), 0),
    [unpaidPurchases]
  );

  const grossNum = Number(grossAmount) || 0;
  const discountNum = Math.max(0, Number(discountAmount) || 0);
  const netPaymentNum = Math.max(0, grossNum - discountNum);
  const discountExceedsGross = grossNum > 0 && discountNum > grossNum;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmPayment = async () => {
    if (supplierId <= 0) {
      dispatch(addToast({ type: "warning", title: "Supplier required", message: "Select a supplier." }));
      return;
    }
    if (bankAccountId <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Bank account required",
          message: "Select the bank account to pay from.",
        })
      );
      return;
    }
    if (!paymentDate) {
      dispatch(addToast({ type: "warning", title: "Date required", message: "Enter payment date." }));
      return;
    }
    if (!Number.isFinite(grossNum) || grossNum <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Invalid amount",
          message: "Enter a paid total greater than zero.",
        })
      );
      return;
    }
    if (discountExceedsGross) {
      dispatch(
        addToast({
          type: "warning",
          title: "Invalid discount",
          message: "Discount cannot be greater than the paid total.",
        })
      );
      return;
    }
    if (!Number.isFinite(netPaymentNum) || netPaymentNum <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Invalid net amount",
          message: "After discount, the net payment must be greater than zero.",
        })
      );
      return;
    }

    const payload = {
      supplierId,
      paymentAmount: netPaymentNum,
      paymentDate: dateInputToIso(paymentDate),
      bankAccountId,
      description: buildDescription(voucherNo, referenceNo, descriptionNotes, discountNum),
      createdBy: CREATED_BY,
    };

    setSubmitting(true);
    try {
      const result = await dispatch(supplierBulkPayment(payload));
      if (supplierBulkPayment.rejected.match(result)) {
        dispatch(
          addToast({
            type: "error",
            title: "Payment failed",
            message: result.payload || "Could not process bulk payment.",
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
          : "Payment processed successfully.";

      dispatch(
        addToast({
          type: "success",
          title: "Payment recorded",
          message: msg,
          duration: 5000,
        })
      );
      setGrossAmount("");
      setDiscountAmount("");
      setReferenceNo("");
      setDescriptionNotes("");
      void dispatch(fetchUnpaidPurchasesBySupplier(supplierId));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || actionLoading;

  return (
    <div className="relative mx-auto max-w-6xl pb-24">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/suppliers" className="hover:text-blue-600">
          Suppliers
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-800">Supplier payment</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Supplier payment</h1>
          <p className="mt-1 text-sm text-slate-500">Pay supplier from a bank account (bulk allocation on server)</p>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="voucher-no" className={lbl}>
                Voucher no.
              </label>
              <input
                id="voucher-no"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="e.g. SP-0001/26"
                className={cn(inputBase)}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="ref-no" className={lbl}>
                Reference no.
              </label>
              <input
                id="ref-no"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Cheque / transfer ref"
                className={cn(inputBase)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>
                Supplier <span className="text-red-500">*</span>
              </label>
              {dropdownFetchFailed && suppliers.length > 0 && (
                <p className={cn(hint, "-mt-0.5 mb-1 text-amber-600")}>Using full supplier list.</p>
              )}
              <SearchableSelect
                options={supplierOptions}
                value={supplierId}
                onChange={(id) => setSupplierId(id)}
                placeholder="Search supplier…"
                disabled={supplierOptions.length === 0}
                emptyHint="No suppliers"
                triggerClassName="border-slate-200 py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bank-acct" className={lbl}>
                Bank account <span className="text-red-500">*</span>
              </label>
              <select
                id="bank-acct"
                value={bankAccountId || ""}
                onChange={(e) => setBankAccountId(Number(e.target.value) || 0)}
                className={cn(inputBase, "cursor-pointer")}
              >
                <option value="">Select bank account</option>
                {dropdownAccounts.map((a) => (
                  <option key={a.bankAccountId} value={a.bankAccountId}>
                    {a.accountName} ({a.accountType}) · {formatCurrency(a.currentBalance ?? 0)}
                  </option>
                ))}
              </select>
              {dropdownAccounts.length === 0 && (
                <p className={cn(hint, "text-amber-600")}>No accounts loaded.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pay-date" className={lbl}>
                Payment date <span className="text-red-500">*</span>
              </label>
              <input
                id="pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={cn(inputBase, "cursor-pointer")}
              />
            </div>
            <div>
              <label htmlFor="paid-total" className={lbl}>
                Paid total <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                <input
                  id="paid-total"
                  type="number"
                  step="0.01"
                  min={0}
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  placeholder="0.00"
                  className={cn(inputBase, "pl-8 tabular-nums")}
                />
              </div>
              {supplierId > 0 && totalOutstanding > 0 && (
                <p className={hint}>Outstanding on bills: {formatCurrency(totalOutstanding)}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="discount-amt" className={lbl}>
                Discount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                <input
                  id="discount-amt"
                  type="number"
                  step="0.01"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    inputBase,
                    "pl-8 tabular-nums",
                    discountExceedsGross && "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                  )}
                />
              </div>
              {discountExceedsGross ? (
                <p className={cn(hint, "font-medium text-rose-600")}>Cannot exceed paid total.</p>
              ) : (
                <p className={hint}>Subtracted from paid total; net is sent to the API.</p>
              )}
            </div>
            <div>
              <span className={lbl}>Net payment</span>
              <div
                className={cn(
                  "flex min-h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900",
                  netPaymentNum > 0 && "border-emerald-200 bg-emerald-50/90 text-emerald-950"
                )}
                aria-live="polite"
              >
                {formatCurrency(netPaymentNum)}
              </div>
              <p className={hint}>Amount posted as payment.</p>
            </div>
          </div>

          <div>
            <label htmlFor="desc-notes" className={lbl}>
              Notes <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              id="desc-notes"
              value={descriptionNotes}
              onChange={(e) => setDescriptionNotes(e.target.value)}
              placeholder="Extra text for description"
              rows={3}
              className={cn(inputBase, "resize-y")}
            />
            <p className={hint}>Merged with voucher, reference, and discount in description.</p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Outstanding purchase bills</h2>

          {supplierId <= 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Select a supplier to load pending bills.</p>
          ) : unpaidError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{unpaidError}</div>
          ) : unpaidLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : unpaidPurchases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-600">
              No unpaid purchases for this supplier.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[880px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="whitespace-nowrap px-3 py-3">Bill code</th>
                    <th className="whitespace-nowrap px-3 py-3">Ref #</th>
                    <th className="whitespace-nowrap px-3 py-3">Bill date</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Original</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Debit notes</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Net amount</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Already paid</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right">Due amount</th>
                    <th className="whitespace-nowrap px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidPurchases.map((row) => {
                    const due = remainingBalance(row);
                    const ret = Number(row.returnAmount) || 0;
                    return (
                      <tr key={row.purchaseId} className="bg-white hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">{row.purchaseCode}</td>
                        <td
                          className="max-w-[120px] truncate px-3 py-2.5 text-slate-600"
                          title={row.invoiceNumber ?? ""}
                        >
                          {row.invoiceNumber || row.description || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {row.totalAmountIncVat != null ? formatCurrency(Number(row.totalAmountIncVat)) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {ret > 0 ? formatCurrency(ret) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {row.netAmountExVat != null ? formatCurrency(Number(row.netAmountExVat)) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {row.paidAmount != null ? formatCurrency(Number(row.paidAmount)) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-slate-900">
                          {formatCurrency(due)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {row.paymentStatus ? <StatusBadge status={row.paymentStatus} /> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-6">
          <div className="flex justify-center">
            <button
              type="button"
              disabled={
                busy ||
                supplierId <= 0 ||
                bankAccountId <= 0 ||
                discountExceedsGross ||
                !Number.isFinite(netPaymentNum) ||
                netPaymentNum <= 0 ||
                !Number.isFinite(grossNum) ||
                grossNum <= 0
              }
              onClick={() => void handleConfirmPayment()}
              className="min-w-[220px] rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Processing…" : "Confirm payment"}
            </button>
          </div>
        </footer>
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
        title="Top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
