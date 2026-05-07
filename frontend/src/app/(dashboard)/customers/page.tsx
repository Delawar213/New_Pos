"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  clearCustomerState,
} from "@/store/slices/customer/customer.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const { customers, loading, actionLoading, error, success, message, currentPage, pageSize, totalCount } =
    useAppSelector((state) => state.customer);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CreateCustomerRequest>({
    customerCode: "",
    customerName: "",
    customerTypeId: 1,
    contactNo: "",
    email: "",
    address: "",
    city: "",
    postcode: "",
    vatNumber: "",
    creditLimit: 0,
    creditDays: 30,
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchCustomers({ pageNumber: 1, pageSize: 10 }));
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
  }, [success, error, message, dispatch]);

  const resetForm = () => {
    setForm({
      customerCode: "",
      customerName: "",
      customerTypeId: 1,
      contactNo: "",
      email: "",
      address: "",
      city: "",
      postcode: "",
      vatNumber: "",
      creditLimit: 0,
      creditDays: 30,
      isActive: true,
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async () => {
    if (!form.customerCode.trim() || !form.customerName.trim()) {
      dispatch(addToast({ type: "error", title: "Validation Error", message: "Customer code and name are required", duration: 3000 }));
      return;
    }

    if (editingCustomer) {
      const payload: UpdateCustomerRequest = { customerId: editingCustomer.customerId, ...form };
      const result = await dispatch(updateCustomer(payload));
      if (updateCustomer.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchCustomers({ pageNumber: currentPage, pageSize }));
      }
      return;
    }

    const result = await dispatch(createCustomer(form));
    if (createCustomer.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchCustomers({ pageNumber: currentPage, pageSize }));
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      customerTypeId: customer.customerTypeId,
      contactNo: customer.contactNo || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      postcode: customer.postcode || "",
      vatNumber: customer.vatNumber || "",
      creditLimit: customer.creditLimit,
      creditDays: customer.creditDays,
      isActive: customer.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    const result = await dispatch(deleteCustomer(customerToDelete.customerId));
    if (deleteCustomer.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      dispatch(fetchCustomers({ pageNumber: currentPage, pageSize }));
    }
  };

  const columns: Column<Customer>[] = [
    { key: "customerId", label: "#", className: "w-16" },
    { key: "customerCode", label: "Code" },
    { key: "customerName", label: "Name" },
    { key: "contactNo", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "currentBalance",
      label: "Balance",
      render: (item) => <span className="font-semibold">{formatCurrency(item.currentBalance || 0)}</span>,
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
      render: (item) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
          <button
            onClick={() => {
              setCustomerToDelete(item);
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
        title="Customers"
        description="Manage your customers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers" },
        ]}
      />
      <DataTable
        columns={columns}
        data={customers}
        rowKey="customerId"
        title="All Customers"
        totalCount={totalCount}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
        addLabel="Add Customer"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        description={editingCustomer ? "Update customer details" : "Create a new customer"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} disabled={actionLoading} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={actionLoading || !form.customerCode.trim() || !form.customerName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {actionLoading ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={form.customerCode} onChange={(e) => setForm({ ...form, customerCode: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Customer Code *" />
          <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Customer Name *" />
          <input type="number" value={form.customerTypeId} onChange={(e) => setForm({ ...form, customerTypeId: Number(e.target.value) || 1 })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Customer Type Id" />
          <input value={form.contactNo || ""} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Contact No" />
          <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Email" />
          <input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="City" />
          <input value={form.postcode || ""} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Postcode" />
          <input value={form.vatNumber || ""} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="VAT Number" />
          <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) || 0 })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Credit Limit" />
          <input type="number" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: Number(e.target.value) || 0 })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Credit Days" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
            Active
          </label>
          <textarea value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={3} placeholder="Address" />
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCustomerToDelete(null);
        }}
        title="Delete Customer"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">You are about to delete customer:</p>
            <p className="text-base font-semibold text-slate-800 mb-4">&quot;{customerToDelete?.customerName}&quot;</p>
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
