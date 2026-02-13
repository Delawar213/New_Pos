"use client";

// ============================================
// Products Page - Modern Product Management
// ============================================

import React from "react";
import { Package, Edit2, Trash2, Eye, MoreHorizontal, TrendingUp, AlertTriangle, Archive } from "lucide-react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const demoProducts: Product[] = [
  {
    id: 1, name: "Premium Wall Paint - White", sku: "PWP-001", barcode: "1234567890", categoryId: 1,
    categoryName: "Paints", brandId: 1, brandName: "Jotun", costPrice: 35, sellingPrice: 50,
    quantity: 120, alertQuantity: 20, taxPercentage: 5, unit: "pcs", isActive: true, createdAt: "2026-01-15",
  },
  {
    id: 2, name: "Wood Finish Varnish", sku: "WFV-002", categoryId: 1, categoryName: "Paints",
    brandId: 2, brandName: "National Paints", costPrice: 25, sellingPrice: 40, quantity: 8,
    alertQuantity: 15, taxPercentage: 5, unit: "pcs", isActive: true, createdAt: "2026-01-16",
  },
  {
    id: 3, name: "Interior Satin Paint", sku: "ISP-003", categoryId: 1, categoryName: "Paints",
    brandId: 1, brandName: "Jotun", costPrice: 40, sellingPrice: 55, quantity: 65,
    alertQuantity: 20, taxPercentage: 5, unit: "pcs", isActive: true, createdAt: "2026-01-17",
  },
  {
    id: 4, name: "Exterior Weather Coat", sku: "EWC-004", categoryId: 1, categoryName: "Paints",
    brandId: 3, brandName: "Hempel", costPrice: 45, sellingPrice: 60, quantity: 45,
    alertQuantity: 15, taxPercentage: 5, unit: "pcs", isActive: true, createdAt: "2026-01-18",
  },
  {
    id: 5, name: "Metal Primer Grey", sku: "MPG-005", categoryId: 2, categoryName: "Primer",
    brandId: 2, brandName: "National Paints", costPrice: 22, sellingPrice: 35, quantity: 90,
    alertQuantity: 25, taxPercentage: 5, unit: "pcs", isActive: false, createdAt: "2026-01-19",
  },
];

const columns: Column<Product>[] = [
  {
    key: "name",
    label: "Product",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-xs text-slate-400">{item.sku}</p>
        </div>
      </div>
    ),
  },
  {
    key: "categoryName",
    label: "Category",
    render: (item) => (
      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {item.categoryName}
      </span>
    ),
  },
  {
    key: "brandName",
    label: "Brand",
    render: (item) => (
      <span className="text-sm text-slate-600">{item.brandName}</span>
    ),
  },
  {
    key: "costPrice",
    label: "Cost",
    render: (item) => (
      <span className="text-sm text-slate-500">{formatCurrency(item.costPrice)}</span>
    ),
  },
  {
    key: "sellingPrice",
    label: "Price",
    render: (item) => (
      <span className="text-sm font-bold text-slate-800">{formatCurrency(item.sellingPrice)}</span>
    ),
  },
  {
    key: "quantity",
    label: "Stock",
    render: (item) => {
      const isLow = item.quantity <= item.alertQuantity;
      return (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-semibold",
            isLow ? "text-rose-600" : "text-slate-700"
          )}>
            {item.quantity}
          </span>
          {isLow && (
            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
              <AlertTriangle className="h-3 w-3" />
              Low
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "isActive",
    label: "Status",
    render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} size="sm" />,
  },
  {
    key: "actions",
    label: "",
    className: "w-20",
    render: () => (
      <div className="flex items-center justify-end gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <Eye className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
  },
];

// Quick stats
const stats = [
  { label: "Total Products", value: "1,250", icon: Package, color: "from-blue-500 to-violet-500" },
  { label: "Low Stock", value: "12", icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
  { label: "Out of Stock", value: "3", icon: Archive, color: "from-rose-500 to-pink-500" },
  { label: "Top Seller", value: "+15%", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
];

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product inventory and stock levels"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products" },
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                stat.color
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={demoProducts}
        rowKey="id"
        title="All Products"
        description="View and manage your complete product catalog"
        totalCount={demoProducts.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Product"
        onExport={() => {}}
        onFilter={() => {}}
        onRefresh={() => {}}
      />
    </div>
  );
}
