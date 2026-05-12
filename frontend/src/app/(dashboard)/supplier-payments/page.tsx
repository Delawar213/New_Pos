"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { SearchableSelect, StatusBadge } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import type { Purchase } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import {
  clearUnpaidPurchases,
  fetchUnpaidPurchasesBySupplier,
  paySupplierPurchase,
} from "@/store/slices/purchases/purchases.slice";
import { fetchSuppliers, fetchSuppliersDropdown } from "@/store/slices/supplier/supplier.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";

function remainingBalance(p: Purchase): number {
  const n = Number(p.remainingAmount);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
] as const;

const BANK_SUB_METHOD_OPTIONS = [
  { value: "online_transfer", label: "Online transfer" },
  { value: "credit_card", label: "Credit card" },
] as const;

export default function SupplierPaymentsPage() {
  const dispatch = useAppDispatch();
  const { unpaidPurchases, unpaidLoading, unpaidError, actionLoading } = useAppSelector((s) => s.purchases);
  const { dropdownSuppliers, suppliers: suppliersFromList, dropdownFetchFailed } = useAppSelector(
    (s) => s.supplier
  );
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);

  const [voucherNo, setVoucherNo] = useState("");
  const [supplierId, setSupplierId] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank");
  const [bankSubMethod, setBankSubMethod] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInputDate);
  const [discountAmount, setDiscountAmount] = useState("");
  const [payInputs, setPayInputs] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchSuppliersDropdown());
    void dispatch(fetchSuppliers({ pageNumber: 1, pageSize: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (paymentMethod === "bank") {
      void dispatch(fetchBankAccountsDropdown());
    }
  }, [dispatch, paymentMethod]);

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

  useEffect(() => {
    setPayInputs((prev) => {
      const next: Record<number, string> = {};
      for (const p of unpaidPurchases) {
        next[p.purchaseId] = prev[p.purchaseId] ?? "";
      }
      return next;
    });
  }, [unpaidPurchases]);

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

  const paidTotalComputed = useMemo(() => {
    return unpaidPurchases.reduce((s, p) => s + (Number(payInputs[p.purchaseId]) || 0), 0);
  }, [unpaidPurchases, payInputs]);

  const discountNum = Number(discountAmount) || 0;
  const netPayAmount = Math.max(0, paidTotalComputed - Math.max(0, discountNum));

  const setPayFor = useCallback((purchaseId: number, value: string) => {
    setPayInputs((prev) => ({ ...prev, [purchaseId]: value }));
  }, []);

  const fillDueForRow = useCallback((p: Purchase) => {
    const due = remainingBalance(p);
    setPayFor(p.purchaseId, due > 0 ? String(due) : "");
  }, [setPayFor]);

  const fillAllDue = useCallback(() => {
    setPayInputs((prev) => {
      const next = { ...prev };
      for (const p of unpaidPurchases) {
        const due = remainingBalance(p);
        next[p.purchaseId] = due > 0 ? String(due) : "";
      }
      return next;
    });
  }, [unpaidPurchases]);

  const clearAllPay = useCallback(() => {
    setPayInputs((prev) => {
      const next = { ...prev };
      for (const p of unpaidPurchases) {
        next[p.purchaseId] = "";
      }
      return next;
    });
  }, [unpaidPurchases]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmPayment = async () => {
    if (supplierId <= 0) {
      dispatch(addToast({ type: "warning", title: "Supplier required", message: "Select a supplier." }));
      return;
    }
    if (!paymentDate) {
      dispatch(addToast({ type: "warning", title: "Date required", message: "Enter payment date." }));
      return;
    }
    if (paymentMethod === "bank") {
      if (!bankSubMethod) {
        dispatch(
          addToast({
            type: "warning",
            title: "Sub method required",
            message: "Choose online transfer or credit card for bank payments.",
          })
        );
        return;
      }
      if (bankSubMethod === "online_transfer" && bankAccountId <= 0) {
        dispatch(
          addToast({
            type: "warning",
            title: "Account required",
            message: "Select the bank account for this online transfer.",
          })
        );
        return;
      }
    }
    if (paidTotalComputed <= 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "No amounts",
          message: "Enter pay amounts in the table for at least one bill.",
        })
      );
      return;
    }

    const lines: { purchase: Purchase; amount: number }[] = [];
    for (const p of unpaidPurchases) {
      const raw = Number(payInputs[p.purchaseId]) || 0;
      if (raw <= 0) continue;
      const due = remainingBalance(p);
      if (raw > due + 0.0001) {
        dispatch(
          addToast({
            type: "error",
            title: "Amount too high",
            message: `Pay amount for ${p.purchaseCode} cannot exceed due ${formatCurrency(due)}.`,
            duration: 5000,
          })
        );
        return;
      }
      lines.push({ purchase: p, amount: raw });
    }

    if (lines.length === 0) {
      dispatch(addToast({ type: "warning", title: "No lines", message: "Enter pay amounts greater than zero." }));
      return;
    }

    setSubmitting(true);
    try {
      for (const { purchase, amount } of lines) {
        const result = await dispatch(paySupplierPurchase({ purchaseId: purchase.purchaseId, amount }));
        if (paySupplierPurchase.rejected.match(result)) {
          dispatch(
            addToast({
              type: "error",
              title: "Payment stopped",
              message: result.payload || `Failed on ${purchase.purchaseCode}.`,
              duration: 6000,
            })
          );
          void dispatch(fetchUnpaidPurchasesBySupplier(supplierId));
          return;
        }
      }

      dispatch(
        addToast({
          type: "success",
          title: "Payment confirmed",
          message:
            discountNum > 0
              ? `Recorded ${formatCurrency(paidTotalComputed)} across ${lines.length} bill(s). Net after discount: ${formatCurrency(netPayAmount)}.`
              : `Recorded ${formatCurrency(paidTotalComputed)} across ${lines.length} bill(s).`,
          duration: 5000,
        })
      );
      setReferenceNo("");
      setDiscountAmount("");
      clearAllPay();
      void dispatch(fetchUnpaidPurchasesBySupplier(supplierId));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || actionLoading;
  const showBankSub = paymentMethod === "bank";
  const showBankAccountPicker = showBankSub && bankSubMethod === "online_transfer";

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
          <p className="mt-1 text-sm text-slate-500">Allocate amounts against outstanding purchase bills</p>
        </header>

        <div className="space-y-8 p-6">
          <div className="max-w-md">
            <label htmlFor="voucher-no" className="mb-1.5 block text-sm font-medium text-slate-700">
              Voucher no.
            </label>
            <input
              id="voucher-no"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              placeholder="e.g. SP-0001/26"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier *</label>
                {dropdownFetchFailed && suppliers.length > 0 && (
                  <p className="mb-1 text-xs text-amber-600">Using full supplier list.</p>
                )}
                <SearchableSelect
                  options={supplierOptions}
                  value={supplierId}
                  onChange={(id) => setSupplierId(id)}
                  placeholder="Search supplier…"
                  disabled={supplierOptions.length === 0}
                  emptyHint="No suppliers"
                />
              </div>

              <div>
                <label htmlFor="pay-method" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment method
                </label>
                <select
                  id="pay-method"
                  value={paymentMethod}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentMethod(v);
                    setBankSubMethod("");
                    setBankAccountId(0);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PAYMENT_METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {showBankSub && (
                <div>
                  <label htmlFor="bank-sub" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment sub method
                  </label>
                  <select
                    id="bank-sub"
                    value={bankSubMethod}
                    onChange={(e) => {
                      setBankSubMethod(e.target.value);
                      setBankAccountId(0);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select sub method</option>
                    {BANK_SUB_METHOD_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showBankAccountPicker && (
                <div>
                  <label htmlFor="bank-acct" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Bank account
                  </label>
                  <select
                    id="bank-acct"
                    value={bankAccountId || ""}
                    onChange={(e) => setBankAccountId(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select bank account</option>
                    {dropdownAccounts.map((a) => (
                      <option key={a.bankAccountId} value={a.bankAccountId}>
                        {a.accountName} ({a.accountType}) · {formatCurrency(a.currentBalance ?? 0)}
                      </option>
                    ))}
                  </select>
                  {dropdownAccounts.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No accounts in dropdown — check API or permissions.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="ref-no" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reference no.
                </label>
                <input
                  id="ref-no"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Enter reference number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="pay-date" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment date <span className="text-red-500">*</span>
                </label>
                <input
                  id="pay-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Paid total amount</label>
                <input
                  readOnly
                  value={paidTotalComputed ? paidTotalComputed.toFixed(2) : ""}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm tabular-nums text-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">Sum of pay amounts in the table below.</p>
              </div>

              <div>
                <label htmlFor="disc-amt" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Discount amount
                </label>
                <input
                  id="disc-amt"
                  type="number"
                  step="0.01"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Net amount</span>
                <span className="text-lg font-semibold tabular-nums text-emerald-700">{formatCurrency(netPayAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Pending bills</h2>

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
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fillAllDue}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fill all due amounts
                </button>
                <button
                  type="button"
                  onClick={clearAllPay}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear pay amounts
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[960px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="whitespace-nowrap px-3 py-3">Bill code</th>
                      <th className="whitespace-nowrap px-3 py-3">Ref #</th>
                      <th className="whitespace-nowrap px-3 py-3">Bill date</th>
                      <th className="whitespace-nowrap px-3 py-3">Due / terms</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Original</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Debit notes</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Net amount</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Already paid</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Due amount</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Pay amount</th>
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
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-400">—</td>
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
                          <td className="whitespace-nowrap px-2 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={payInputs[row.purchaseId] ?? ""}
                                onChange={(e) => setPayFor(row.purchaseId, e.target.value)}
                                placeholder="0"
                                disabled={due <= 0 || busy}
                                className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                disabled={due <= 0 || busy}
                                onClick={() => fillDueForRow(row)}
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                              >
                                Max
                              </button>
                            </div>
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
            </>
          )}
        </div>

        <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-6">
          <div className="flex justify-center">
            <button
              type="button"
              disabled={busy || supplierId <= 0 || unpaidPurchases.length === 0 || paidTotalComputed <= 0}
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
