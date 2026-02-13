"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Category } from "@/types";

// Demo data - replace with useGetCategoriesQuery
const demoCategories: Category[] = [
  { id: 1, name: "Paints", description: "All types of paints", isActive: true, createdAt: "2026-01-15" },
  { id: 2, name: "Brushes", description: "Paint brushes and rollers", isActive: true, createdAt: "2026-01-16" },
  { id: 3, name: "Tools", description: "Painting tools", isActive: false, createdAt: "2026-01-17" },
];

const columns: Column<Category>[] = [
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

export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Categories" },
        ]}
      />

      <DataTable
        columns={columns}
        data={demoCategories}
        rowKey="id"
        title="All Categories"
        totalCount={demoCategories.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => setModalOpen(true)}
        addLabel="Add Category"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Category"
        description="Create a new product category"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Category
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Category name" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" rows={3} placeholder="Category description" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Parent Category</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">None (Top Level)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" defaultChecked className="rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
