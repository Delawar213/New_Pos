// store/slices/category/category.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { configureSlice } from '@/lib/utils';
import type { 
  Category, 
  SubCategory, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@/types/category';
import type { RootState } from '@/store';

// ============================================
// Helper Functions
// ============================================

// Create axios instance with auth token
const createAuthenticatedRequest = (token?: string) => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
};

// ============================================
// TypeScript Interfaces
// ============================================

export interface CategoryDropdown {
  categoryId: number;
  categoryName: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface CategoryState {
  categories: Category[];
  activeCategories: Category[];
  dropdownCategories: CategoryDropdown[];
  selectedCategory: Category | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  message: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const initialState: CategoryState = {
  categories: [],
  activeCategories: [],
  dropdownCategories: [],
  selectedCategory: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: '',
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
};

// ============================================
// Async Thunks
// ============================================

// Fetch all categories with pagination
export const fetchCategories = createAsyncThunk<
  ApiResponse<Category[]>,
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>(
  'category/fetchAll',
  async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.get<ApiResponse<Category[]>>(
        `/api/categories?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch categories');
    }
  }
);

// Fetch category by ID
export const fetchCategoryById = createAsyncThunk<
  ApiResponse<Category>,
  number,
  { rejectValue: string; state: RootState }
>(
  'category/fetchById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.get<ApiResponse<Category>>(`/api/categories/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch category');
    }
  }
);

// Fetch active categories
export const fetchActiveCategories = createAsyncThunk<
  ApiResponse<Category[]>,
  void,
  { rejectValue: string; state: RootState }
>(
  'category/fetchActive',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.get<ApiResponse<Category[]>>('/api/categories/active');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active categories');
    }
  }
);

// Fetch categories for dropdown
export const fetchCategoriesDropdown = createAsyncThunk<
  ApiResponse<CategoryDropdown[]>,
  void,
  { rejectValue: string; state: RootState }
>(
  'category/fetchDropdown',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.get<ApiResponse<CategoryDropdown[]>>('/api/categories/dropdown');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch categories dropdown');
    }
  }
);

// Create new category
export const createCategory = createAsyncThunk<
  ApiResponse<Category>,
  CreateCategoryRequest,
  { rejectValue: string; state: RootState }
>(
  'category/create',
  async (categoryData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.post<ApiResponse<Category>>('/api/categories', categoryData);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create category');
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk<
  ApiResponse<Category>,
  UpdateCategoryRequest,
  { rejectValue: string; state: RootState }
>(
  'category/update',
  async (categoryData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.put<ApiResponse<Category>>(
        `/api/categories/${categoryData.categoryId}`,
        categoryData
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update category');
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>(
  'category/delete',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth?.token;
      const api = createAuthenticatedRequest(token);
      const response = await api.delete<ApiResponse<unknown>>(`/api/categories/${id}`);
      return { id, message: response.data.message || 'Category deleted successfully' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete category');
    }
  }
);

// ============================================
// Slice
// ============================================

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearCategoryState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedCategory(state) {
      state.selectedCategory = null;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all categories
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.categories = payload.data;
      state.success = true;
      state.message = payload.message;
    });
    builder.addCase(fetchCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch categories';
      state.success = false;
    });

    // Fetch category by ID
    builder.addCase(fetchCategoryById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategoryById.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.selectedCategory = payload.data;
      state.success = true;
    });
    builder.addCase(fetchCategoryById.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch category';
      state.success = false;
    });

    // Fetch active categories
    builder.addCase(fetchActiveCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.activeCategories = payload.data;
      state.success = true;
    });
    builder.addCase(fetchActiveCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch active categories';
      state.success = false;
    });

    // Fetch categories dropdown
    builder.addCase(fetchCategoriesDropdown.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategoriesDropdown.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.dropdownCategories = payload.data;
      state.success = true;
    });
    builder.addCase(fetchCategoriesDropdown.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch categories dropdown';
      state.success = false;
    });

    // Create category
    builder.addCase(createCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.categories.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Category created successfully! 🎉';
    });
    builder.addCase(createCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create category';
      state.success = false;
      state.message = payload || 'Failed to create category';
    });

    // Update category
    builder.addCase(updateCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.categories.findIndex(c => c.categoryId === payload.data.categoryId);
      if (index !== -1) {
        state.categories[index] = payload.data;
      }
      state.selectedCategory = payload.data;
      state.success = true;
      state.message = payload.message || 'Category updated successfully! ✅';
    });
    builder.addCase(updateCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update category';
      state.success = false;
      state.message = payload || 'Failed to update category';
    });

    // Delete category
    builder.addCase(deleteCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.categories = state.categories.filter(c => c.categoryId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Category deleted successfully! 🗑️';
    });
    builder.addCase(deleteCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete category';
      state.success = false;
      state.message = payload || 'Failed to delete category';
    });
  },
});

export const { clearCategoryState, clearSelectedCategory, setCurrentPage } = categorySlice.actions;
export const categorySliceConfig = configureSlice(categorySlice, false);

export default categorySlice.reducer;
