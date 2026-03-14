// Example: How to use the Category slice in your components

'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCategories,
  fetchCategoryById,
  fetchActiveCategories,
  fetchCategoriesDropdown,
  createCategory,
  updateCategory,
  deleteCategory,
  clearCategoryState,
  clearSelectedCategory,
} from '@/store/slices/category/category.slice';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import { addToast } from '@/store/slices/ui/ui.slice';

export default function CategoryManagementExample() {
  const dispatch = useAppDispatch();
  const { 
    categories, 
    activeCategories,
    dropdownCategories,
    selectedCategory,
    loading, 
    actionLoading,
    error, 
    success,
    message,
    currentPage,
    pageSize 
  } = useAppSelector((state) => state.category);

  const [formData, setFormData] = useState<CreateCategoryRequest>({
    categoryName: '',
    description: '',
    parentCategoryId: null,
    isActive: true,
  });

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories({ pageNumber: 1, pageSize: 10 }));
    
    // Fetch dropdown categories for select options
    dispatch(fetchCategoriesDropdown());
  }, [dispatch]);

  // Show toast notifications when operations complete
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

  // Handle create category
  const handleCreateCategory = async () => {
    const result = await dispatch(createCategory(formData));
    
    if (createCategory.fulfilled.match(result)) {
      // Category created successfully
      setFormData({
        categoryName: '',
        description: '',
        parentCategoryId: null,
        isActive: true,
      });
      
      // Refresh the list
      dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
    }
  };

  // Handle update category
  const handleUpdateCategory = async (categoryId: number) => {
    const updateData: UpdateCategoryRequest = {
      categoryId,
      categoryName: 'Updated Name',
      description: 'Updated description',
      parentCategoryId: null,
      isActive: true,
    };

    const result = await dispatch(updateCategory(updateData));
    
    if (updateCategory.fulfilled.match(result)) {
      // Category updated successfully
      dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const result = await dispatch(deleteCategory(categoryId));
      
      if (deleteCategory.fulfilled.match(result)) {
        // Category deleted successfully
        dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
      }
    }
  };

  // Handle fetch single category
  const handleViewCategory = async (categoryId: number) => {
    await dispatch(fetchCategoryById(categoryId));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    dispatch(fetchCategories({ pageNumber: newPage, pageSize }));
  };

  // Load active categories only
  const loadActiveCategories = () => {
    dispatch(fetchActiveCategories());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>

      {/* Create Category Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Category Name"
            value={formData.categoryName}
            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
          
          <select
            value={formData.parentCategoryId || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              parentCategoryId: e.target.value ? Number(e.target.value) : null 
            })}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">No Parent Category</option>
            {dropdownCategories.map(cat => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Active</span>
          </label>
          
          <button
            onClick={handleCreateCategory}
            disabled={actionLoading || !formData.categoryName}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {actionLoading ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          
          <button
            onClick={loadActiveCategories}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Load Active Only
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.categoryId} className="border-b hover:bg-gray-50">
                    <td className="p-2">{category.categoryId}</td>
                    <td className="p-2 font-medium">{category.categoryName}</td>
                    <td className="p-2">{category.description || 'N/A'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2">
                      {new Date(category.createdDatetime).toLocaleDateString()}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => handleViewCategory(category.categoryId)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleUpdateCategory(category.categoryId)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.categoryId)}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {currentPage}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 border rounded"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Category Details</h2>
            <button
              onClick={() => dispatch(clearSelectedCategory())}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-semibold">ID:</dt>
              <dd>{selectedCategory.categoryId}</dd>
            </div>
            <div>
              <dt className="font-semibold">Name:</dt>
              <dd>{selectedCategory.categoryName}</dd>
            </div>
            <div>
              <dt className="font-semibold">Description:</dt>
              <dd>{selectedCategory.description || 'N/A'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Status:</dt>
              <dd>{selectedCategory.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
            <div>
              <dt className="font-semibold">Display Order:</dt>
              <dd>{selectedCategory.displayOrder}</dd>
            </div>
            <div>
              <dt className="font-semibold">VAT Rate:</dt>
              <dd>{selectedCategory.vatRate}%</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-semibold">Subcategories:</dt>
              <dd>{selectedCategory.subCategories.length} subcategories</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
