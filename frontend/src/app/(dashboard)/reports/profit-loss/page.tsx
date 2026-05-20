"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Receipt,
  Percent,
  ShoppingBag,
} from "lucide-react";
import { PageHeader, StatsCard, StatusBadge } from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearProfitReport,
  fetchProfitByRange,
} from "@/store/slices/dashboard/dashboard.slice";
import {
  dateInputToIso,
  startOfMonthInputDate,
  todayInputDate,
} from "@/lib/transactionDate";

const th =
  "whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
const td = "whitespace-nowrap px-3 py-2.5 text-sm tabular-nums";

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function profitClass(amount: number): string {
  if (amount > 0) return "text-emerald-700 font-semibold";
  if (amount < 0) return "text-rose-700 font-semibold";
  return "text-slate-600";
}

export default function ProfitLossReportPage() {
  const dispatch = useAppDispatch();
  const { profitReport, profitLoading, profitError } = useAppSelector((s) => s.dashboard);
  const [fromDate, setFromDate] = useState(startOfMonthInputDate);
  const [toDate, setToDate] = useState(todayInputDate);

  const loadReport = useCallback(() => {
    void dispatch(
      fetchProfitByRange({
        fromDate: dateInputToIso(fromDate, false),
        toDate: dateInputToIso(toDate, true),
      })
    );
  }, [dispatch, fromDate, toDate]);

  useEffect(() => {
    loadReport();
    return () => {
      dispatch(clearProfitReport());
    };
  }, [dispatch, loadReport]);

  const invoices = profitReport?.invoices ?? [];
  const negativeCount = useMemo(
    () => invoices.filter((r) => r.profitAmount < 0).length,
    [invoices]
  );

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>

      <PageHeader
        title="Profit & Loss"
        description="Sales profit by date range — revenue, cost, and margin per invoice"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports", href: "/reports" },
          { label: "Profit & Loss" },
        ]}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label htmlFor="profit-from" className="mb-1 block text-xs font-semibold text-slate-600">
            From date
          </label>
          <input
            id="profit-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="profit-to" className="mb-1 block text-xs font-semibold text-slate-600">
            To date
          </label>
          <input
            id="profit-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900"
          />
        </div>
        <button
          type="button"
          onClick={loadReport}
          disabled={profitLoading || !fromDate || !toDate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {profitLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Load report
        </button>
      </div>

      {profitError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {profitError}
        </div>
      )}

      {profitLoading && !profitReport ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading profit report…
        </div>
      ) : profitReport ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total sales"
              value={profitReport.totalSales}
              icon={ShoppingBag}
              color="blue"
            />
            <StatsCard
              title="Total revenue"
              value={formatCurrency(profitReport.totalRevenue)}
              icon={Receipt}
              color="indigo"
            />
            <StatsCard
              title="Total cost"
              value={formatCurrency(profitReport.totalCost)}
              icon={TrendingDown}
              color="amber"
            />
            <StatsCard
              title="Total profit"
              value={formatCurrency(profitReport.totalProfit)}
              icon={TrendingUp}
              color={profitReport.totalProfit >= 0 ? "green" : "red"}
            />
            <StatsCard
              title="Profit margin"
              value={formatPct(profitReport.profitPercentage)}
              icon={Percent}
              color={profitReport.profitPercentage >= 0 ? "green" : "red"}
            />
          </div>

          {negativeCount > 0 && (
            <p className="text-sm text-amber-800">
              {negativeCount} invoice{negativeCount === 1 ? "" : "s"} with negative profit in this
              period.
            </p>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                Invoices ({invoices.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={th}>Invoice</th>
                    <th className={th}>Date</th>
                    <th className={th}>Customer</th>
                    <th className={cn(th, "text-right")}>Items</th>
                    <th className={cn(th, "text-right")}>Net (ex VAT)</th>
                    <th className={cn(th, "text-right")}>VAT</th>
                    <th className={cn(th, "text-right")}>Total (inc VAT)</th>
                    <th className={cn(th, "text-right")}>Cost</th>
                    <th className={cn(th, "text-right")}>Profit</th>
                    <th className={cn(th, "text-right")}>Margin</th>
                    <th className={th}>Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-slate-500">
                        No sales in this date range.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((row) => (
                      <tr key={row.saleId} className="hover:bg-slate-50/80">
                        <td className={cn(td, "font-medium text-slate-900")}>
                          <Link
                            href={`/sales/edit?saleId=${row.saleId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {row.invoiceNumber || `#${row.saleId}`}
                          </Link>
                        </td>
                        <td className={cn(td, "text-slate-600")}>
                          {formatDate(row.saleDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className={cn(td, "max-w-[12rem] truncate text-slate-800")}>
                          {row.customerName || "—"}
                        </td>
                        <td className={cn(td, "text-right")}>{row.totalItems}</td>
                        <td className={cn(td, "text-right")}>
                          {formatCurrency(row.netAmountExVat)}
                        </td>
                        <td className={cn(td, "text-right")}>{formatCurrency(row.totalVat)}</td>
                        <td className={cn(td, "text-right font-medium")}>
                          {formatCurrency(row.totalAmountIncVat)}
                        </td>
                        <td className={cn(td, "text-right text-slate-600")}>
                          {formatCurrency(row.totalCost)}
                        </td>
                        <td className={cn(td, "text-right", profitClass(row.profitAmount))}>
                          {formatCurrency(row.profitAmount)}
                        </td>
                        <td className={cn(td, "text-right", profitClass(row.profitAmount))}>
                          {formatPct(row.profitPercentage)}
                        </td>
                        <td className={td}>
                          <StatusBadge
                            status={row.paymentStatus}
                            variant="soft"
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
