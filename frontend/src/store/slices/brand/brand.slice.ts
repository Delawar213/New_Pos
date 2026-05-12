// store/slices/brand/brand.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type { 
  Brand, 
  CreateBrandRequest, 
  UpdateBrandRequest,
  BrandDropdown,
  PaginatedBrandResponse
} from '@/types/brand';
import type { RootState } from '@/store';

// ============================================
// TypeScript Interfaces
// ============================================

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface BrandState {
  brands: Brand[];
  activeBrands: Brand[];
  dropdownBrands: BrandDropdown[];
  selectedBrand: Brand | null;
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

const initialState: BrandState = {
  brands: [],
  activeBrands: [],
  dropdownBrands: [],
  selectedBrand: null,
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
// Async Thunks
// ============================================

// Fetch all brands with pagination
export const fetchBrands = createAsyncThunk<
  ApiResponse<PaginatedBrandResponse>,
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>(
  'brand/fetchAll',
  async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<PaginatedBrandResponse>>(
        `/proxy/brands?pageNumber=${pageNumber}&pageSize=${pageSize}&sortDirection=desc`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch brands');
    }
  }
);

// Fetch brand by ID
export const fetchBrandById = createAsyncThunk<
  ApiResponse<Brand>,
  number,
  { rejectValue: string; state: RootState }
>(
  'brand/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Brand>>(`/proxy/brands/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch brand');
    }
  }
);

// Fetch active brands
export const fetchActiveBrands = createAsyncThunk<
  ApiResponse<Brand[]>,
  void,
  { rejectValue: string; state: RootState }
>(
  'brand/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Brand[]>>('/proxy/brands/active');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active brands');
    }
  }
);

// Fetch brands for dropdown
export const fetchBrandsDropdown = createAsyncThunk<
  ApiResponse<BrandDropdown[]>,
  void,
  { rejectValue: string; state: RootState }
>(
  'brand/fetchDropdown',
  async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<BrandDropdown[]>>('/proxy/brands/dropdown');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch brands dropdown');
    }
  }
);

// Create new brand
export const createBrand = createAsyncThunk<
  ApiResponse<Brand>,
  CreateBrandRequest,
  { rejectValue: string; state: RootState }
>(
  'brand/create',
  async (brandData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<Brand>>('/proxy/brands', brandData);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create brand');
    }
  }
);

// Update brand
export const updateBrand = createAsyncThunk<
  ApiResponse<Brand>,
  UpdateBrandRequest,
  { rejectValue: string; state: RootState }
>(
  'brand/update',
  async (brandData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<Brand>>(
        `/proxy/brands/update/${brandData.brandId}`,
        brandData
      );
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update brand');
    }
  }
);

// Delete brand
export const deleteBrand = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>(
  'brand/delete',
  async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<unknown>>(`/proxy/brands/delete/${id}`, { id });
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return { id, message: response.data.message || 'Brand deleted successfully' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete brand');
    }
  }
);

// ============================================
// Slice
// ============================================

const brandSlice = createSlice({
  name: 'brand',
  initialState,
  reducers: {
    clearBrandState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedBrand(state) {
      state.selectedBrand = null;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all brands
    builder.addCase(fetchBrands.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBrands.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.brands = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });
    builder.addCase(fetchBrands.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch brands';
    });

    // Fetch brand by ID
    builder.addCase(fetchBrandById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBrandById.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.selectedBrand = payload.data;
    });
    builder.addCase(fetchBrandById.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch brand';
    });

    // Fetch active brands
    builder.addCase(fetchActiveBrands.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveBrands.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.activeBrands = payload.data;
    });
    builder.addCase(fetchActiveBrands.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch active brands';
    });

    // Fetch brands dropdown
    builder.addCase(fetchBrandsDropdown.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBrandsDropdown.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.dropdownBrands = payload.data;
    });
    builder.addCase(fetchBrandsDropdown.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch brands dropdown';
    });

    // Create brand
    builder.addCase(createBrand.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createBrand.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.brands.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Brand created successfully! 🎉';
    });
    builder.addCase(createBrand.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create brand';
      state.success = false;
    });

    // Update brand
    builder.addCase(updateBrand.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateBrand.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.brands.findIndex(b => b.brandId === payload.data.brandId);
      if (index !== -1) {
        state.brands[index] = payload.data;
      }
      state.selectedBrand = payload.data;
      state.success = true;
      state.message = payload.message || 'Brand updated successfully! ✅';
    });
    builder.addCase(updateBrand.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update brand';
      state.success = false;
    });

    // Delete brand
    builder.addCase(deleteBrand.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteBrand.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.brands = state.brands.filter(b => b.brandId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Brand deleted successfully! 🗑️';
    });
    builder.addCase(deleteBrand.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete brand';
      state.success = false;
    });
  },
});

export const { clearBrandState, clearSelectedBrand, setCurrentPage } = brandSlice.actions;
export const brandSliceConfig = configureSlice(brandSlice, false);

export default brandSlice.reducer;
