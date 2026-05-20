"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Calendar,
  Clock,
  DollarSign,
  Landmark,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  FileText,
  PackageX,
} from "lucide-react";
import { StatsCard, StatusBadge } from "@/components/ui";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboardSummary } from "@/store/slices/dashboard/dashboard.slice";

const quickActions = [
  { label: "POS", icon: ShoppingBag, href: "/pos", color: "from-blue-500 to-violet-500" },
  { label: "Products", icon: Package, href: "/products", color: "from-emerald-500 to-teal-500" },
  { label: "Purchases", icon: ShoppingCart, href: "/purchases", color: "from-amber-500 to-orange-500" },
  { label: "Customers", icon: Users, href: "/customers", color: "from-pink-500 to-rose-500" },
];

function formatTxDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MonthBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold tabular-nums text-slate-800">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, loading, error } = useAppSelector((s) => s.dashboard);

  const refresh = () => void dispatch(fetchDashboardSummary());

  useEffect(() => {
    refresh();
  }, [dispatch]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  const s = summary;
  const monthMax = s
    ? Math.max(s.monthSales, s.monthPurchases, s.monthExpenses, 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-500/20 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Store overview</h1>
            <p className="mt-2 text-sm text-slate-400">
              Live figures from your dashboard summary API.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                    action.color
                  )}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold text-rose-700 underline hover:text-rose-900"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading && !s ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : null}

      {s ? (
        <>
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Today</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Sales"
                value={formatCurrency(s.todaySales)}
                icon={DollarSign}
                color="green"
                variant="gradient"
              />
              <StatsCard
                title="Purchases"
                value={formatCurrency(s.todayPurchases)}
                icon={ShoppingCart}
                color="amber"
              />
              <StatsCard
                title="Expenses"
                value={formatCurrency(s.todayExpenses)}
                icon={TrendingDown}
                color="rose"
              />
              <StatsCard
                title="Profit"
                value={formatCurrency(s.todayProfit)}
                icon={Target}
                color={s.todayProfit >= 0 ? "cyan" : "red"}
                variant="gradient"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">This month</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Sales"
                value={formatCurrency(s.monthSales)}
                icon={TrendingUp}
                color="blue"
                variant="gradient"
              />
              <StatsCard
                title="Purchases"
                value={formatCurrency(s.monthPurchases)}
                icon={ShoppingCart}
                color="indigo"
              />
              <StatsCard
                title="Expenses"
                value={formatCurrency(s.monthExpenses)}
                icon={TrendingDown}
                color="rose"
              />
              <StatsCard
                title="Profit"
                value={formatCurrency(s.monthProfit)}
                icon={Target}
                color={s.monthProfit >= 0 ? "green" : "red"}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Cash & balances
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Cash in hand"
                value={formatCurrency(s.cashInHand)}
                icon={Banknote}
                color="green"
              />
              <StatsCard
                title="Bank balance"
                value={formatCurrency(s.bankBalance)}
                icon={Landmark}
                color="blue"
              />
              <StatsCard
                title="Receivables"
                value={formatCurrency(s.totalReceivables)}
                icon={Wallet}
                color="purple"
              />
              <StatsCard
                title="Payables"
                value={formatCurrency(s.totalPayables)}
                icon={FileText}
                color="amber"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Alerts & pending
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/products" className="block">
                <StatsCard
                  title="Low stock"
                  value={formatNumber(s.lowStockProducts)}
                  icon={AlertTriangle}
                  color="amber"
                />
              </Link>
              <Link href="/products" className="block">
                <StatsCard
                  title="Out of stock"
                  value={formatNumber(s.outOfStockProducts)}
                  icon={PackageX}
                  color="red"
                />
              </Link>
              <Link href="/customers/pending-payments" className="block">
                <StatsCard
                  title="Pending sales"
                  value={formatNumber(s.pendingSalesInvoices)}
                  icon={ShoppingBag}
                  color="blue"
                />
              </Link>
              <Link href="/purchases" className="block">
                <StatsCard
                  title="Pending purchases"
                  value={formatNumber(s.pendingPurchaseInvoices)}
                  icon={ShoppingCart}
                  color="indigo"
                />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Month breakdown */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-1">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
                <h3 className="text-lg font-bold text-slate-800">Month breakdown</h3>
                <p className="text-sm text-slate-500">Sales, purchases & expenses</p>
              </div>
              <div className="space-y-4 p-5">
                <MonthBar
                  label="Sales"
                  value={s.monthSales}
                  max={monthMax}
                  color="bg-gradient-to-r from-emerald-500 to-teal-500"
                />
                <MonthBar
                  label="Purchases"
                  value={s.monthPurchases}
                  max={monthMax}
                  color="bg-gradient-to-r from-amber-500 to-orange-500"
                />
                <MonthBar
                  label="Expenses"
                  value={s.monthExpenses}
                  max={monthMax}
                  color="bg-gradient-to-r from-rose-500 to-pink-500"
                />
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Net profit (month)</p>
                  <p
                    className={cn(
                      "mt-1 text-xl font-black tabular-nums",
                      s.monthProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}
                  >
                    {formatCurrency(s.monthProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Top products */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Top selling products</h3>
                  <p className="text-sm text-slate-500">By revenue this period</p>
                </div>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                {s.topSellingProducts.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">No sales data yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3 text-right">Revenue</th>
                        <th className="px-5 py-3 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.topSellingProducts.map((p, i) => (
                        <tr
                          key={p.productId}
                          className={cn(
                            "border-b border-slate-50",
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          )}
                        >
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{p.productName}</p>
                            <p className="text-xs text-slate-500">{p.productCode}</p>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-700">
                            {formatNumber(p.totalQuantitySold)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-800">
                            {formatCurrency(p.totalRevenue)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-semibold text-emerald-700">
                            {formatCurrency(p.totalProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Recent transactions</h3>
                <p className="text-sm text-slate-500">Latest journal activity</p>
              </div>
              <Link
                href="/transactions"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02]"
              >
                View ledger
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {s.recentTransactions.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No recent transactions.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Code
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Title
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.recentTransactions.map((tx, index) => (
                      <tr
                        key={tx.transactionId}
                        className={cn(
                          "border-b border-slate-50 transition-colors hover:bg-blue-50/50",
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                        )}
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <Link
                            href="/transactions"
                            className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {tx.transactionCode}
                          </Link>
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 font-medium text-slate-700">
                          {tx.title}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="text-base font-bold tabular-nums text-slate-800">
                            {tx.amount > 0 ? formatCurrency(tx.amount) : "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={tx.status} showIcon size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="h-4 w-4 shrink-0" />
                            {formatTxDate(tx.transactionDate)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/customer-payments"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-slate-700">Receive customer payment</span>
              <ArrowUpRight className="h-4 w-4 text-indigo-500" />
            </Link>
            <Link
              href="/supplier-payments"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-slate-700">Pay supplier</span>
              <ArrowUpRight className="h-4 w-4 text-indigo-500" />
            </Link>
            <Link
              href="/bank-accounts"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-slate-700">Bank accounts</span>
              <ArrowUpRight className="h-4 w-4 text-indigo-500" />
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
