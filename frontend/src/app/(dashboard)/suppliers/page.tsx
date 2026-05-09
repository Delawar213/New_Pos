"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  clearSupplierState,
} from "@/store/slices/supplier/supplier.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersPage() {
  const dispatch = useAppDispatch();
  const { suppliers, loading, actionLoading, error, success, message, currentPage, pageSize, totalCount } =
    useAppSelector((state) => state.supplier);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<CreateSupplierRequest>({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    contactNo: "",
    email: "",
    address: "",
    city: "",
    postcode: "",
    vatNumber: "",
    creditDays: 30,
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchSuppliers({ pageNumber: 1, pageSize: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearSupplierState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearSupplierState());
    }
  }, [success, error, message, dispatch]);

  const resetForm = () => {
    setForm({
      supplierCode: "",
      supplierName: "",
      contactPerson: "",
      contactNo: "",
      email: "",
      address: "",
      city: "",
      postcode: "",
      vatNumber: "",
      creditDays: 30,
      isActive: true,
    });
    setEditingSupplier(null);
  };

  const handleSubmit = async () => {
    if (!form.supplierCode.trim() || !form.supplierName.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Supplier code and name are required",
          duration: 3000,
        })
      );
      return;
    }

    if (editingSupplier) {
      const payload: UpdateSupplierRequest = {
        supplierId: editingSupplier.supplierId,
        ...form,
      };
      const result = await dispatch(updateSupplier(payload));
      if (updateSupplier.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchSuppliers({ pageNumber: currentPage, pageSize }));
      }
      return;
    }

    const result = await dispatch(createSupplier(form));
    if (createSupplier.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchSuppliers({ pageNumber: currentPage, pageSize }));
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson || "",
      contactNo: supplier.contactNo || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      postcode: supplier.postcode || "",
      vatNumber: supplier.vatNumber || "",
      creditDays: supplier.creditDays,
      isActive: supplier.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    const result = await dispatch(deleteSupplier(supplierToDelete.supplierId));
    if (deleteSupplier.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
      dispatch(fetchSuppliers({ pageNumber: currentPage, pageSize }));
    }
  };

  const columns: Column<Supplier>[] = [
    { key: "supplierId", label: "#", className: "w-16" },
    { key: "supplierCode", label: "Code" },
    { key: "supplierName", label: "Name" },
    { key: "contactNo", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "currentBalance",
      label: "Balance",
      render: (item) => <span className="font-semibold">{formatCurrency(item.currentBalance || 0)}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">
            Edit
          </button>
          <button
            onClick={() => {
              setSupplierToDelete(item);
              setDeleteConfirmOpen(true);
            }}
            disabled={actionLoading}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

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
        data={suppliers}
        rowKey="supplierId"
        title="All Suppliers"
        totalCount={totalCount}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
        addLabel="Add Supplier"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
        description={editingSupplier ? "Update supplier details" : "Create a new supplier"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              disabled={actionLoading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={actionLoading || !form.supplierCode.trim() || !form.supplierName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : editingSupplier ? "Update Supplier" : "Save Supplier"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="supplier-code" className="mb-1 block text-sm font-medium text-gray-700">
              Supplier code <span className="text-red-500">*</span>
            </label>
            <input
              id="supplier-code"
              value={form.supplierCode}
              onChange={(e) => setForm({ ...form, supplierCode: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. SUP001"
            />
          </div>
          <div>
            <label htmlFor="supplier-name" className="mb-1 block text-sm font-medium text-gray-700">
              Supplier name <span className="text-red-500">*</span>
            </label>
            <input
              id="supplier-name"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Company name"
            />
          </div>
          <div>
            <label htmlFor="supplier-contact-person" className="mb-1 block text-sm font-medium text-gray-700">
              Contact person
            </label>
            <input
              id="supplier-contact-person"
              value={form.contactPerson || ""}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Name"
            />
          </div>
          <div>
            <label htmlFor="supplier-phone" className="mb-1 block text-sm font-medium text-gray-700">
              Contact number
            </label>
            <input
              id="supplier-phone"
              value={form.contactNo || ""}
              onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Phone"
            />
          </div>
          <div>
            <label htmlFor="supplier-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="supplier-email"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label htmlFor="supplier-city" className="mb-1 block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="supplier-city"
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="City"
            />
          </div>
          <div>
            <label htmlFor="supplier-postcode" className="mb-1 block text-sm font-medium text-gray-700">
              Postcode
            </label>
            <input
              id="supplier-postcode"
              value={form.postcode || ""}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Postcode"
            />
          </div>
          <div>
            <label htmlFor="supplier-vat" className="mb-1 block text-sm font-medium text-gray-700">
              VAT number
            </label>
            <input
              id="supplier-vat"
              value={form.vatNumber || ""}
              onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="VAT / tax ID"
            />
          </div>
          <div>
            <label htmlFor="supplier-credit-days" className="mb-1 block text-sm font-medium text-gray-700">
              Credit days
            </label>
            <input
              id="supplier-credit-days"
              type="number"
              value={form.creditDays}
              onChange={(e) => setForm({ ...form, creditDays: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="30"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                id="supplier-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              Active
            </label>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="supplier-address" className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="supplier-address"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="Street address"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSupplierToDelete(null);
        }}
        title="Delete Supplier"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">You are about to delete supplier:</p>
            <p className="text-base font-semibold text-slate-800 mb-4">&quot;{supplierToDelete?.supplierName}&quot;</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button onClick={handleDeleteConfirm} disabled={actionLoading} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {actionLoading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
