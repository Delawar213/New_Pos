"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Supplier } from "@/types";
import { formatCurrency } from "@/lib/utils";

const demoSuppliers: Supplier[] = [
  {
    id: 1, name: "Paint Supplies LLC", email: "info@paintsupplies.com", phone: "+971-50-1234567",
    companyName: "Paint Supplies LLC", city: "Dubai", country: "UAE",
    openingBalance: 0, currentBalance: 5000, isActive: true, createdAt: "2026-01-15",
  },
];

const columns: Column<Supplier>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "name", label: "Name" },
  { key: "companyName", label: "Company" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  {
    key: "currentBalance",
    label: "Balance",
    render: (item) => <span className="font-semibold">{formatCurrency(item.currentBalance)}</span>,
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

export default function SuppliersPage() {
  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Suppliers" },
        ]}
      />
      <DataTable
        columns={columns}
        data={demoSuppliers}
        rowKey="id"
        title="All Suppliers"
        totalCount={demoSuppliers.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Supplier"
      />
    </div>
  );
}
