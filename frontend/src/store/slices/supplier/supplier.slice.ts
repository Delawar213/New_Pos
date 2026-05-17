import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierDropdown,
  SupplierLedgerEntry,
  SupplierLedgerQuery,
  PaginatedSupplierResponse,
  SupplierBulkPaymentRequest,
} from '@/types/supplier';
import type { RootState } from '@/store';
import { fetchBankAccountsDropdown } from '@/store/slices/bankAccount/bankAccount.slice';
import type { PaginationParams } from '@/types/common';
import { listQueryParams } from '@/lib/listQueryParams';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface SupplierState {
  suppliers: Supplier[];
  activeSuppliers: Supplier[];
  dropdownSuppliers: SupplierDropdown[];
  /** True when `/suppliers/dropdown` failed (list fetch may still succeed). */
  dropdownFetchFailed: boolean;
  selectedSupplier: Supplier | null;
  supplierLedger: SupplierLedgerEntry[];
  supplierLedgerMessage: string;
  ledgerLoading: boolean;
  supplierBalance: number;
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

const initialState: SupplierState = {
  suppliers: [],
  activeSuppliers: [],
  dropdownSuppliers: [],
  dropdownFetchFailed: false,
  selectedSupplier: null,
  supplierLedger: [],
  supplierLedgerMessage: '',
  ledgerLoading: false,
  supplierBalance: 0,
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

export const fetchSuppliers = createAsyncThunk<
  ApiResponse<PaginatedSupplierResponse>,
  PaginationParams | undefined,
  { rejectValue: string; state: RootState }
>('supplier/fetchAll', async (params = {}, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedSupplierResponse>>(
      `/proxy/suppliers`,
      { params: listQueryParams(params) }
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch suppliers');
  }
});

export const fetchSupplierById = createAsyncThunk<
  ApiResponse<Supplier>,
  number,
  { rejectValue: string; state: RootState }
>('supplier/fetchById', async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Supplier>>(`/proxy/suppliers/${id}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch supplier');
  }
});

export const fetchSupplierByCode = createAsyncThunk<
  ApiResponse<Supplier>,
  string,
  { rejectValue: string; state: RootState }
>('supplier/fetchByCode', async (code, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Supplier>>(`/proxy/suppliers/code/${code}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch supplier by code');
  }
});

export const fetchActiveSuppliers = createAsyncThunk<
  ApiResponse<Supplier[]>,
  void,
  { rejectValue: string; state: RootState }
>('supplier/fetchActive', async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Supplier[]>>('/proxy/suppliers/active');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active suppliers');
  }
});

export const fetchSuppliersDropdown = createAsyncThunk<
  ApiResponse<SupplierDropdown[]>,
  void,
  { rejectValue: string; state: RootState }
>('supplier/fetchDropdown', async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<SupplierDropdown[]>>('/proxy/suppliers/dropdown');
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch suppliers dropdown');
  }
});

export const fetchSupplierLedger = createAsyncThunk<
  ApiResponse<SupplierLedgerEntry[]>,
  SupplierLedgerQuery,
  { rejectValue: string; state: RootState }
>('supplier/fetchLedger', async ({ supplierId, fromDate, toDate }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const params: Record<string, string> = {};
    if (fromDate?.trim()) params.fromDate = fromDate.trim();
    if (toDate?.trim()) params.toDate = toDate.trim();
    const response = await api.get<ApiResponse<SupplierLedgerEntry[]>>(
      `/proxy/Suppliers/${supplierId}/ledger`,
      { params }
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    const rows = Array.isArray(response.data.data) ? response.data.data : [];
    return {
      ...response.data,
      data: rows.map((row) => ({
        ...row,
        debit: Number(row.debit) || 0,
        credit: Number(row.credit) || 0,
        balance: Number(row.balance) || 0,
      })),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch supplier ledger');
  }
});

export const fetchSupplierBalance = createAsyncThunk<
  ApiResponse<number>,
  number,
  { rejectValue: string; state: RootState }
>('supplier/fetchBalance', async (supplierId, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<number>>(`/proxy/suppliers/${supplierId}/balance`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch supplier balance');
  }
});

export const createSupplier = createAsyncThunk<
  ApiResponse<Supplier>,
  CreateSupplierRequest,
  { rejectValue: string; state: RootState }
>('supplier/create', async (supplierData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Supplier>>('/proxy/suppliers', supplierData);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create supplier');
  }
});

