"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Customer } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoCustomers: Customer[] = [
  {
    id: 1, name: "Ahmed Hassan", email: "ahmed@email.com", phone: "+971-50-1234567",
    city: "Dubai", country: "UAE", openingBalance: 0, currentBalance: 1200,
    loyaltyPoints: 150, isActive: true, createdAt: "2026-01-15",
  },
];

const columns: Column<Customer>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  {
    key: "currentBalance",
    label: "Balance",
    render: (item) => <span className="font-semibold">{formatCurrency(item.currentBalance)}</span>,
  },
  { key: "loyaltyPoints", label: "Points" },
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

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers" },
        ]}
      />
      <DataTable
        columns={columns}
        data={demoCustomers}
        rowKey="id"
        title="All Customers"
        totalCount={demoCustomers.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Customer"
      />
    </div>
  );
}
