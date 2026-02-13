"use client";

import React from "react";
import { PageHeader, DataTable, StatusBadge } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Brand } from "@/types";

const demoBrands: Brand[] = [
  { id: 1, name: "Jotun", description: "Premium paint brand", isActive: true, createdAt: "2026-01-15" },
  { id: 2, name: "National Paints", description: "Regional paint brand", isActive: true, createdAt: "2026-01-16" },
];

const columns: Column<Brand>[] = [
  { key: "id", label: "#", className: "w-16" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  {
    key: "isActive",
    label: "Status",
    render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
  },
  { key: "createdAt", label: "Created" },
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

export default function BrandsPage() {
  return (
    <div>
      <PageHeader
        title="Brands"
        description="Manage product brands"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Brands" },
        ]}
      />
      <DataTable
        columns={columns}
        data={demoBrands}
        rowKey="id"
        title="All Brands"
        totalCount={demoBrands.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {}}
        addLabel="Add Brand"
      />
    </div>
  );
}
