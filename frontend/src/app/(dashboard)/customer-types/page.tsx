"use client";

import React, { useEffect, useState } from "react";
import { DataTable, Modal, PageHeader, StatusBadge } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCustomerState,
  createCustomerType,
  fetchCustomerTypes,
} from "@/store/slices/customer/customer.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { CreateCustomerTypeRequest, CustomerType } from "@/types/customer";

export default function CustomerTypesPage() {
  const dispatch = useAppDispatch();
  const { customerTypes, loading, actionLoading, success, message, error } = useAppSelector(
    (state) => state.customer
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateCustomerTypeRequest>({
    typeName: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearCustomerState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearCustomerState());
    }
  }, [success, message, error, dispatch]);

  const resetForm = () => {
    setForm({
      typeName: "",
      description: "",
      isActive: true,
    });
  };

  const handleClose = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.typeName.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Type name is required",
          duration: 3000,
        })
      );
      return;
    }

    const payload = {
      typeName: form.typeName.trim(),
      description: form.description || "",
      isActive: form.isActive,
    };

    const result = await dispatch(createCustomerType(payload));

    if (createCustomerType.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchCustomerTypes());
    }
  };

  const columns: Column<CustomerType>[] = [
    { key: "customerTypeId", label: "#", className: "w-16" },
    { key: "typeName", label: "Type Name" },
    { key: "description", label: "Description" },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customer Types"
        description="Manage customer type rules"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customer Types" },
        ]}
      />

      <DataTable
        columns={columns}
        data={customerTypes}
        rowKey="customerTypeId"
        title="All Customer Types"
        totalCount={customerTypes.length}
        onSearch={(term) => console.log("Search:", term)}
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title="Add Customer Type"
        description="Create a new customer type"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={actionLoading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={actionLoading || !form.typeName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Type"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.typeName}
              onChange={(e) => setForm({ ...form, typeName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Registered"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Registered customers - credit allowed"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
