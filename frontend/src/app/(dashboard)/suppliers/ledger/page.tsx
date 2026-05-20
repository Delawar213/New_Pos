"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Loader2,
  Printer,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PageHeader, SearchableSelect, StatsCard } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { toSupplierSelectOptions } from "@/lib/partyDropdownLabels";
import { SupplierLedgerTable } from "@/components/suppliers/SupplierLedgerTable";
import { formatCurrency, cn } from "@/lib/utils";
import {
  balanceLabel,
  balanceTone,
  summarizeSupplierLedger,
} from "@/lib/supplierLedgerUtils";
import { printSupplierLedgerReport } from "@/lib/supplierLedgerPrint";
import { addToast } from "@/store/slices/ui/ui.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSupplierLedger,
  fetchSupplierBalance,
  fetchSupplierLedger,
  fetchSuppliers,
  fetchSuppliersDropdown,
} from "@/store/slices/supplier/supplier.slice";

function startOfYearInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function SupplierLedgerPage() {
  const dispatch = useAppDispatch();
  const {
    dropdownSuppliers,
    suppliers: suppliersFromList,
    dropdownFetchFailed,
    supplierLedger,
    supplierLedgerMessage,
    ledgerLoading,
    supplierBalance,
    error,
  } = useAppSelector((s) => s.supplier);

  const [supplierId, setSupplierId] = useState(0);
  const [fromDate, setFromDate] = useState(startOfYearInput);
  const [toDate, setToDate] = useState(todayInputDate);
  const [useDateFilter, setUseDateFilter] = useState(true);

  useEffect(() => {
    void dispatch(fetchSuppliersDropdown());
    void dispatch(fetchSuppliers({ pageNumber: 1, pageSize: 200 }));
    return () => {
      dispatch(clearSupplierLedger());
    };
  }, [dispatch]);

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

  const supplierOptions = useMemo(() => toSupplierSelectOptions(suppliers), [suppliers]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.supplierId === supplierId),
    [suppliers, supplierId]
  );

  const loadLedger = () => {
    if (supplierId <= 0) return;
    void dispatch(
      fetchSupplierLedger({
        supplierId,
        fromDate: useDateFilter ? fromDate : undefined,
        toDate: useDateFilter ? toDate : undefined,
      })
    );
    void dispatch(fetchSupplierBalance(supplierId));
  };

  useEffect(() => {
    if (supplierId <= 0) {
      dispatch(clearSupplierLedger());
      return;
    }
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when supplier or date filter toggles
  }, [supplierId]);

  const stats = useMemo(() => summarizeSupplierLedger(supplierLedger), [supplierLedger]);

  const dateRangeInvalid =
    useDateFilter && Boolean(fromDate && toDate && fromDate > toDate);

  const handlePrint = () => {
    if (!selectedSupplier) {
      dispatch(
        addToast({
          type: "warning",
          title: "Select a supplier",
          message: "Choose a supplier and load the ledger before printing.",
          duration: 3000,
        })
      );
      return;
    }
    if (supplierLedger.length === 0) {
      dispatch(
        addToast({
          type: "warning",
          title: "Nothing to print",
          message: "No ledger entries for the selected period.",
          duration: 3000,
        })
      );
      return;
    }
    printSupplierLedgerReport(supplierLedger, {
      supplierCode: selectedSupplier.supplierCode,
      supplierName: selectedSupplier.supplierName,
      fromDate: useDateFilter ? fromDate : undefined,
      toDate: useDateFilter ? toDate : undefined,
      useDateFilter,
      currentBalance: supplierBalance,
    });
  };

  const canPrint =
    supplierId > 0 && !ledgerLoading && supplierLedger.length > 0 && !dateRangeInvalid;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier ledger"
        description="Account statement by supplier — purchases, payments, returns, and running balance"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Suppliers", href: "/suppliers" },
          { label: "Ledger" },
        ]}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Supplier
            </label>
            <SearchableSelect
              value={supplierId}
              onChange={(id) => setSupplierId(id)}
              options={supplierOptions}
              placeholder="Select supplier…"
              emptyHint="No suppliers loaded"
            />
            {dropdownFetchFailed && suppliers.length > 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                Dropdown API unavailable — using supplier list.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 lg:col-span-7 lg:justify-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={useDateFilter}
                onChange={(e) => setUseDateFilter(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Filter by date range
            </label>
          </div>

          {useDateFilter ? (
            <>
              <div className="lg:col-span-3">
                <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="lg:col-span-3">
                <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          ) : null}

          <div
            className={cn(
              "flex flex-wrap gap-2",
              useDateFilter ? "lg:col-span-6 lg:justify-end" : "lg:col-span-12 lg:justify-end"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setFromDate(startOfYearInput());
                setToDate(todayInputDate());
              }}
              disabled={!useDateFilter}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Reset dates
            </button>
            <button
              type="button"
              onClick={loadLedger}
              disabled={supplierId <= 0 || ledgerLoading || dateRangeInvalid}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {ledgerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Load ledger
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        {dateRangeInvalid ? (
          <p className="mt-3 text-sm text-rose-600">“From” date must be on or before “To” date.</p>
        ) : null}
      </div>

      {supplierId <= 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
          <Truck className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Select a supplier to view their ledger</p>
          <Link href="/suppliers" className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
            Manage suppliers
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              title="Entries"
              value={stats.count}
              icon={BookOpen}
              color="blue"
              variant="outline"
            />
            <StatsCard
              title="Total debit"
              value={formatCurrency(stats.totalDebit)}
              icon={TrendingUp}
              color="purple"
              variant="outline"
            />
            <StatsCard
              title="Total credit"
              value={formatCurrency(stats.totalCredit)}
              icon={TrendingDown}
              color="green"
              variant="outline"
            />
            <StatsCard
              title="Closing balance"
              value={formatCurrency(stats.closingBalance)}
              icon={Scale}
              color={stats.closingBalance < 0 ? "red" : "green"}
              variant="outline"
            />
          </div>

          {selectedSupplier ? (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedSupplier.supplierName}</p>
                <p className="text-xs text-slate-500">{selectedSupplier.supplierCode}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs text-slate-500">Current balance (API)</p>
                <p className={cn("font-bold tabular-nums", balanceTone(supplierBalance))}>
                  {formatCurrency(supplierBalance)}
                </p>
                <p className="text-[10px] text-slate-400">{balanceLabel(supplierBalance)}</p>
              </div>
            </div>
          ) : null}

          {supplierLedgerMessage ? (
            <p className="text-sm text-slate-600">{supplierLedgerMessage}</p>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {ledgerLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-sm font-medium">Loading ledger…</span>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!canPrint}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  Print statement
                </button>
              </div>
              <SupplierLedgerTable
                entries={supplierLedger}
                supplierName={selectedSupplier?.supplierName}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
