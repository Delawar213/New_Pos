"use client";

// ============================================
// Dashboard Page - Modern Overview Design
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
  Activity,
  Zap,
  Target,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { StatsCard, PageHeader, StatusBadge } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  { id: 1, invoice: "INV-001234", customer: "Walk-in Customer", amount: 450.00, status: "Completed", date: "2 mins ago", avatar: "W" },
  { id: 2, invoice: "INV-001233", customer: "Ahmed Hassan", amount: 1250.50, status: "Completed", date: "15 mins ago", avatar: "A" },
  { id: 3, invoice: "INV-001232", customer: "Sara Ali", amount: 320.00, status: "Pending", date: "1 hour ago", avatar: "S" },
  { id: 4, invoice: "INV-001231", customer: "Mohammed Khan", amount: 890.75, status: "Completed", date: "2 hours ago", avatar: "M" },
  { id: 5, invoice: "INV-001230", customer: "Fatima Noor", amount: 2100.00, status: "Completed", date: "3 hours ago", avatar: "F" },
];

const topProducts = [
  { name: "Premium Wall Paint - White", sold: 245, revenue: 12250, trend: 12 },
  { name: "Wood Finish Varnish", sold: 189, revenue: 9450, trend: 8 },
  { name: "Interior Satin Paint", sold: 156, revenue: 7800, trend: -3 },
  { name: "Exterior Weather Coat", sold: 134, revenue: 8040, trend: 15 },
  { name: "Metal Primer Grey", sold: 98, revenue: 4900, trend: 5 },
];

const quickActions = [
  { label: "New Sale", icon: ShoppingBag, href: "/pos", color: "from-blue-500 to-violet-500" },
  { label: "Add Product", icon: Package, href: "/products", color: "from-emerald-500 to-teal-500" },
  { label: "New Purchase", icon: ShoppingCart, href: "/purchases", color: "from-amber-500 to-orange-500" },
  { label: "Add Customer", icon: Users, href: "/customers", color: "from-pink-500 to-rose-500" },
];

export default function DashboardPage() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        {/* Background decoration */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-500/20 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-blue-500/30 blur-2xl" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome back, Admin!</h1>
            <p className="mt-2 text-sm text-slate-400">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                  action.color
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          change={12.5}
          changeLabel="vs yesterday"
          color="green"
          variant="gradient"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlySales)}
          icon={TrendingUp}
          change={8.3}
          color="blue"
          variant="gradient"
        />
        <StatsCard
          title="Total Orders"
          value={formatNumber(stats.totalCustomers)}
          icon={ShoppingBag}
          change={15.2}
          color="purple"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={Target}
          change={18.7}
          color="cyan"
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          icon={Package}
          color="indigo"
        />
        <StatsCard
          title="Active Customers"
          value={formatNumber(stats.totalCustomers)}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Monthly Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={ArrowDownRight}
          change={-5.4}
          color="rose"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart Placeholder */}
        <div className="col-span-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sales Analytics</h3>
              <p className="text-sm text-slate-500">Revenue performance over time</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25">
                This Month
              </button>
              <button className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Last Month
              </button>
              <button className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                This Year
              </button>
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="p-5">
            <div className="flex h-72 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-dashed border-slate-200">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-xl shadow-blue-500/25">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Sales chart will appear here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Integrate with Recharts or Chart.js for visualization
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Top Products</h3>
              <p className="text-sm text-slate-500">Best sellers this month</p>
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {topProducts.map((product, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-sm",
                  i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" :
                  i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white" :
                  i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">{product.sold} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">
                    {formatCurrency(product.revenue)}
                  </p>
                  <div className={cn(
                    "flex items-center justify-end gap-0.5 text-[10px] font-semibold",
                    product.trend >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {product.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(product.trend)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 p-4">
            <a 
              href="/products" 
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
            >
              View All Products
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
            <p className="text-sm text-slate-500">Latest sales activity</p>
          </div>
          <a 
            href="/sales"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale, index) => (
                <tr 
                  key={sale.id} 
                  className={cn(
                    "border-b border-slate-50 transition-colors hover:bg-blue-50/50",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                      {sale.invoice}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-xs font-bold text-white">
                        {sale.avatar}
                      </div>
                      <span className="font-medium text-slate-700">{sale.customer}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="text-base font-bold text-slate-800">
                      {formatCurrency(sale.amount)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <StatusBadge status={sale.status} showIcon size="sm" />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      {sale.date}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Live Activity */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Live Activity</h3>
                <p className="text-sm text-slate-500">Real-time store updates</p>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="p-5 space-y-4">
            {[
              { text: "New sale completed", time: "Just now", icon: ShoppingBag, color: "text-blue-500" },
              { text: "Stock updated for 5 items", time: "5 mins ago", icon: Package, color: "text-violet-500" },
              { text: "New customer registered", time: "12 mins ago", icon: Users, color: "text-emerald-500" },
              { text: "Purchase order received", time: "1 hour ago", icon: ShoppingCart, color: "text-amber-500" },
            ].map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className={cn("rounded-xl bg-slate-100 p-2.5", activity.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{activity.text}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Quick Stats</h3>
                <p className="text-sm text-slate-500">Performance overview</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Conversion Rate", value: "68%", progress: 68, color: "from-blue-500 to-violet-500" },
              { label: "Customer Satisfaction", value: "92%", progress: 92, color: "from-emerald-500 to-teal-500" },
              { label: "Inventory Turnover", value: "45%", progress: 45, color: "from-amber-500 to-orange-500" },
              { label: "Return Rate", value: "8%", progress: 8, color: "from-rose-500 to-pink-500" },
            ].map((metric, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">{metric.label}</span>
                  <span className="text-sm font-bold text-slate-800">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all", metric.color)}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
