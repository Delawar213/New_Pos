"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoData: Transaction[] = [
  {
    id: 1, type: "income", amount: 5000, paymentMethod: "cash", referenceNo: "TRX-001",
    description: "Product sales", date: "2026-02-13", createdBy: "Admin", createdAt: "2026-02-13",
  },
  {
    id: 2, type: "expense", amount: 1200, paymentMethod: "bank", bankAccountId: 1,
    bankAccountName: "Emirates NBD", expenseCategoryId: 1, expenseCategoryName: "Rent",
    referenceNo: "TRX-002", description: "Office rent Feb", date: "2026-02-01", createdBy: "Admin",
    createdAt: "2026-02-01",
  },
];

const columns: Column<Transaction>[] = [
  { key: "referenceNo", label: "Reference" },
  {
    key: "type",
    label: "Type",
    render: (item) => <StatusBadge status={item.type} />,
  },
  {
    key: "amount",
    label: "Amount",
    render: (item) => (
      <span className={`font-semibold ${item.type === "income" ? "text-green-700" : "text-red-700"}`}>
        {item.type === "expense" ? "-" : "+"}{formatCurrency(item.amount)}
      </span>
    ),
  },
  { key: "paymentMethod", label: "Method", render: (item) => <span className="capitalize">{item.paymentMethod}</span> },
  { key: "description", label: "Description" },
  { key: "date", label: "Date" },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
      </div>
    ),
  },
];

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Track income, expenses, and transfers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions" },
        ]}
      />
      <DataTable columns={columns} data={demoData} rowKey="id" title="All Transactions"
        totalCount={demoData.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="Add Transaction" onFilter={() => {}} onExport={() => {}} />
    </div>
  );
}
