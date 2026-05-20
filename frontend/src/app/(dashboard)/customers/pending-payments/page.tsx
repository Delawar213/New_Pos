"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Loader2,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader, SearchableSelect, StatsCard, StatusBadge } from "@/components/ui";
import type { SearchableSelectOption } from "@/components/ui";
import { SalePaymentModal } from "@/components/sales/SalePaymentModal";
import type { CustomerPendingSale } from "@/types/customer";
import type { Sale } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  customerDropdownLabel,
  customerSearchText,
  pendingCustomerDropdownLabel,
} from "@/lib/partyDropdownLabels";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearPendingPayments,
  fetchAllCustomerPendingPayments,
  fetchCustomerPendingPayments,
  fetchCustomersDropdown,
} from "@/store/slices/customer/customer.slice";

function formatPendingDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
}

function pendingSaleToSale(row: CustomerPendingSale): Sale {
  return {
    id: row.saleId,
    invoiceNo: row.invoiceNumber,
    customerId: row.customerId,
    customerName: row.customerName,
    saleDate: row.saleDate,
    status: "completed",
    subtotal: row.totalAmount,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: row.totalAmount,
    paidAmount: row.paidAmount,
    dueAmount: row.remainingAmount,
    changeAmount: 0,
    paymentMethod: row.paymentStatus,
    items: [],
    createdBy: "",
    createdAt: row.saleDate,
  };
}

const th =
  "whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
const td = "whitespace-nowrap px-3 py-2.5 text-sm";

