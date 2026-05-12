import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  CreateSubCategoryRequest,
  SubCategory,
  UpdateSubCategoryRequest,
} from '@/types/subcategory';
import type { RootState } from '@/store';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface SubCategoryState {
  subCategories: SubCategory[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  message: string;
}

const initialState: SubCategoryState = {
  subCategories: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: '',
};

export const fetchSubCategories = createAsyncThunk<
  ApiResponse<SubCategory[]>,
  void,
  { rejectValue: string; state: RootState }
>('subCategory/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<SubCategory[]>>('/proxy/categories/subcategory');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch subcategories');
  }
});

export const createSubCategory = createAsyncThunk<
  ApiResponse<unknown>,
  CreateSubCategoryRequest,
  { rejectValue: string; state: RootState }
>('subCategory/create', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>('/proxy/categories/subcategory', payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create subcategory');
  }
});

export const updateSubCategory = createAsyncThunk<
  ApiResponse<SubCategory>,
  UpdateSubCategoryRequest,
  { rejectValue: string; state: RootState }
>('subCategory/update', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<SubCategory>>(
      `/proxy/categories/subcategory/${payload.subCategoryId}`,
      payload
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update subcategory');
  }
});

export const deleteSubCategory = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>('subCategory/delete', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/categories/subcategorydelete/${id}`, { subCategoryId: id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Subcategory deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete subcategory');
  }
});

const subCategorySlice = createSlice({
  name: 'subCategory',
  initialState,
  reducers: {
    clearSubCategoryState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSubCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSubCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.subCategories = payload.data;
    });
    builder.addCase(fetchSubCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch subcategories';
    });

    builder.addCase(createSubCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createSubCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || 'Subcategory created successfully';
    });
    builder.addCase(createSubCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create subcategory';
      state.success = false;
    });

    builder.addCase(updateSubCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateSubCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.subCategories.findIndex((s) => s.subCategoryId === payload.data.subCategoryId);
      if (index !== -1) {
        state.subCategories[index] = payload.data;
      }
      state.success = true;
      state.message = payload.message || 'Subcategory updated successfully';
    });
    builder.addCase(updateSubCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update subcategory';
      state.success = false;
    });

    builder.addCase(deleteSubCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteSubCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.subCategories = state.subCategories.filter((s) => s.subCategoryId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Subcategory deleted successfully';
    });
    builder.addCase(deleteSubCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete subcategory';
      state.success = false;
    });
  },
});

export const { clearSubCategoryState } = subCategorySlice.actions;
export const subCategorySliceConfig = configureSlice(subCategorySlice, false);

export default subCategorySlice.reducer;
