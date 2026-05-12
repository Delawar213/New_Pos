"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader, DataTable, StatusBadge, Modal } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  clearBrandState,
} from "@/store/slices/brand/brand.slice";
import { addToast } from "@/store/slices/ui/ui.slice";
import type { Column } from "@/components/ui/DataTable";
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from "@/types/brand";

export default function BrandsPage() {
  const dispatch = useAppDispatch();
  const { 
    brands, 
    loading, 
    actionLoading, 
    error, 
    success, 
    message,
    currentPage,
    pageSize,
    totalCount
  } = useAppSelector((state) => state.brand);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<CreateBrandRequest>({
    brandName: "",
    description: "",
    isActive: true,
  });

  // Fetch brands on component mount
  useEffect(() => {
    dispatch(fetchBrands({ pageNumber: 1, pageSize: 10 }));
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
      dispatch(clearBrandState());
    }
    
    if (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: error,
        duration: 5000,
      }));
      dispatch(clearBrandState());
    }
  }, [success, error, message, dispatch]);

  const handleSubmit = async () => {
    if (!form.brandName.trim()) {
      dispatch(addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Brand name is required',
        duration: 3000,
      }));
      return;
    }

    if (editingBrand) {
      const updateData: UpdateBrandRequest = {
        brandId: editingBrand.brandId,
        brandName: form.brandName,
        description: form.description,
        isActive: form.isActive,
      };
      
      const result = await dispatch(updateBrand(updateData));
      
      if (updateBrand.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchBrands({ pageNumber: currentPage, pageSize }));
      }
    } else {
      const result = await dispatch(createBrand(form));
      
      if (createBrand.fulfilled.match(result)) {
        setModalOpen(false);
        resetForm();
        dispatch(fetchBrands({ pageNumber: currentPage, pageSize }));
      }
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      brandName: brand.brandName,
      description: "",
      isActive: brand.isActive,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;
    
    const result = await dispatch(deleteBrand(brandToDelete.brandId));
    
    if (deleteBrand.fulfilled.match(result)) {
      setDeleteConfirmOpen(false);
      setBrandToDelete(null);
      dispatch(fetchBrands({ pageNumber: currentPage, pageSize }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setBrandToDelete(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ 
      brandName: "", 
      description: "", 
      isActive: true 
    });
    setEditingBrand(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const columns: Column<Brand>[] = [
    { key: "brandName", label: "Name" },
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
        title="Brands"
        description="Manage product brands"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Brands" },
        ]}
      />

      <DataTable
        columns={columns}
        data={brands}
        rowKey="brandId"
        title="All Brands"
        totalCount={totalCount}
        pageNumber={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => dispatch(fetchBrands({ pageNumber: p, pageSize }))}
        onPageSizeChange={(s) => dispatch(fetchBrands({ pageNumber: 1, pageSize: s }))}
        onSearch={(term) => console.log("Search:", term)}
        onAdd={handleOpenCreate}
        addLabel="Add Brand"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingBrand ? "Edit Brand" : "Add Brand"}
        description={editingBrand ? "Update brand details" : "Create a new product brand"}
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
              disabled={actionLoading || !form.brandName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "Saving..." : editingBrand ? "Update Brand" : "Save Brand"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Coca Cola"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Premium soft drinks brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="brandIsActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="brandIsActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        title="Delete Brand"
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
              You are about to delete the brand:
            </p>
            <p className="text-base font-semibold text-slate-800 mb-4">
              &quot;{brandToDelete?.brandName}&quot;
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
