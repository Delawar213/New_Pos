"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategories } from "@/store/slices/category/category.slice";
import {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  clearSubCategoryState,
} from "@/store/slices/subCategory/subCategory.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type {
  CreateSubCategoryRequest,
  SubCategory,
  UpdateSubCategoryRequest,
} from "@/types/subcategory";

export default function SubCategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector(
    (state) => state.category
  );
  const { subCategories, loading, actionLoading, error, success, message } = useAppSelector(
    (state) => state.subCategory
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategory | null>(null);
  const [form, setForm] = useState<CreateSubCategoryRequest>({
    categoryId: 0,
    subCategoryName: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchCategories({ pageNumber: 1, pageSize: 200 }));
    dispatch(fetchSubCategories());
  }, [dispatch]);

  useEffect(() => {
    if (success && message) {
      dispatch(
        addToast({
          type: "success",
          title: "Success",
          message,
          duration: 3000,
        })
      );
      dispatch(clearSubCategoryState());
    }

    if (error) {
      dispatch(
        addToast({
          type: "error",
          title: "Error",
          message: error,
          duration: 5000,
        })
      );
      dispatch(clearSubCategoryState());
    }
  }, [success, error, message, dispatch]);

  const resetForm = () => {
    setForm({
      categoryId: 0,
      subCategoryName: "",
      isActive: true,
    });
    setEditingSubCategory(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!form.categoryId) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Category is required",
          duration: 3000,
        })
      );
      return;
    }

    if (!form.subCategoryName.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Subcategory name is required",
          duration: 3000,
        })
      );
      return;
    }

    const payload = {
      categoryId: form.categoryId,
      subCategoryName: form.subCategoryName.trim(),
      isActive: form.isActive,
    };

    const result = editingSubCategory
      ? await dispatch(
          updateSubCategory({
            subCategoryId: editingSubCategory.subCategoryId,
            ...payload,
          } as UpdateSubCategoryRequest)
        )
      : await dispatch(createSubCategory(payload));

    if (updateSubCategory.fulfilled.match(result) || createSubCategory.fulfilled.match(result)) {
      setModalOpen(false);
      resetForm();
      dispatch(fetchSubCategories());
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setForm({
      categoryId: subCategory.categoryId,
      subCategoryName: subCategory.subCategoryName,
      isActive: subCategory.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (subCategory: SubCategory) => {
    setSubCategoryToDelete(subCategory);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!subCategoryToDelete) return;
    const result = await dispatch(deleteSubCategory(subCategoryToDelete.subCategoryId));
    if (deleteSubCategory.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setSubCategoryToDelete(null);
      dispatch(fetchSubCategories());
    }
  };

  const columns: Column<SubCategory>[] = [
    { key: "subCategoryId", label: "#", className: "w-16" },
    { key: "subCategoryName", label: "Subcategory Name" },
    { key: "categoryName", label: "Category" },
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
          <button
            onClick={() => handleEdit(item)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item)}
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
        title="Subcategories"
        description="Create and manage product subcategories"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subcategories" },
        ]}
      />

      <DataTable
        columns={columns}
        data={subCategories}
        rowKey="subCategoryId"
        title="All Subcategories"
        totalCount={subCategories.length}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={() => setModalOpen(true)}
        addLabel="Add Subcategory"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingSubCategory ? "Edit Subcategory" : "Add Subcategory"}
        description={
          editingSubCategory
            ? "Update subcategory details"
            : "Create a new subcategory under an existing category"
        }
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
              disabled={actionLoading || !form.subCategoryName.trim() || !form.categoryId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Saving..." : editingSubCategory ? "Update Subcategory" : "Save Subcategory"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId || ""}
              onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Subcategory Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.subCategoryName}
              onChange={(e) => setForm({ ...form, subCategoryName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Soft Drinks"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="subCategoryIsActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="subCategoryIsActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        title="Delete Subcategory"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-slate-800">Are you sure you want to delete?</h3>
            <p className="mb-1 text-sm text-slate-600">You are about to delete the subcategory:</p>
            <p className="mb-4 text-base font-semibold text-slate-800">
              &quot;{subCategoryToDelete?.subCategoryName}&quot;
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDeleteCancel}
              disabled={actionLoading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 transition-all"
            >
              {actionLoading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
