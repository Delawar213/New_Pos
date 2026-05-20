"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp, FileText, Users, Wallet } from "lucide-react";
import { SearchableSelect, StatusBadge, DecimalInput } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import type { Sale } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/ui/ui.slice";
import {
  customerBulkPayment,
  customerSalePayment,
  fetchCustomers,
  fetchCustomersDropdown,
} from "@/store/slices/customer/customer.slice";
import { fetchBankAccountsDropdown } from "@/store/slices/bankAccount/bankAccount.slice";
import {
  bankAccountDropdownLabel,
  toCustomerSelectOptions,
} from "@/lib/partyDropdownLabels";
import { fetchSaleById, fetchSaleByInvoiceNumber } from "@/store/slices/sale/sale.slice";

type PaymentMode = "bulk" | "sale";

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

function buildDescription(reference: string, notes: string, prefix: string): string {
  const parts = [
    reference.trim() && `Ref: ${reference.trim()}`,
    notes.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : prefix;
}

function saleDueAmount(sale: Sale): number {
  const due = Number(sale.dueAmount);
  return Number.isFinite(due) ? Math.max(0, due) : 0;
}

export default function CustomerPaymentsPage() {
  const dispatch = useAppDispatch();
  const { dropdownCustomers, customers: customersFromList, actionLoading } =
    useAppSelector((s) => s.customer);
  const { dropdownAccounts } = useAppSelector((s) => s.bankAccount);

  const [mode, setMode] = useState<PaymentMode>("bulk");
  const [customerId, setCustomerId] = useState(0);
  const [bankAccountId, setBankAccountId] = useState(0);
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayInputDate);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [descriptionNotes, setDescriptionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [saleIdInput, setSaleIdInput] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [loadedSale, setLoadedSale] = useState<Sale | null>(null);
  const [saleLoadError, setSaleLoadError] = useState<string | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);

  useEffect(() => {
    void dispatch(fetchCustomersDropdown());
    void dispatch(fetchCustomers({ pageNumber: 1, pageSize: 200 }));
    void dispatch(fetchBankAccountsDropdown());
  }, [dispatch]);

  const customers = useMemo(
    () =>
      dropdownCustomers.length > 0
        ? dropdownCustomers
        : customersFromList.map((c) => ({
            customerId: c.customerId,
            customerCode: c.customerCode,
            customerName: c.customerName,
            customerTypeName: c.customerTypeName ?? "",
            currentBalance: c.currentBalance ?? 0,
            creditLimit: c.creditLimit,
          })),
    [dropdownCustomers, customersFromList]
  );

  const customerOptions = useMemo(() => toCustomerSelectOptions(customers), [customers]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === customerId),
    [customers, customerId]
  );

  const applyLoadedSale = (sale: Sale) => {
    setLoadedSale(sale);
    setSaleLoadError(null);
    const due = saleDueAmount(sale);
    setPaymentAmount(due > 0 ? due : 0);
    if (sale.customerId) setCustomerId(sale.customerId);
  };

  const loadSaleById = async () => {
    const id = Number(saleIdInput);
    if (!Number.isFinite(id) || id <= 0) {
      dispatch(addToast({ type: "warning", title: "Invalid sale", message: "Enter a valid sale ID." }));
      return;
    }
    setSaleLoading(true);
    setSaleLoadError(null);
    try {
      const sale = await dispatch(fetchSaleById({ id, updateSelection: false })).unwrap();
      applyLoadedSale(sale);
    } catch (e) {
      setLoadedSale(null);
      setSaleLoadError(typeof e === "string" ? e : "Sale not found.");
    } finally {
      setSaleLoading(false);
    }
  };

  const loadSaleByInvoice = async () => {
    const inv = invoiceSearch.trim();
    if (!inv) {
      dispatch(addToast({ type: "warning", title: "Invoice required", message: "Enter an invoice number." }));
      return;
    }
    setSaleLoading(true);
    setSaleLoadError(null);
    try {
      const sale = await dispatch(fetchSaleByInvoiceNumber(inv)).unwrap();
      applyLoadedSale(sale);
      setSaleIdInput(String(sale.id));
    } catch (e) {
      setLoadedSale(null);
      setSaleLoadError(typeof e === "string" ? e : "Sale not found.");
    } finally {
      setSaleLoading(false);
    }
  };

  const handleBulkPayment = async () => {
    if (customerId <= 0) {
      dispatch(addToast({ type: "warning", title: "Customer required", message: "Select a customer." }));
      return;
    }
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

    setSubmitting(true);
    try {
      const result = await dispatch(
        customerBulkPayment({
          customerId,
          paymentAmount,
          bankAccountId,
          paymentDate: dateInputToIso(paymentDate),
          description: buildDescription(referenceNo, descriptionNotes, "Customer bulk payment"),
        })
      );
      if (customerBulkPayment.rejected.match(result)) {
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
          : "Bulk payment recorded.";
      dispatch(addToast({ type: "success", title: "Payment recorded", message: msg, duration: 5000 }));
      setPaymentAmount(0);
      setReferenceNo("");
      setDescriptionNotes("");
      void dispatch(fetchCustomersDropdown());
      void dispatch(fetchCustomers({ pageNumber: 1, pageSize: 200 }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalePayment = async () => {
    if (!loadedSale) {
      dispatch(addToast({ type: "warning", title: "Load a sale", message: "Find the sale to pay first." }));
      return;
    }
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
    const due = saleDueAmount(loadedSale);
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
          saleId: loadedSale.id,
          paymentAmount,
          bankAccountId,
          paymentDate: dateInputToIso(paymentDate),
          description: buildDescription(
            referenceNo || loadedSale.invoiceNo,
            descriptionNotes,
            `Payment for ${loadedSale.invoiceNo}`
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
      setPaymentAmount(0);
      setReferenceNo("");
      setDescriptionNotes("");
      void loadSaleById();
      void dispatch(fetchCustomersDropdown());
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || actionLoading || saleLoading;
  const saleDue = loadedSale ? saleDueAmount(loadedSale) : 0;

  return (
    <div className="relative mx-auto max-w-6xl pb-24">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/customers" className="hover:text-blue-600">
          Customers
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-800">Receive payment</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Customer payment</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record money received from customers — against one sale or as a bulk allocation
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("bulk")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                mode === "bulk"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Users className="h-4 w-4" />
              Bulk payment
            </button>
            <button
              type="button"
              onClick={() => setMode("sale")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                mode === "sale"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <FileText className="h-4 w-4" />
              Pay specific sale
            </button>
          </div>
        </header>

        <div className="space-y-4 p-6">
          {mode === "bulk" ? (
            <div>
              <label className={lbl}>
                Customer <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={customerOptions}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Search customer…"
                disabled={customerOptions.length === 0}
                emptyHint="No customers"
                triggerClassName="border-slate-200 py-2.5"
              />
              {selectedCustomer && Number(selectedCustomer.currentBalance) !== 0 ? (
                <p className={hint}>
                  Ledger balance:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(Number(selectedCustomer.currentBalance))}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm font-semibold text-slate-800">Find sale</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Sale ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={saleIdInput}
                      onChange={(e) => setSaleIdInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 42"
                      className={cn(inputBase, "flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => void loadSaleById()}
                      disabled={saleLoading}
                      className="shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                      Load
                    </button>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Or invoice number</label>
                  <div className="flex gap-2">
                    <input
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      placeholder="INV-20260513-7402"
                      className={cn(inputBase, "flex-1 font-mono text-xs")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void loadSaleByInvoice();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void loadSaleByInvoice()}
                      disabled={saleLoading}
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Find
                    </button>
                  </div>
                </div>
              </div>
              {saleLoadError ? (
                <p className="text-sm text-rose-600">{saleLoadError}</p>
              ) : null}
              {loadedSale ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-900">{loadedSale.invoiceNo}</p>
                      <p className="text-sm text-slate-600">{loadedSale.customerName ?? "—"}</p>
                      <p className="text-xs text-slate-400">Sale #{loadedSale.id}</p>
                    </div>
                    {loadedSale.paymentMethod ? (
                      <StatusBadge status={loadedSale.paymentMethod} />
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(loadedSale.grandTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Paid</p>
                      <p className="font-semibold tabular-nums text-emerald-700">
                        {formatCurrency(loadedSale.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Due</p>
                      <p className="font-semibold tabular-nums text-rose-700">
                        {formatCurrency(saleDue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="font-medium">
                        {loadedSale.saleDate
                          ? new Date(loadedSale.saleDate).toLocaleDateString("en-GB")
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {saleDue <= 0 ? (
                    <p className="mt-2 text-xs font-medium text-emerald-700">This sale is fully paid.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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
                    {bankAccountDropdownLabel(a)}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pay-amount" className={lbl}>
                Payment amount <span className="text-red-500">*</span>
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
                />
              </div>
              {mode === "sale" && loadedSale && saleDue > 0 ? (
                <button
                  type="button"
                  className={cn(hint, "text-left font-medium text-blue-600 hover:underline")}
                  onClick={() => setPaymentAmount(saleDue)}
                >
                  Use full due: {formatCurrency(saleDue)}
                </button>
              ) : null}
            </div>
            <div>
              <label htmlFor="ref-no" className={lbl}>
                Reference
              </label>
              <input
                id="ref-no"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Receipt / transfer ref"
                className={inputBase}
              />
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
              rows={2}
              className={cn(inputBase, "resize-y")}
            />
          </div>
        </div>

        <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-6">
          <div className="flex justify-center">
            <button
              type="button"
              disabled={
                busy ||
                bankAccountId <= 0 ||
                paymentAmount <= 0 ||
                (mode === "bulk" && customerId <= 0) ||
                (mode === "sale" && (!loadedSale || saleDue <= 0))
              }
              onClick={() => void (mode === "bulk" ? handleBulkPayment() : handleSalePayment())}
              className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Wallet className="h-4 w-4" />
              {busy ? "Processing…" : mode === "bulk" ? "Record bulk payment" : "Record sale payment"}
            </button>
          </div>
        </footer>
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
        title="Top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