export default function CustomerPendingPaymentsPage() {
  const dispatch = useAppDispatch();
  const {
    pendingPayments,
    pendingPaymentsLoading,
    pendingPaymentsError,
    pendingPaymentsCustomerId,
    dropdownCustomers,
  } = useAppSelector((s) => s.customer);

  const [filterCustomerId, setFilterCustomerId] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);

  const loadPending = useCallback(() => {
    if (filterCustomerId > 0) {
      return dispatch(fetchCustomerPendingPayments(filterCustomerId));
    }
    return dispatch(fetchAllCustomerPendingPayments());
  }, [dispatch, filterCustomerId]);

  useEffect(() => {
    void dispatch(fetchCustomersDropdown());
    return () => {
      dispatch(clearPendingPayments());
    };
  }, [dispatch]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const customerOptions: SearchableSelectOption<number>[] = useMemo(() => {
    const fromApi = pendingPayments?.customerSummaries ?? [];
    const fromDropdown = dropdownCustomers.map((c) => ({
      value: c.customerId,
      label: customerDropdownLabel(c),
      search: customerSearchText(c),
    }));
    if (fromApi.length === 0) {
      return [{ value: 0, label: "All customers", search: "all" }, ...fromDropdown];
    }
    const seen = new Set<number>();
    const opts: SearchableSelectOption<number>[] = [
      { value: 0, label: "All customers", search: "all" },
    ];
    for (const row of fromApi) {
      if (seen.has(row.customerId)) continue;
      seen.add(row.customerId);
      opts.push({
        value: row.customerId,
        label: pendingCustomerDropdownLabel(row),
        search: customerSearchText(row),
      });
    }
    for (const d of fromDropdown) {
      if (!seen.has(d.value)) opts.push(d);
    }
    return opts;
  }, [pendingPayments?.customerSummaries, dropdownCustomers]);

  const summaries = pendingPayments?.customerSummaries ?? [];
  const pendingSales = pendingPayments?.pendingSales ?? [];

  const openPay = (row: CustomerPendingSale) => {
    setPaymentSale(pendingSaleToSale(row));
    setPaymentOpen(true);
  };

  const closePay = () => {
    setPaymentOpen(false);
    setPaymentSale(null);
  };

  const onPaymentSuccess = () => {
    void loadPending();
  };

  return (
    <div>
      <PageHeader
        title="Pending payments"
        description="Customers and sales with outstanding balances"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Pending payments" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/customer-payments"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Wallet className="h-4 w-4" />
              Receive payment
            </Link>
            <button
              type="button"
              onClick={() => void loadPending()}
              disabled={pendingPaymentsLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {pendingPaymentsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Customers with balance"
          value={String(pendingPayments?.grandTotalCustomers ?? 0)}
          icon={Users}
          color="blue"
          variant="outline"
        />
        <StatsCard
          title="Total outstanding"
          value={formatCurrency(pendingPayments?.grandTotalRemaining ?? 0)}
          icon={Clock}
          color="amber"
          variant="outline"
        />
        <StatsCard
          title="Pending invoices"
          value={String(pendingSales.length)}
          icon={Clock}
          color="purple"
          variant="outline"
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-slate-700">Filter by customer</label>
        <SearchableSelect
          options={customerOptions}
          value={filterCustomerId}
          onChange={setFilterCustomerId}
          placeholder="All customers…"
          triggerClassName="max-w-md border-slate-200 py-2.5"
        />
        {pendingPaymentsCustomerId > 0 && filterCustomerId > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing pending data for the selected customer only.
          </p>
        ) : null}
      </div>

      {pendingPaymentsError ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {pendingPaymentsError}
        </div>
      ) : null}

      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900">Customer summary</h2>
          <p className="text-xs text-slate-500">Outstanding totals per customer</p>
        </header>
        {pendingPaymentsLoading && !pendingPayments ? (
          <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </p>
        ) : summaries.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No customers with pending balances.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className={th}>Customer</th>
                  <th className={th}>Contact</th>
                  <th className={cn(th, "text-right")}>Credit limit</th>
                  <th className={cn(th, "text-right")}>Ledger balance</th>
                  <th className={cn(th, "text-center")}>Pending sales</th>
                  <th className={cn(th, "text-right")}>Invoiced</th>
                  <th className={cn(th, "text-right")}>Paid</th>
                  <th className={cn(th, "text-right")}>Remaining</th>
                  <th className={th}>Oldest pending</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((row) => (
                  <tr key={row.customerId} className="bg-white hover:bg-slate-50/60">
                    <td className={td}>
                      <p className="font-medium text-slate-900">{row.customerName}</p>
                      <p className="text-xs text-slate-500">{row.customerCode}</p>
                    </td>
                    <td className={cn(td, "text-slate-600")}>{row.contactNo || "—"}</td>
                    <td className={cn(td, "text-right tabular-nums")}>
                      {formatCurrency(row.creditLimit)}
                      {row.creditUtilizationPct != null ? (
                        <p className="text-xs text-slate-500">{row.creditUtilizationPct}% used</p>
                      ) : null}
                    </td>
                    <td className={cn(td, "text-right font-medium tabular-nums text-slate-800")}>
                      {formatCurrency(row.currentBalance)}
                    </td>
                    <td className={cn(td, "text-center tabular-nums")}>{row.totalPendingSales}</td>
                    <td className={cn(td, "text-right tabular-nums text-slate-600")}>
                      {formatCurrency(row.totalInvoiced)}
                    </td>
                    <td className={cn(td, "text-right tabular-nums text-emerald-700")}>
                      {formatCurrency(row.totalPaid)}
                    </td>
                    <td className={cn(td, "text-right font-semibold tabular-nums text-rose-700")}>
                      {formatCurrency(row.totalRemaining)}
                    </td>
                    <td className={cn(td, "text-slate-600")}>
                      {formatPendingDate(row.oldestPendingDate)}
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => setFilterCustomerId(row.customerId)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View sales
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900">Pending sales</h2>
          <p className="text-xs text-slate-500">Invoices with amount still due</p>
        </header>
        {pendingPaymentsLoading && pendingSales.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </p>
        ) : pendingSales.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No pending sales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className={th}>Invoice</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Sale date</th>
                  <th className={cn(th, "text-right")}>Total</th>
                  <th className={cn(th, "text-right")}>Paid</th>
                  <th className={cn(th, "text-right")}>Due</th>
                  <th className={th}>Status</th>
                  <th className={cn(th, "text-center")}>Days out</th>
                  <th className={th}>Age</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingSales.map((row) => (
                  <tr key={row.saleId} className="bg-white hover:bg-slate-50/60">
                    <td className={cn(td, "font-mono font-medium text-slate-900")}>
                      {row.invoiceNumber}
                    </td>
                    <td className={td}>
                      <p className="text-slate-900">{row.customerName}</p>
                      <p className="text-xs text-slate-500">#{row.customerId}</p>
                    </td>
                    <td className={cn(td, "text-slate-600")}>{formatPendingDate(row.saleDate)}</td>
                    <td className={cn(td, "text-right tabular-nums")}>
                      {formatCurrency(row.totalAmount)}
                    </td>
                    <td className={cn(td, "text-right tabular-nums text-emerald-700")}>
                      {formatCurrency(row.paidAmount)}
                    </td>
                    <td className={cn(td, "text-right font-semibold tabular-nums text-rose-700")}>
                      {formatCurrency(row.remainingAmount)}
                    </td>
                    <td className={td}>
                      {row.paymentStatus ? (
                        <StatusBadge status={row.paymentStatus} variant="soft" size="sm" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cn(td, "text-center tabular-nums")}>{row.daysOutstanding}</td>
                    <td className={td}>
                      {row.paymentStatusAge ? (
                        <StatusBadge status={row.paymentStatusAge} variant="soft" size="sm" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => openPay(row)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SalePaymentModal
        open={paymentOpen}
        onClose={closePay}
        sale={paymentSale}
        onSuccess={onPaymentSuccess}
      />
    </div>
  );
}
