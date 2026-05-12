"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  clearExpenseCategoryState,
} from "@/store/slices/expenseCategory/expenseCategory.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { ExpenseCategory, CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest } from "@/types";

export default function ExpenseCategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading, actionLoading, error, success, message } = useAppSelector(
    (state) => state.expenseCategory
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState<CreateExpenseCategoryRequest>({
    categoryName: "",
    expenseType: "Operating",
    isVatApplicable: false,
    defaultVatRate: 0,
    description: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(addToast({ type: "success", title: "Success", message, duration: 3000 }));
      dispatch(clearExpenseCategoryState());
    }
    if (error) {
      dispatch(addToast({ type: "error", title: "Error", message: error, duration: 5000 }));
      dispatch(clearExpenseCategoryState());
    }
  }, [success, error, message, dispatch]);

  const resetForm = () => {
    setForm({
      categoryName: "",
      expenseType: "Operating",
      isVatApplicable: false,
      defaultVatRate: 0,
      description: "",
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    if (!form.categoryName.trim()) return;
    if (editingCategory) {
      const payload: UpdateExpenseCategoryRequest = {
        expenseCategoryId: editingCategory.expenseCategoryId,
        ...form,
      };
      const result = await dispatch(updateExpenseCategory(payload));
      if (updateExpenseCategory.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchExpenseCategories());
      }
      return;
    }
    const result = await dispatch(createExpenseCategory(form));
    if (createExpenseCategory.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchExpenseCategories());
    }
  };

  const handleEdit = (item: ExpenseCategory) => {
    setEditingCategory(item);
    setForm({
      categoryName: item.categoryName,
      expenseType: item.expenseType,
      isVatApplicable: item.isVatApplicable,
      defaultVatRate: item.defaultVatRate,
      description: item.description || "",
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const columns: Column<ExpenseCategory>[] = [
    { key: "categoryName", label: "Name" },
    { key: "expenseType", label: "Type" },
    { key: "defaultVatRate", label: "VAT %" },
    {
      key: "isVatApplicable",
      label: "VAT Applicable",
      render: (item) => <span>{item.isVatApplicable ? "Yes" : "No"}</span>,
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
          <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
          <button
            onClick={() => {
              setCategoryToDelete(item);
              setDeleteConfirmOpen(true);
            }}
            className="text-xs text-red-600 hover:text-red-800"
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
        title="Expense Categories"
        description="Manage expense categories"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Expense Categories" },
        ]}
      />
      <DataTable
        columns={columns}
        data={categories}
        rowKey="expenseCategoryId"
        title="All Expense Categories"
        totalCount={categories.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => {
          resetForm();
          setModalOpen(true);
        }}
        addLabel="Add Category"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingCategory ? "Edit Expense Category" : "Add Expense Category"}
        description="Manage expense category details"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={actionLoading || !form.categoryName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {actionLoading ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category Name *</label>
            <input value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expense Type</label>
            <input value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Default VAT Rate</label>
            <input type="number" value={form.defaultVatRate} onChange={(e) => setForm({ ...form, defaultVatRate: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isVatApplicable} onChange={(e) => setForm({ ...form, isVatApplicable: e.target.checked })} className="rounded border-gray-300" />
              VAT Applicable
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
              Active
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCategoryToDelete(null);
        }}
        title="Delete Expense Category"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">You are about to delete:</p>
            <p className="text-base font-semibold text-slate-800 mb-4">&quot;{categoryToDelete?.categoryName}&quot;</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              onClick={async () => {
                if (!categoryToDelete) return;
                const result = await dispatch(deleteExpenseCategory(categoryToDelete.expenseCategoryId));
                if (deleteExpenseCategory.fulfilled.match(result)) {
                  setDeleteConfirmOpen(false);
                  setCategoryToDelete(null);
                  dispatch(fetchExpenseCategories());
                }
              }}
              disabled={actionLoading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
