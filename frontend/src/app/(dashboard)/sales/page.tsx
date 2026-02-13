"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Sale } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoSales: Sale[] = [
  {
    id: 1, invoiceNo: "INV-001234", customerId: 1, customerName: "Ahmed Hassan",
    saleDate: "2026-02-13", status: "completed", subtotal: 1200, taxAmount: 60,
    discountAmount: 0, grandTotal: 1260, paidAmount: 1260, dueAmount: 0, changeAmount: 0,
    paymentMethod: "cash", items: [], createdBy: "Admin", createdAt: "2026-02-13",
  },
];

const columns: Column<Sale>[] = [
  { key: "invoiceNo", label: "Invoice" },
  { key: "customerName", label: "Customer" },
  { key: "saleDate", label: "Date" },
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
        <button className="text-xs text-green-600 hover:text-green-800">Print</button>
      </div>
    ),
  },
];

export default function SalesPage() {
  return (
    <div>
      <PageHeader
        title="Sales"
        description="Manage sales and invoices"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sales" },
        ]}
      />
      <DataTable columns={columns} data={demoSales} rowKey="id" title="All Sales"
        totalCount={demoSales.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="New Sale" onFilter={() => {}} onExport={() => {}} />
    </div>
  );
}
