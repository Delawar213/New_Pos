// store/slices/transaction/transaction.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse, PaginationParams } from "@/types/common";
import type {
  CreateTransactionRequest,
  PaginatedTransactionResponse,
  Transaction,
  UpdateTransactionRequest,
} from "@/types/transaction";
import type { RootState } from "@/store";
import { listQueryParams } from "@/lib/listQueryParams";

interface TransactionState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
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

const initialState: TransactionState = {
  transactions: [],
  selectedTransaction: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: "",
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export const fetchTransactions = createAsyncThunk<
  ApiResponse<PaginatedTransactionResponse>,
  PaginationParams | undefined,
  { rejectValue: string; state: RootState }
>("transaction/fetchList", async (params = {}, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedTransactionResponse>>("/proxy/transactions", {
      params: listQueryParams(params),
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch transactions");
  }
});

export const fetchTransactionById = createAsyncThunk<
  ApiResponse<Transaction>,
  number,
  { rejectValue: string; state: RootState }
>("transaction/fetchById", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Transaction>>(`/proxy/transactions/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch transaction");
  }
});

export const createTransaction = createAsyncThunk<
  ApiResponse<Transaction>,
  CreateTransactionRequest,
  { rejectValue: string; state: RootState }
>("transaction/create", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Transaction>>("/proxy/transactions", payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to create transaction");
  }
});

export const updateTransaction = createAsyncThunk<
  ApiResponse<Transaction>,
  UpdateTransactionRequest,
  { rejectValue: string; state: RootState }
>("transaction/update", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const { transactionId, ...rest } = payload;
    const response = await api.put<ApiResponse<Transaction>>(`/proxy/transactions/${transactionId}`, {
      transactionId,
      ...rest,
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to update transaction");
  }
});

export const deleteTransaction = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("transaction/delete", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.delete<ApiResponse<null>>(`/proxy/transactions/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || "Transaction deleted successfully" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete transaction");
  }
});

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    clearTransactionState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedTransaction(state) {
      state.selectedTransaction = null;
    },
    setTransactionPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactions.fulfilled, (state, { payload }) => {
      state.loading = false;
      const page = payload.data;
      state.transactions = page.data;
      state.totalCount = page.totalRecords;
      state.currentPage = page.pageNumber;
      state.pageSize = page.pageSize;
      state.totalPages = page.totalPages;
      state.hasPreviousPage = page.hasPreviousPage;
      state.hasNextPage = page.hasNextPage;
    });
    builder.addCase(fetchTransactions.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch transactions";
    });

    builder.addCase(fetchTransactionById.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactionById.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.selectedTransaction = payload.data;
    });
    builder.addCase(fetchTransactionById.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to fetch transaction";
    });

    builder.addCase(createTransaction.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createTransaction.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Transaction created successfully";
    });
    builder.addCase(createTransaction.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to create transaction";
    });

    builder.addCase(updateTransaction.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateTransaction.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Transaction updated successfully";
      const updated = payload.data;
      const idx = state.transactions.findIndex((t) => t.transactionId === updated.transactionId);
      if (idx >= 0) state.transactions[idx] = { ...state.transactions[idx], ...updated };
      if (state.selectedTransaction?.transactionId === updated.transactionId) {
        state.selectedTransaction = { ...state.selectedTransaction, ...updated };
      }
    });
    builder.addCase(updateTransaction.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update transaction";
    });

    builder.addCase(deleteTransaction.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteTransaction.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.transactions = state.transactions.filter((t) => t.transactionId !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message;
      if (state.selectedTransaction?.transactionId === payload.id) state.selectedTransaction = null;
    });
    builder.addCase(deleteTransaction.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to delete transaction";
    });
  },
});

export const { clearTransactionState, clearSelectedTransaction, setTransactionPage } =
  transactionSlice.actions;
export const transactionSliceConfig = configureSlice(transactionSlice, false);

export default transactionSlice.reducer;
