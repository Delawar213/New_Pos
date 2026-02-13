"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Purchase } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoPurchases: Purchase[] = [
  {
    id: 1, referenceNo: "PO-001", supplierId: 1, supplierName: "Paint Supplies LLC",
    purchaseDate: "2026-02-10", status: "received", subtotal: 5000, taxAmount: 250,
    discountAmount: 0, shippingCost: 100, grandTotal: 5350, paidAmount: 5350, dueAmount: 0,
    paymentMethod: "bank", items: [], createdAt: "2026-02-10",
  },
];

const columns: Column<Purchase>[] = [
  { key: "referenceNo", label: "Reference" },
  { key: "supplierName", label: "Supplier" },
  { key: "purchaseDate", label: "Date" },
  {
    key: "grandTotal",
    label: "Total",
    render: (item) => <span className="font-semibold">{formatCurrency(item.grandTotal)}</span>,
  },
  {
    key: "paidAmount",
    label: "Paid",
    render: (item) => <span>{formatCurrency(item.paidAmount)}</span>,
  },
  {
    key: "dueAmount",
    label: "Due",
    render: (item) => (
      <span className={item.dueAmount > 0 ? "font-semibold text-red-600" : "text-gray-500"}>
        {formatCurrency(item.dueAmount)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
        <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

export default function PurchasesPage() {
  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Manage purchase orders"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Purchases" },
        ]}
      />
      <DataTable columns={columns} data={demoPurchases} rowKey="id" title="All Purchases"
        totalCount={demoPurchases.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="Add Purchase" onFilter={() => {}} onExport={() => {}} />
    </div>
  );
}
