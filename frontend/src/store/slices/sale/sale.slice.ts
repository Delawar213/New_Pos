// store/slices/sale/sale.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse, PaginationParams, PaginatedResponse } from "@/types/common";
import type { CreateSaleRequest, Sale, UpdateSaleRequest } from "@/types/sale";
import type { RootState } from "@/store";

function extractSalesPage(raw: unknown): PaginatedResponse<Sale> | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner =
    o.data != null && typeof o.data === "object" && !Array.isArray(o.data)
      ? (o.data as Record<string, unknown>)
      : o;
  const items = inner.items;
  if (!Array.isArray(items)) return null;
  return {
    items: items as Sale[],
    totalCount: Number(inner.totalCount) || 0,
    pageNumber: Number(inner.pageNumber) || 1,
    pageSize: Number(inner.pageSize) || 10,
    totalPages: Number(inner.totalPages) || 0,
    hasNextPage: Boolean(inner.hasNextPage),
    hasPreviousPage: Boolean(inner.hasPreviousPage),
  };
}

interface SaleState {
  sales: Sale[];
  selectedSale: Sale | null;
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

const initialState: SaleState = {
  sales: [],
  selectedSale: null,
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

export type FetchSalesArgs = PaginationParams & { status?: string };

export const fetchSales = createAsyncThunk<
  PaginatedResponse<Sale>,
  FetchSalesArgs | undefined,
  { rejectValue: string; state: RootState }
>("sale/fetchList", async (params = {}, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const pageNumber = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? 10;
    const response = await api.get<unknown>("/proxy/sales", {
      params: {
        pageNumber,
        pageSize,
        sortDirection: params.sortDirection,
        searchTerm: params.searchTerm,
        sortBy: params.sortBy,
        status: params.status,
      },
    });
    const body = response.data as { success?: boolean; message?: string; errors?: string[] | null };
    const failMsg = getApiErrorMessage(body);
    if (failMsg) return rejectWithValue(failMsg);
    const page = extractSalesPage(response.data);
    if (!page) return rejectWithValue("Unexpected sales list response from server.");
    return page;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch sales");
  }
});

export const fetchSaleById = createAsyncThunk<
  Sale,
  number,
  { rejectValue: string; state: RootState }
>("sale/fetchById", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<unknown>(`/proxy/sales/${id}`);
    const raw = response.data as Record<string, unknown>;
    const failMsg = getApiErrorMessage(raw as { success?: boolean; message?: string; errors?: string[] | null });
    if (failMsg) return rejectWithValue(failMsg);
    const data = raw.data ?? raw;
    if (!data || typeof data !== "object") return rejectWithValue("Unexpected sale response.");
    return data as Sale;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch sale");
  }
});

export const createSale = createAsyncThunk<
  ApiResponse<Sale>,
  CreateSaleRequest,
  { rejectValue: string; state: RootState }
>("sale/create", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Sale>>("/proxy/sales", payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to create sale");
  }
});

export const updateSale = createAsyncThunk<
  ApiResponse<Sale>,
  UpdateSaleRequest,
  { rejectValue: string; state: RootState }
>("sale/update", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const { id, ...body } = payload;
    const response = await api.put<ApiResponse<Sale>>(`/proxy/sales/${id}`, body);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to update sale");
  }
});

export const deleteSale = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("sale/delete", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.delete<ApiResponse<null>>(`/proxy/sales/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || "Sale deleted successfully" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete sale");
  }
});

const saleSlice = createSlice({
  name: "sale",
  initialState,
  reducers: {
    clearSaleState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedSale(state) {
      state.selectedSale = null;
    },
    setSalePage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSales.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSales.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.sales = payload.items;
      state.totalCount = payload.totalCount;
      state.currentPage = payload.pageNumber;
      state.pageSize = payload.pageSize;
      state.totalPages = payload.totalPages;
      state.hasPreviousPage = payload.hasPreviousPage;
      state.hasNextPage = payload.hasNextPage;
    });
    builder.addCase(fetchSales.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch sales";
    });

    builder.addCase(fetchSaleById.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSaleById.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.selectedSale = payload;
    });
    builder.addCase(fetchSaleById.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to fetch sale";
    });

    builder.addCase(createSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Sale created successfully";
    });
    builder.addCase(createSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to create sale";
    });

    builder.addCase(updateSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Sale updated successfully";
      const updated = payload.data;
      const idx = state.sales.findIndex((s) => s.id === updated.id);
      if (idx >= 0) state.sales[idx] = { ...state.sales[idx], ...updated };
      if (state.selectedSale?.id === updated.id) {
        state.selectedSale = { ...state.selectedSale, ...updated };
      }
    });
    builder.addCase(updateSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update sale";
    });

    builder.addCase(deleteSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.sales = state.sales.filter((s) => s.id !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message;
      if (state.selectedSale?.id === payload.id) state.selectedSale = null;
    });
    builder.addCase(deleteSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to delete sale";
    });
  },
});

export const { clearSaleState, clearSelectedSale, setSalePage } = saleSlice.actions;
export const saleSliceConfig = configureSlice(saleSlice, false);

export default saleSlice.reducer;
