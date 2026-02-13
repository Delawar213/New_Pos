"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

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
];

const columns: Column<Product>[] = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Product Name" },
  { key: "categoryName", label: "Category" },
  { key: "brandName", label: "Brand" },
  {
    key: "costPrice",
    label: "Cost",
    render: (item) => <span>{formatCurrency(item.costPrice)}</span>,
  },
  {
    key: "sellingPrice",
    label: "Price",
    render: (item) => <span className="font-semibold">{formatCurrency(item.sellingPrice)}</span>,
  },
  {
    key: "quantity",
    label: "Stock",
    render: (item) => (
      <span className={item.quantity <= item.alertQuantity ? "font-semibold text-red-600" : "text-gray-700"}>
        {item.quantity}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product inventory"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products" },
        ]}
      />
      <DataTable
        columns={columns}
        data={demoProducts}
        rowKey="id"
        title="All Products"
        totalCount={demoProducts.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Product"
        onExport={() => {}}
        onFilter={() => {}}
      />
    </div>
  );
}
