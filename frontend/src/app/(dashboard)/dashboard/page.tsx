"use client";

// ============================================
// Dashboard Page - Main Overview
// ============================================

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock,
} from "lucide-react";
import { StatsCard, PageHeader } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";

// Demo data — will be replaced with RTK Query hooks
const stats = {
  totalSales: 125840,
  totalPurchases: 89200,
  totalExpenses: 12500,
  totalProfit: 24140,
  totalCustomers: 342,
  totalProducts: 1250,
  totalSuppliers: 48,
  lowStockProducts: 12,
  todaySales: 4580,
  todayPurchases: 2100,
  monthlySales: 45200,
  monthlyPurchases: 32100,
};

const recentSales = [
  { id: 1, invoice: "INV-001234", customer: "Walk-in Customer", amount: 450.00, status: "Completed", date: "2026-02-13" },
  { id: 2, invoice: "INV-001233", customer: "Ahmed Hassan", amount: 1250.50, status: "Completed", date: "2026-02-13" },
  { id: 3, invoice: "INV-001232", customer: "Sara Ali", amount: 320.00, status: "Pending", date: "2026-02-12" },
  { id: 4, invoice: "INV-001231", customer: "Mohammed Khan", amount: 890.75, status: "Completed", date: "2026-02-12" },
  { id: 5, invoice: "INV-001230", customer: "Fatima Noor", amount: 2100.00, status: "Completed", date: "2026-02-11" },
];

const topProducts = [
  { name: "Premium Wall Paint - White", sold: 245, revenue: 12250 },
  { name: "Wood Finish Varnish", sold: 189, revenue: 9450 },
  { name: "Interior Satin Paint", sold: 156, revenue: 7800 },
  { name: "Exterior Weather Coat", sold: 134, revenue: 8040 },
  { name: "Metal Primer Grey", sold: 98, revenue: 4900 },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your business performance"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          change={12.5}
          changeLabel="vs yesterday"
          color="green"
        />
        <StatsCard
          title="Total Sales (Monthly)"
          value={formatCurrency(stats.monthlySales)}
          icon={ShoppingBag}
          change={8.3}
          color="blue"
        />
        <StatsCard
          title="Total Purchases (Monthly)"
          value={formatCurrency(stats.monthlyPurchases)}
          icon={ShoppingCart}
          change={-2.1}
          color="purple"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
          change={15.2}
          color="green"
        />
      </div>

      {/* Second row stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          icon={Package}
          color="indigo"
        />
        <StatsCard
          title="Total Customers"
          value={formatNumber(stats.totalCustomers)}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={ArrowDownRight}
          change={-5.4}
          color="red"
        />
        <StatsCard
          title="Low Stock Alert"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="yellow"
        />
      </div>

      {/* Charts & Tables */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart Placeholder */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sales Overview</h3>
              <p className="text-xs text-gray-500">Monthly sales performance</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                This Month
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                Last Month
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                This Year
              </button>
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">
                Chart will render here when connected to API
              </p>
              <p className="text-xs text-gray-300">
                Integrate with recharts or chart.js
              </p>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900">Top Selling Products</h3>
          <p className="text-xs text-gray-500">By quantity sold this month</p>

          <div className="mt-4 space-y-3">
            {topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-gray-400">{product.sold} sold</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recent Sales</h3>
            <p className="text-xs text-gray-500">Latest transactions</p>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Invoice
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/80">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-600">
                    {sale.invoice}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-700">
                    {sale.customer}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-gray-900">
                    {formatCurrency(sale.amount)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        sale.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {sale.date}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
