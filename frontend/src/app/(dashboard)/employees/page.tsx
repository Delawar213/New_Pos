"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Employee } from "@/types";

const demoEmployees: Employee[] = [
  {
    id: 1, fullName: "Admin User", email: "admin@pos.com", phone: "+971-50-1234567",
    role: "Admin", salary: 8000, joiningDate: "2025-01-01", isActive: true, createdAt: "2025-01-01",
  },
];

const columns: Column<Employee>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "fullName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role" },
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

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employees and roles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employees" },
        ]}
      />
      <DataTable columns={columns} data={demoEmployees} rowKey="id" title="All Employees"
        totalCount={demoEmployees.length} onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}} addLabel="Add Employee" />
    </div>
  );
}
