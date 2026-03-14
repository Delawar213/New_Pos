# Category Management - Quick Reference

## ✅ Complete Category Slice Setup

### API Endpoints Configured

| Operation | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| **Fetch All** | `/api/categories?pageNumber=1&pageSize=10` | GET | Get paginated categories |
| **Fetch By ID** | `/api/categories/1` | GET | Get single category |
| **Fetch Active** | `/api/categories/active` | GET | Get only active categories |
| **Fetch Dropdown** | `/api/categories/dropdown` | GET | Get categories for dropdowns |
| **Create** | `/api/categories` | POST | Create new category |
| **Update** | `/api/categories/1` | PUT | Update category |
| **Delete** | `/api/categories/1` | DELETE | Delete category |

---

## 🚀 Quick Usage

### 1. Import What You Need

```typescript
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
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from '@/store/slices/category/category.slice';
import { addToast } from '@/store/slices/ui/ui.slice';
```

### 2. Access State

```typescript
const { 
  categories,           // All categories
  activeCategories,     // Active categories only
  dropdownCategories,   // Categories for select options
  selectedCategory,     // Currently selected category
  loading,             // Loading state for fetch operations
  actionLoading,       // Loading state for create/update/delete
  error,               // Error message
  success,             // Success flag
  message,             // Success/error message
  currentPage,         // Current page number
  pageSize,            // Items per page
} = useAppSelector((state) => state.category);
```

### 3. Fetch Categories

```typescript
// Fetch all categories with pagination
const loadCategories = () => {
  dispatch(fetchCategories({ pageNumber: 1, pageSize: 10 }));
};

// Fetch single category
const loadCategory = (id: number) => {
  dispatch(fetchCategoryById(id));
};

// Fetch only active categories
const loadActiveCategories = () => {
  dispatch(fetchActiveCategories());
};

// Fetch categories for dropdown
const loadDropdown = () => {
  dispatch(fetchCategoriesDropdown());
};
```

### 4. Create Category

```typescript
const handleCreate = async () => {
  const newCategory: CreateCategoryRequest = {
    categoryName: 'Beverages',
    description: 'Drinks and beverages',
    parentCategoryId: null,
    isActive: true,
  };

  const result = await dispatch(createCategory(newCategory));
  
  if (createCategory.fulfilled.match(result)) {
    // Success! Show toast
    dispatch(addToast({
      type: 'success',
      title: 'Success',
      message: 'Category created successfully! 🎉',
      duration: 3000,
    }));
    
    // Refresh list
    dispatch(fetchCategories({ pageNumber: 1, pageSize: 10 }));
  }
};
```

### 5. Update Category

```typescript
const handleUpdate = async (categoryId: number) => {
  const updateData: UpdateCategoryRequest = {
    categoryId: categoryId,
    categoryName: 'Beverages Updated',
    description: 'All drinks',
    parentCategoryId: null,
    isActive: true,
  };

  const result = await dispatch(updateCategory(updateData));
  
  if (updateCategory.fulfilled.match(result)) {
    // Success! Show toast
    dispatch(addToast({
      type: 'success',
      title: 'Updated',
      message: 'Category updated successfully! ✅',
      duration: 3000,
    }));
  }
};
```

### 6. Delete Category

```typescript
const handleDelete = async (categoryId: number) => {
  if (!confirm('Are you sure you want to delete this category?')) {
    return;
  }

  const result = await dispatch(deleteCategory(categoryId));
  
  if (deleteCategory.fulfilled.match(result)) {
    // Success! Show toast
    dispatch(addToast({
      type: 'success',
      title: 'Deleted',
      message: 'Category deleted successfully! 🗑️',
      duration: 3000,
    }));
  }
};
```

### 7. Handle Errors with Toast

```typescript
useEffect(() => {
  // Show success toast
  if (success && message) {
    dispatch(addToast({
      type: 'success',
      title: 'Success',
      message: message,
      duration: 3000,
    }));
    dispatch(clearCategoryState());
  }
  
  // Show error toast
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
```

---

## 📊 Data Structures

### Category Object

```typescript
{
  categoryId: number;
  categoryName: string;
  description?: string;
  displayOrder: number;
  vatRate: number;
  isActive: boolean;
  createdDatetime: string;
  parentCategoryId?: number | null;
  subCategories: SubCategory[];
}
```

### Create Request

```typescript
{
  categoryName: string;           // Required
  description?: string;            // Optional
  parentCategoryId?: number | null; // Optional
  isActive: boolean;              // Required
}
```

### Update Request

```typescript
{
  categoryId: number;             // Required
  categoryName: string;           // Required
  description?: string;            // Optional
  parentCategoryId?: number | null; // Optional
  isActive: boolean;              // Required
}
```

---

## 🎯 Best Practices

### 1. **Always Handle Responses**
```typescript
const result = await dispatch(createCategory(data));
if (createCategory.fulfilled.match(result)) {
  // Success path
} else {
  // Error handled automatically by slice
}
```

### 2. **Show User Feedback**
```typescript
// Always show toast notifications for user actions
dispatch(addToast({ type: 'success', title: 'Done!', message: 'Action completed' }));
```

### 3. **Refresh After Mutations**
```typescript
// After create/update/delete, refresh the list
dispatch(fetchCategories({ pageNumber: currentPage, pageSize }));
```

### 4. **Clear State When Needed**
```typescript
// Clear error/success messages after showing toast
dispatch(clearCategoryState());

// Clear selected category when closing modal
dispatch(clearSelectedCategory());
```

### 5. **Use Pagination**
```typescript
// Keep track of current page
const handlePageChange = (page: number) => {
  dispatch(fetchCategories({ pageNumber: page, pageSize: 10 }));
};
```

---

## ⚡ Performance Tips

1. **Cache dropdown data** - Only fetch once on page load
2. **Debounce search** - Wait for user to stop typing
3. **Optimistic updates** - Update UI immediately, rollback on error
4. **Use actionLoading** - Prevent duplicate submissions

---

## 📝 Complete Example

See [CATEGORY_USAGE_EXAMPLE.tsx](./CATEGORY_USAGE_EXAMPLE.tsx) for a full working example with:
- ✅ Fetch with pagination
- ✅ Create with form validation
- ✅ Update with inline editing
- ✅ Delete with confirmation
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

---

## 🔥 Next Steps

Use this same pattern for other entities:
- Products
- Customers
- Suppliers
- Employees
- Transactions
- etc.

Just follow the same structure and update the API endpoints! 🚀
