import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  ExpenseCategory,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
} from '@/types/expenseCategory';
import type { RootState } from '@/store';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface ExpenseCategoryState {
  categories: ExpenseCategory[];
  selectedCategory: ExpenseCategory | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  message: string;
}

const initialState: ExpenseCategoryState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: '',
};

export const fetchExpenseCategories = createAsyncThunk<
  ApiResponse<ExpenseCategory[]>,
  void,
  { rejectValue: string; state: RootState }
>('expenseCategory/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<ExpenseCategory[]>>('/proxy/expensecategories');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch expense categories');
  }
});

export const fetchExpenseCategoryById = createAsyncThunk<
  ApiResponse<ExpenseCategory>,
  number,
  { rejectValue: string; state: RootState }
>('expenseCategory/fetchById', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<ExpenseCategory>>(`/proxy/expensecategories/${id}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch expense category');
  }
});

export const createExpenseCategory = createAsyncThunk<
  ApiResponse<ExpenseCategory>,
  CreateExpenseCategoryRequest,
  { rejectValue: string; state: RootState }
>('expenseCategory/create', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<ExpenseCategory>>('/proxy/expensecategories', payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create expense category');
  }
});

export const updateExpenseCategory = createAsyncThunk<
  ApiResponse<ExpenseCategory>,
  UpdateExpenseCategoryRequest,
  { rejectValue: string; state: RootState }
>('expenseCategory/update', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.put<ApiResponse<ExpenseCategory>>(
      `/proxy/expensecategories/${payload.expenseCategoryId}`,
      payload
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update expense category');
  }
});

export const deleteExpenseCategory = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>('expenseCategory/delete', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/expensecategories/delete/${id}`, { id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Expense category deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete expense category');
  }
});

const expenseCategorySlice = createSlice({
  name: 'expenseCategory',
  initialState,
  reducers: {
    clearExpenseCategoryState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedExpenseCategory(state) {
      state.selectedCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExpenseCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExpenseCategories.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.categories = payload.data;
    });
    builder.addCase(fetchExpenseCategories.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch expense categories';
    });

    builder.addCase(fetchExpenseCategoryById.fulfilled, (state, { payload }) => {
      state.selectedCategory = payload.data;
    });

    builder.addCase(createExpenseCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createExpenseCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.categories.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Expense category created successfully';
    });
    builder.addCase(createExpenseCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create expense category';
    });

    builder.addCase(updateExpenseCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateExpenseCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.categories.findIndex((c) => c.expenseCategoryId === payload.data.expenseCategoryId);
      if (index !== -1) {
        state.categories[index] = payload.data;
      }
      state.selectedCategory = payload.data;
      state.success = true;
      state.message = payload.message || 'Expense category updated successfully';
    });
    builder.addCase(updateExpenseCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update expense category';
    });

    builder.addCase(deleteExpenseCategory.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteExpenseCategory.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.categories = state.categories.filter((c) => c.expenseCategoryId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Expense category deleted successfully';
    });
    builder.addCase(deleteExpenseCategory.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete expense category';
    });
  },
});

export const { clearExpenseCategoryState, clearSelectedExpenseCategory } = expenseCategorySlice.actions;
export const expenseCategorySliceConfig = configureSlice(expenseCategorySlice, false);

export default expenseCategorySlice.reducer;

