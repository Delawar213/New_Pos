"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearCategoryState,
} from "@/store/slices/category/category.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const {
    categories,
    loading,
    actionLoading,
    error,
    success,
    message,
    currentPage,
    pageSize,
    totalCount,
  } = useAppSelector((state) => state.category);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CreateCategoryRequest>({
    categoryName: "",
    description: "",
    parentCategoryId: null,
    displayOrder: 0,
    vatRate: 0,
    isActive: true,
  });

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories({ pageNumber: 1, pageSize: 10 }));
  }, [dispatch]);

  // Show toast notifications
  useEffect(() => {
    if (success && message) {
      dispatch(addToast({
        type: 'success',
        title: 'Success',
        message: message,
        duration: 3000,
      }));
      dispatch(clearCategoryState());
    }
    
    if (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: error,
        duration: 5000,
      }));
      dispatch(clearCategoryState());
    }
  }, [success, error, message, dispatch]);

  const handleSubmit = async () => {
    if (!form.categoryName.trim()) {
      dispatch(addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Category name is required',
        duration: 3000,
      }));
      return;
    }

    if (editingCategory) {
      // Update existing category
      const updateData: UpdateCategoryRequest = {
        categoryId: editingCategory.categoryId,
        categoryName: form.categoryName,
        description: form.description,
        parentCategoryId: form.parentCategoryId,
        isActive: form.isActive,
      };
      
      const result = await dispatch(updateCategory(updateData));
      
      if (updateCategory.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
      }
    } else {
      // Create new category
      const result = await dispatch(createCategory(form));
      
      if (createCategory.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      categoryName: category.categoryName,
      description: category.description || "",
      parentCategoryId: category.parentCategoryId || null,
      displayOrder: category.displayOrder,
      vatRate: category.vatRate,
      isActive: category.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    const result = await dispatch(deleteCategory(categoryToDelete.categoryId));
    
    if (deleteCategory.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ 
      categoryName: "", 
      description: "", 
      parentCategoryId: null, 
      displayOrder: 0,
      vatRate: 0,
      isActive: true 
    });
    setEditingCategory(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const columns: Column<Category>[] = [
    { key: "categoryName", label: "Name" },
    { key: "description", label: "Description" },
    {
      key: "isActive",
      label: "Status",
      render: (item) => <StatusBadge status={item.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "createdDatetime",
      label: "Created",
      render: (item) => <span>{new Date(item.createdDatetime).toLocaleDateString()}</span>,
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
        title="Categories"
        description="Manage product categories"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Categories" },
        ]}
      />

      <DataTable
        columns={columns}
        data={categories}
        rowKey="categoryId"
        title="All Categories"
        totalCount={totalCount}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => dispatch(fetchCategories({ pageNumber: p, pageSize }))}
        onPageSizeChange={(s) => dispatch(fetchCategories({ pageNumber: 1, pageSize: s }))}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={handleOpenCreate}
        addLabel="Add Category"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingCategory ? "Edit Category" : "Add Category"}
        description={editingCategory ? "Update category details" : "Create a new product category"}
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
              disabled={actionLoading || !form.categoryName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.categoryName}
              onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Beverages"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Drinks and beverages"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        title="Delete Category"
        description="This action cannot be undone"
        size="sm"
      >
        <div className="py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Are you sure you want to delete?
            </h3>
            <p className="text-sm text-slate-600 mb-1">
              You are about to delete the category:
            </p>
            <p className="text-base font-semibold text-slate-800 mb-4">
              &quot;{categoryToDelete?.categoryName}&quot;
            </p>
            <p className="text-sm text-slate-500">
              This action cannot be undone and may affect related products.
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

