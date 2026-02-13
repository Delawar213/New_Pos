"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { BankAccount } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoBankAccounts: BankAccount[] = [
  {
    id: 1, bankName: "Emirates NBD", accountNumber: "1234567890", accountHolder: "Company LLC",
    branch: "Dubai Main", openingBalance: 50000, currentBalance: 75000, isDefault: true,
    isActive: true, createdAt: "2026-01-15",
  },
];

const columns: Column<BankAccount>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "bankName", label: "Bank" },
  { key: "accountNumber", label: "Account #" },
  { key: "accountHolder", label: "Holder" },
  {
    key: "currentBalance",
    label: "Balance",
    render: (item) => <span className="font-semibold text-green-700">{formatCurrency(item.currentBalance)}</span>,
  },
  {
    key: "isDefault",
    label: "Default",
    render: (item) => item.isDefault ? <StatusBadge status="Active" /> : <span className="text-gray-400">-</span>,
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

export default function BankAccountsPage() {
  return (
    <div>
      <PageHeader
        title="Bank Accounts"
        description="Manage bank accounts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bank Accounts" },
        ]}
      />
      <DataTable columns={columns} data={demoBankAccounts} rowKey="id" title="All Bank Accounts"
        totalCount={demoBankAccounts.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="Add Bank Account" />
    </div>
  );
}
