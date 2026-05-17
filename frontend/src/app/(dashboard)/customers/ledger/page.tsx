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
  Users,
} from "lucide-react";
import { PageHeader, SearchableSelect, StatsCard } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { CustomerLedgerTable } from "@/components/customers/CustomerLedgerTable";
import { formatCurrency, cn } from "@/lib/utils";
import {
  balanceTone,
  customerBalanceLabel,
  summarizeCustomerLedger,
} from "@/lib/customerLedgerUtils";
import { printCustomerLedgerReport } from "@/lib/customerLedgerPrint";
import { addToast } from "@/store/slices/ui/ui.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCustomerLedger,
  fetchCustomerBalance,
  fetchCustomerLedger,
  fetchCustomers,
  fetchCustomersDropdown,
} from "@/store/slices/customer/customer.slice";

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

export default function CustomerLedgerPage() {
  const dispatch = useAppDispatch();
  const {
    dropdownCustomers,
    customers: customersFromList,
    customerLedger,
    customerLedgerMessage,
    ledgerLoading,
    customerBalance,
    error,
  } = useAppSelector((s) => s.customer);

  const [customerId, setCustomerId] = useState(0);
  const [fromDate, setFromDate] = useState(startOfYearInput);
  const [toDate, setToDate] = useState(todayInputDate);
  const [useDateFilter, setUseDateFilter] = useState(true);

  useEffect(() => {
    void dispatch(fetchCustomersDropdown());
    void dispatch(fetchCustomers({ pageNumber: 1, pageSize: 200 }));
    return () => {
      dispatch(clearCustomerLedger());
    };
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

  const customerOptions: SearchableSelectOption<number>[] = useMemo(
    () =>
      customers.map((c) => ({
        value: c.customerId,
        label: `${c.customerCode} — ${c.customerName}`,
        search: `${c.customerCode} ${c.customerName} ${c.customerTypeName ?? ""}`.toLowerCase(),
      })),
    [customers]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === customerId),
    [customers, customerId]
  );

  const loadLedger = () => {
    if (customerId <= 0) return;
    void dispatch(
      fetchCustomerLedger({
        customerId,
        fromDate: useDateFilter ? fromDate : undefined,
        toDate: useDateFilter ? toDate : undefined,
      })
    );
    void dispatch(fetchCustomerBalance(customerId));
  };

  useEffect(() => {
    if (customerId <= 0) {
      dispatch(clearCustomerLedger());
      return;
    }
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when customer changes
  }, [customerId]);

  const stats = useMemo(() => summarizeCustomerLedger(customerLedger), [customerLedger]);

  const dateRangeInvalid =
    useDateFilter && Boolean(fromDate && toDate && fromDate > toDate);

  const handlePrint = () => {
    if (!selectedCustomer) {
      dispatch(
        addToast({
          type: "warning",
          title: "Select a customer",
          message: "Choose a customer and load the ledger before printing.",
          duration: 3000,
        })
      );
      return;
    }
    if (customerLedger.length === 0) {
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
    printCustomerLedgerReport(customerLedger, {
      customerCode: selectedCustomer.customerCode,
      customerName: selectedCustomer.customerName,
      fromDate: useDateFilter ? fromDate : undefined,
      toDate: useDateFilter ? toDate : undefined,
      useDateFilter,
      currentBalance: customerBalance,
    });
  };

  const canPrint =
    customerId > 0 && !ledgerLoading && customerLedger.length > 0 && !dateRangeInvalid;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer ledger"
        description="Account statement by customer — sales, payments, returns, and running balance"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Ledger" },
        ]}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Customer
            </label>
            <SearchableSelect
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              options={customerOptions}
              placeholder="Select customer…"
              emptyHint="No customers loaded"
            />
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
              disabled={customerId <= 0 || ledgerLoading || dateRangeInvalid}
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

      {customerId <= 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Select a customer to view their ledger</p>
          <Link href="/customers" className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
            Manage customers
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

          {selectedCustomer ? (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedCustomer.customerName}</p>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.customerCode}
                  {selectedCustomer.customerTypeName
                    ? ` · ${selectedCustomer.customerTypeName}`
                    : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs text-slate-500">Current balance (API)</p>
                <p className={cn("font-bold tabular-nums", balanceTone(customerBalance))}>
                  {formatCurrency(customerBalance)}
                </p>
                <p className="text-[10px] text-slate-400">{customerBalanceLabel(customerBalance)}</p>
              </div>
            </div>
          ) : null}

          {customerLedgerMessage ? (
            <p className="text-sm text-slate-600">{customerLedgerMessage}</p>
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
              <CustomerLedgerTable
                entries={customerLedger}
                customerName={selectedCustomer?.customerName}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
