"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { ExpenseCategory } from "@/types";

const demoData: ExpenseCategory[] = [
  { id: 1, name: "Rent", description: "Office and warehouse rent", isActive: true, createdAt: "2026-01-15" },
  { id: 2, name: "Utilities", description: "Electricity, water, internet", isActive: true, createdAt: "2026-01-16" },
  { id: 3, name: "Salaries", description: "Employee salaries", isActive: true, createdAt: "2026-01-17" },
];

const columns: Column<ExpenseCategory>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
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

export default function ExpenseCategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Expense Categories"
        description="Manage expense categories"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Expense Categories" },
        ]}
      />
      <DataTable columns={columns} data={demoData} rowKey="id" title="All Expense Categories"
        totalCount={demoData.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="Add Category" />
    </div>
  );
}
