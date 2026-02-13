"use client";

import React from "react";
import { PageHeader } from "@/components/ui";
import { BarChart3, TrendingUp, FileText, Users, Package, Truck, DollarSign } from "lucide-react";
import Link from "next/link";

const reportGroups = [
  {
    title: "General Reports",
    items: [
      { label: "Sales Summary", href: "/reports/general", icon: BarChart3 },
      { label: "Purchase Summary", href: "/reports/general", icon: FileText },
      { label: "Profit & Loss", href: "/reports/profit-loss", icon: TrendingUp },
    ],
  },
  {
    title: "Purchase Reports",
    items: [
      { label: "Purchase by Supplier", href: "/reports/purchases", icon: Truck },
      { label: "Purchase by Product", href: "/reports/purchases", icon: Package },
    ],
  },
  {
    title: "Customer Reports",
    items: [
      { label: "Customer Ledger", href: "/reports/customers", icon: Users },
      { label: "Customer Due", href: "/reports/customers", icon: DollarSign },
    ],
  },
  {
    title: "Stock Reports",
    items: [
      { label: "Stock Summary", href: "/reports/stock", icon: Package },
      { label: "Low Stock Alert", href: "/reports/stock", icon: Package },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and view business reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reportGroups.map((group) => (
          <div key={group.title} className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-base font-semibold text-gray-900">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
