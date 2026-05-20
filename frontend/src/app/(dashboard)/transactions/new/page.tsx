"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import { DecimalInput, PageHeader, SearchableSelect } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PAYMENT_TYPE_OPTIONS,
  buildPaymentTransactionDetails,
  buildPaymentTransactionRequest,
  defaultTitleForPaymentType,
  validatePaymentForm,
  type PaymentTransactionType,
} from "@/lib/buildPaymentTransaction";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import { fetchCustomersDropdown } from "@/store/slices/customer/customer.slice";
import { fetchSuppliersDropdown } from "@/store/slices/supplier/supplier.slice";
import { createTransaction } from "@/store/slices/transaction/transaction.slice";
import type { BankAccountDropdown } from "@/types/bankAccount";

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateInputToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const lbl = "mb-1 block text-sm font-medium text-slate-700";
const hint = "mt-1 text-xs text-slate-500";
const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function RecordTransactionPage() {
  const dispatch = useAppDispatch();
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);
  const { dropdownCustomers } = useAppSelector((s) => s.customer);
  const { dropdownSuppliers } = useAppSelector((s) => s.supplier);
  const { actionLoading } = useAppSelector((s) => s.transaction);

  const [paymentType, setPaymentType] = useState<PaymentTransactionType>("collect_customer");
  const [title, setTitle] = useState(defaultTitleForPaymentType("collect_customer"));
  const [transactionDate, setTransactionDate] = useState(todayInputDate);
  const [description, setDescription] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [amount, setAmount] = useState(0);
  const [bankAccountId, setBankAccountId] = useState(0);
  const [transferToAccountId, setTransferToAccountId] = useState(0);
  const [customerId, setCustomerId] = useState(0);
  const [supplierId, setSupplierId] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void dispatch(fetchBankAccountsDropdown());
    void dispatch(fetchCustomersDropdown());
    void dispatch(fetchSuppliersDropdown());
  }, [dispatch]);

  const bankAccounts = dropdownAccounts;

  const bankOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      bankAccounts.map((a) => ({
        value: a.bankAccountId,
        label: `${a.accountName} (${a.accountType}) — ${formatCurrency(a.currentBalance)}`,
        search: `${a.accountName} ${a.accountType}`.toLowerCase(),
      })),
    [bankAccounts]
  );

  const customerOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      dropdownCustomers.map((c) => ({
        value: c.customerId,
        label: `${c.customerCode} — ${c.customerName}`,
        search: `${c.customerCode} ${c.customerName}`.toLowerCase(),
      })),
    [dropdownCustomers]
  );

  const supplierOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      dropdownSuppliers.map((s) => ({
        value: s.supplierId,
        label: `${s.supplierCode} — ${s.supplierName}`,
        search: `${s.supplierCode} ${s.supplierName}`.toLowerCase(),
      })),
    [dropdownSuppliers]
  );

  const selectedBank = useMemo(
    () => bankAccounts.find((a) => a.bankAccountId === bankAccountId),
    [bankAccounts, bankAccountId]
  );

  const selectedTransferTo = useMemo(
    () => bankAccounts.find((a) => a.bankAccountId === transferToAccountId),
    [bankAccounts, transferToAccountId]
  );

  const previewDetails = useMemo(() => {
    if (!selectedBank || amount <= 0) return [];
    return buildPaymentTransactionDetails({
      paymentType,
      amount,
      bankAccount: selectedBank,
      transferToAccount: selectedTransferTo,
      customerId: customerId > 0 ? customerId : undefined,
      supplierId: supplierId > 0 ? supplierId : undefined,
      lineDescription: description.trim() || title.trim(),
    });
  }, [
    paymentType,
    amount,
    selectedBank,
    selectedTransferTo,
    customerId,
    supplierId,
    description,
    title,
  ]);

  const needsCustomer =
    paymentType === "collect_customer" || paymentType === "refund_customer";
  const needsSupplier =
    paymentType === "pay_supplier" || paymentType === "receive_supplier";
  const isTransfer = paymentType === "transfer";

  const onPaymentTypeChange = (value: PaymentTransactionType) => {
    setPaymentType(value);
    setTitle(defaultTitleForPaymentType(value));
    setCustomerId(0);
    setSupplierId(0);
    setTransferToAccountId(0);
  };

  const resetForm = () => {
    setAmount(0);
    setReferenceNo("");
    setDescription("");
    setCustomerId(0);
    setSupplierId(0);
    setBankAccountId(0);
    setTransferToAccountId(0);
    setTitle(defaultTitleForPaymentType(paymentType));
    setTransactionDate(todayInputDate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePaymentForm({
      paymentType,
      amount,
      bankAccountId,
      transferToAccountId: isTransfer ? transferToAccountId : undefined,
      customerId: needsCustomer ? customerId : undefined,
      supplierId: needsSupplier ? supplierId : undefined,
      title,
      transactionDate,
    });

    if (validationError) {
      dispatch(addToast({ type: "warning", title: "Check form", message: validationError }));
      return;
    }

    const bankAccount = bankAccounts.find((a) => a.bankAccountId === bankAccountId);
    if (!bankAccount) {
      dispatch(addToast({ type: "warning", title: "Account required", message: "Select a valid account." }));
      return;
    }

    let transferToAccount: BankAccountDropdown | undefined;
    if (isTransfer) {
      transferToAccount = bankAccounts.find((a) => a.bankAccountId === transferToAccountId);
      if (!transferToAccount) {
        dispatch(addToast({ type: "warning", title: "Account required", message: "Select transfer destination." }));
        return;
      }
    }

    const payload = buildPaymentTransactionRequest({
      paymentType,
      transactionDate: dateInputToIso(transactionDate),
      title,
      description: description.trim() || undefined,
      referenceNo: referenceNo.trim() || undefined,
      amount,
      bankAccount,
      transferToAccount,
      customerId: needsCustomer ? customerId : undefined,
      supplierId: needsSupplier ? supplierId : undefined,
      createdBy: null,
    });

    setSubmitting(true);
    try {
      const result = await dispatch(createTransaction(payload));
      if (createTransaction.rejected.match(result)) {
        dispatch(
          addToast({
            type: "error",
            title: "Transaction failed",
            message: result.payload || "Could not post transaction.",
            duration: 7000,
          })
        );
        return;
      }

      const tx = result.payload?.data;
      const code = tx?.transactionCode ?? "";
      const apiMsg = result.payload?.message;
      dispatch(
        addToast({
          type: "success",
          title: "Transaction posted",
          message: code
            ? `${apiMsg || "Saved."} Code: ${code}`
            : apiMsg || "Transaction created successfully.",
          duration: 6000,
        })
      );
      resetForm();
      void dispatch(fetchBankAccountsDropdown());
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || actionLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHeader
        title="Record transaction"
        description="Post balanced journal entries for customer payments, supplier payments, refunds, and transfers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions", href: "/transactions" },
          { label: "Record" },
        ]}
        actions={
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ledger
          </Link>
        }
      />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <header className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Payment details</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Debits and credits are built automatically from the payment type you choose.
          </p>
        </header>

        <div className="space-y-5 p-6">
          <div>
            <label className={lbl}>
              Payment type <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => onPaymentTypeChange(e.target.value as PaymentTransactionType)}
              className={inputBase}
            >
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Transaction title"
                className={inputBase}
              />
            </div>
            <div>
              <label className={lbl}>
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Reference no.</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Optional voucher / cheque no."
              className={inputBase}
            />
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className={cn(inputBase, "resize-y")}
            />
          </div>

          <div>
            <label className={lbl}>
              Amount <span className="text-red-500">*</span>
            </label>
            <DecimalInput
              value={amount}
              onChange={setAmount}
              emptyWhenZero
              placeholder="0.00"
              className={cn(inputBase, "text-right font-semibold")}
            />
          </div>

          {isTransfer ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={lbl}>
                  From account (credit) <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={bankOptions}
                  value={bankAccountId}
                  onChange={setBankAccountId}
                  placeholder="Select source account…"
                  emptyHint="No accounts"
                  triggerClassName="border-slate-200 py-2.5"
                />
                {selectedBank ? (
                  <p className={hint}>Balance: {formatCurrency(selectedBank.currentBalance)}</p>
                ) : null}
              </div>
              <div>
                <label className={lbl}>
                  To account (debit) <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={bankOptions}
                  value={transferToAccountId}
                  onChange={setTransferToAccountId}
                  placeholder="Select destination…"
                  emptyHint="No accounts"
                  triggerClassName="border-slate-200 py-2.5"
                />
                {selectedTransferTo ? (
                  <p className={hint}>Balance: {formatCurrency(selectedTransferTo.currentBalance)}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <label className={lbl}>
                Bank / cash account <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={bankOptions}
                value={bankAccountId}
                onChange={setBankAccountId}
                placeholder="Select account…"
                emptyHint="No accounts loaded"
                triggerClassName="border-slate-200 py-2.5"
              />
              {selectedBank ? (
                <p className={hint}>Balance: {formatCurrency(selectedBank.currentBalance)}</p>
              ) : null}
            </div>
          )}

          {needsCustomer ? (
            <div>
              <label className={lbl}>
                Customer <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={customerOptions}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Search customer…"
                emptyHint="No customers"
                triggerClassName="border-slate-200 py-2.5"
              />
            </div>
          ) : null}

          {needsSupplier ? (
            <div>
              <label className={lbl}>
                Supplier <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={supplierOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="Search supplier…"
                emptyHint="No suppliers"
                triggerClassName="border-slate-200 py-2.5"
              />
            </div>
          ) : null}

          {previewDetails.length >= 2 ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
                Journal preview
              </p>
              <ul className="mt-2 space-y-2">
                {previewDetails.map((line, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {line.accountName}{" "}
                      <span className="text-xs font-normal text-slate-500">({line.accountType})</span>
                    </span>
                    <span className="tabular-nums text-slate-700">
                      {line.debit > 0 ? (
                        <span className="font-semibold text-emerald-800">DR {formatCurrency(line.debit)}</span>
                      ) : (
                        <span className="font-semibold text-rose-800">CR {formatCurrency(line.credit)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Link
            href="/transactions"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post transaction
          </button>
        </footer>
      </form>
    </div>
  );
}