export const updateSupplier = createAsyncThunk<
  ApiResponse<Supplier>,
  UpdateSupplierRequest,
  { rejectValue: string; state: RootState }
>('supplier/update', async (supplierData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Supplier>>(
      `/proxy/suppliers/update/${supplierData.supplierId}`,
      supplierData
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update supplier');
  }
});

export const deleteSupplier = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>('supplier/delete', async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/suppliers/delete/${id}`, { id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Supplier deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete supplier');
  }
});

export const supplierBulkPayment = createAsyncThunk<
  ApiResponse<unknown>,
  SupplierBulkPaymentRequest,
  { rejectValue: string; state: RootState }
>('supplier/bulkPayment', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>('/proxy/Suppliers/bulk-payment', payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    await dispatch(fetchBankAccountsDropdown());
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Bulk payment failed');
  }
});

const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {
    clearSupplierState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedSupplier(state) {
      state.selectedSupplier = null;
    },
    clearSupplierLedger(state) {
      state.supplierLedger = [];
      state.supplierLedgerMessage = '';
      state.error = null;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSuppliers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSuppliers.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.suppliers = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });
    builder.addCase(fetchSuppliers.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch suppliers';
    });

    builder.addCase(fetchSupplierById.fulfilled, (state, { payload }) => {
      state.selectedSupplier = payload.data;
    });
    builder.addCase(fetchSupplierByCode.fulfilled, (state, { payload }) => {
      state.selectedSupplier = payload.data;
    });
    builder.addCase(fetchActiveSuppliers.fulfilled, (state, { payload }) => {
      state.activeSuppliers = payload.data;
    });
    builder.addCase(fetchSuppliersDropdown.pending, (state) => {
      state.dropdownFetchFailed = false;
    });
    builder.addCase(fetchSuppliersDropdown.fulfilled, (state, { payload }) => {
      state.dropdownSuppliers = payload.data;
      state.dropdownFetchFailed = false;
    });
    builder.addCase(fetchSuppliersDropdown.rejected, (state) => {
      state.dropdownFetchFailed = true;
    });
    builder.addCase(fetchSupplierLedger.pending, (state) => {
      state.ledgerLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSupplierLedger.fulfilled, (state, { payload }) => {
      state.ledgerLoading = false;
      state.supplierLedger = payload.data;
      state.supplierLedgerMessage = payload.message || '';
    });
    builder.addCase(fetchSupplierLedger.rejected, (state, { payload }) => {
      state.ledgerLoading = false;
      state.supplierLedger = [];
      state.supplierLedgerMessage = '';
      state.error = payload || 'Failed to fetch supplier ledger';
    });
    builder.addCase(fetchSupplierBalance.fulfilled, (state, { payload }) => {
      state.supplierBalance = payload.data;
    });

    builder.addCase(createSupplier.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createSupplier.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.suppliers.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Supplier created successfully';
    });
    builder.addCase(createSupplier.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create supplier';
    });

    builder.addCase(updateSupplier.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateSupplier.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.suppliers.findIndex((s) => s.supplierId === payload.data.supplierId);
      if (index !== -1) {
        state.suppliers[index] = payload.data;
      }
      state.selectedSupplier = payload.data;
      state.success = true;
      state.message = payload.message || 'Supplier updated successfully';
    });
    builder.addCase(updateSupplier.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update supplier';
    });

    builder.addCase(deleteSupplier.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteSupplier.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.suppliers = state.suppliers.filter((s) => s.supplierId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Supplier deleted successfully';
    });
    builder.addCase(deleteSupplier.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete supplier';
    });

    builder.addCase(supplierBulkPayment.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(supplierBulkPayment.fulfilled, (state) => {
      state.actionLoading = false;
    });
    builder.addCase(supplierBulkPayment.rejected, (state) => {
      state.actionLoading = false;
    });
  },
});

export const { clearSupplierState, clearSelectedSupplier, clearSupplierLedger, setCurrentPage } =
  supplierSlice.actions;
export const supplierSliceConfig = configureSlice(supplierSlice, false);

export default supplierSlice.reducer;
