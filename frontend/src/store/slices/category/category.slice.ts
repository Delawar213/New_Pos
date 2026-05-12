// store/slices/category/category.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedCategoryResponse,
} from '@/types/category';
import type { RootState } from '@/store';

// ============================================
// Types
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

/** Backend list/create/update may omit fields; normalize to `Category`. */
function normalizeCategory(d: unknown, fallbackId?: number): Category | null {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const rec = d as Record<string, unknown>;
  const cid = rec.categoryId ?? rec.CategoryId ?? fallbackId;
  if (cid == null || cid === '') return null;
  const subs = (Array.isArray(rec.subCategories)
    ? rec.subCategories
    : Array.isArray(rec.SubCategories)
      ? rec.SubCategories
      : []) as Category['subCategories'];
  return {
    categoryId: Number(cid),
    categoryName: String(rec.categoryName ?? rec.CategoryName ?? ''),
    description: (rec.description ?? rec.Description) as string | undefined,
    parentCategoryId: (rec.parentCategoryId ?? rec.ParentCategoryId ?? null) as number | null | undefined,
    parentCategoryName: (rec.parentCategoryName ?? rec.ParentCategoryName) as string | undefined,
    displayOrder: Number(rec.displayOrder ?? rec.DisplayOrder ?? 0),
    vatRate: Number(rec.vatRate ?? rec.VatRate ?? 0),
    isActive: Boolean(rec.isActive ?? rec.IsActive ?? true),
    createdDatetime: String(rec.createdDatetime ?? rec.CreatedDatetime ?? ''),
    subCategories: subs,
  };
}

/** POST /api/categories — body matches backend contract. */
function bodyForCreate(data: CreateCategoryRequest) {
  return {
    categoryName: data.categoryName.trim(),
    description: (data.description ?? '').trim(),
    parentCategoryId: data.parentCategoryId ?? null,
    isActive: data.isActive,
  };
}

/** POST /api/categories/:id — id is only in the URL, not the body. */
function bodyForUpdate(data: UpdateCategoryRequest) {
  return {
    categoryName: data.categoryName.trim(),
    description: (data.description ?? '').trim(),
    parentCategoryId: data.parentCategoryId ?? null,
    isActive: data.isActive,
  };
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
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

// ============================================
// Thunks
// ============================================

export const fetchCategories = createAsyncThunk<
  ApiResponse<Category[] | PaginatedCategoryResponse>,
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>('category/fetchAll', async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Category[] | PaginatedCategoryResponse>>(
      `/proxy/categories?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch categories');
  }
});

export const fetchCategoryById = createAsyncThunk<
  ApiResponse<Category>,
  number,
  { rejectValue: string; state: RootState }
>('category/fetchById', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Category>>(`/proxy/categories/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch category');
  }
});

export const fetchActiveCategories = createAsyncThunk<
  ApiResponse<Category[]>,
  void,
  { rejectValue: string; state: RootState }
>('category/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Category[]>>('/proxy/categories/active');
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active categories');
  }
});

export const fetchCategoriesDropdown = createAsyncThunk<
  ApiResponse<CategoryDropdown[]>,
  void,
  { rejectValue: string; state: RootState }
>('category/fetchDropdown', async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<CategoryDropdown[]>>('/proxy/categories/dropdown');
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch categories dropdown');
  }
});

export const createCategory = createAsyncThunk<
  ApiResponse<Category>,
  CreateCategoryRequest,
  { rejectValue: string; state: RootState }
>('category/create', async (categoryData, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Category>>('/proxy/categories', bodyForCreate(categoryData));
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create category');
  }
});

export const updateCategory = createAsyncThunk<
  ApiResponse<Category>,
  UpdateCategoryRequest,
  { rejectValue: string; state: RootState }
>('category/update', async (categoryData, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const { categoryId } = categoryData;
    const response = await api.post<ApiResponse<Category>>(
      `/proxy/categories/${categoryId}`,
      bodyForUpdate(categoryData)
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update category');
  }
});

/** Backend: POST /api/categories/subcategorydelete/{id} */
export const deleteCategory = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>('category/delete', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/categories/subcategorydelete/${id}`, {});
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Category deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || 'Failed to delete category'
    );
  }
});

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
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      const raw = payload.data as unknown;
      if (Array.isArray(raw)) {
        state.categories = raw
          .map((row) => normalizeCategory(row))
          .filter((c): c is Category => c != null);
        state.totalCount = state.categories.length;
        state.currentPage = 1;
        state.pageSize = raw.length || 10;
        state.totalPages = 1;
        state.hasPreviousPage = false;
        state.hasNextPage = false;
        return;
      }
      const page = raw as PaginatedCategoryResponse;
      const rows = Array.isArray(page?.data) ? page.data : [];
      state.categories = rows
        .map((row) => normalizeCategory(row))
        .filter((c): c is Category => c != null);
      state.totalCount = page?.totalRecords ?? state.categories.length;
      state.currentPage = page?.pageNumber ?? 1;
      state.pageSize = page?.pageSize ?? 10;
      state.totalPages = page?.totalPages ?? 0;
      state.hasPreviousPage = page?.hasPreviousPage ?? false;
      state.hasNextPage = page?.hasNextPage ?? false;
    });
    builder.addCase(fetchCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch categories';
    });

    builder.addCase(fetchCategoryById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategoryById.fulfilled, (state, { payload }) => {
      state.loading = false;
      const row = normalizeCategory(payload.data);
      state.selectedCategory = row;
    });
    builder.addCase(fetchCategoryById.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch category';
    });

    builder.addCase(fetchActiveCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.activeCategories = (payload.data || [])
        .map((row) => normalizeCategory(row))
        .filter((c): c is Category => c != null);
    });
    builder.addCase(fetchActiveCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch active categories';
    });

    builder.addCase(fetchCategoriesDropdown.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategoriesDropdown.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.dropdownCategories = payload.data;
    });
    builder.addCase(fetchCategoriesDropdown.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch categories dropdown';
    });

    builder.addCase(createCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      if (!Array.isArray(state.categories)) state.categories = [];
      const row = normalizeCategory(payload.data);
      if (row) {
        state.categories.unshift(row);
        state.totalCount += 1;
      }
      state.success = true;
      state.message = payload.message || 'Category created successfully';
    });
    builder.addCase(createCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create category';
      state.success = false;
    });

    builder.addCase(updateCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      if (!Array.isArray(state.categories)) state.categories = [];
      const row = normalizeCategory(payload.data);
      if (row) {
        const index = state.categories.findIndex((c) => c.categoryId === row.categoryId);
        if (index !== -1) {
          state.categories[index] = { ...state.categories[index], ...row };
        }
        state.selectedCategory = { ...(state.selectedCategory || row), ...row };
      }
      state.success = true;
      state.message = payload.message || 'Category updated successfully';
    });
    builder.addCase(updateCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update category';
      state.success = false;
    });

    builder.addCase(deleteCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      if (!Array.isArray(state.categories)) state.categories = [];
      state.categories = state.categories.filter((c) => c.categoryId !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message || 'Category deleted successfully';
    });
    builder.addCase(deleteCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete category';
      state.success = false;
    });
  },
});

export const { clearCategoryState, clearSelectedCategory, setCurrentPage } = categorySlice.actions;
export const categorySliceConfig = configureSlice(categorySlice, false);

export default categorySlice.reducer;
