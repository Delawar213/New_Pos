import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { configureSlice } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierDropdown,
  SupplierLedgerEntry,
  PaginatedSupplierResponse,
} from '@/types/supplier';
import type { RootState } from '@/store';

const createAuthenticatedRequest = () => {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

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
  selectedSupplier: Supplier | null;
  supplierLedger: SupplierLedgerEntry[];
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
  selectedSupplier: null,
  supplierLedger: [],
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
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>('supplier/fetchAll', async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
    const response = await api.get<ApiResponse<PaginatedSupplierResponse>>(
      `/proxy/suppliers?pageNumber=${pageNumber}&pageSize=${pageSize}`
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
>('supplier/fetchById', async (id, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/fetchByCode', async (code, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/fetchActive', async (_, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/fetchDropdown', async (_, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
    const response = await api.get<ApiResponse<SupplierDropdown[]>>('/proxy/suppliers/dropdown');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch suppliers dropdown');
  }
});

export const fetchSupplierLedger = createAsyncThunk<
  ApiResponse<SupplierLedgerEntry[]>,
  { supplierId: number; fromDate: string; toDate: string },
  { rejectValue: string; state: RootState }
>('supplier/fetchLedger', async ({ supplierId, fromDate, toDate }, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
    const response = await api.get<ApiResponse<SupplierLedgerEntry[]>>(
      `/proxy/suppliers/${supplierId}/ledger?fromDate=${fromDate}&toDate=${toDate}`
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch supplier ledger');
  }
});

export const fetchSupplierBalance = createAsyncThunk<
  ApiResponse<number>,
  number,
  { rejectValue: string; state: RootState }
>('supplier/fetchBalance', async (supplierId, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/create', async (supplierData, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/update', async (supplierData, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
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
>('supplier/delete', async (id, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/suppliers/delete/${id}`, { id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Supplier deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete supplier');
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
    builder.addCase(fetchSuppliersDropdown.fulfilled, (state, { payload }) => {
      state.dropdownSuppliers = payload.data;
    });
    builder.addCase(fetchSupplierLedger.fulfilled, (state, { payload }) => {
      state.supplierLedger = payload.data;
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
  },
});

export const { clearSupplierState, clearSelectedSupplier, setCurrentPage } = supplierSlice.actions;
export const supplierSliceConfig = configureSlice(supplierSlice, false);

export default supplierSlice.reducer;
