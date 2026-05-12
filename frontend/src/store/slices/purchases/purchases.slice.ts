// store/slices/purchases/purchases.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse, PaginationParams } from "@/types/common";
import type {
  CreatePurchaseRequest,
  PaginatedPurchaseResponse,
  Purchase,
  SupplierPurchasePaymentRequest,
  UpdatePurchaseRequest,
} from "@/types/purchase";
import type { RootState } from "@/store";
import { listQueryParams } from "@/lib/listQueryParams";

interface PurchasesState {
  purchases: Purchase[];
  selectedPurchase: Purchase | null;
  unpaidPurchases: Purchase[];
  unpaidLoading: boolean;
  unpaidError: string | null;
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

const initialState: PurchasesState = {
  purchases: [],
  selectedPurchase: null,
  unpaidPurchases: [],
  unpaidLoading: false,
  unpaidError: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: "",
  totalCount: 0,
  currentPage: 1,
  pageSize: 25,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export const fetchPurchases = createAsyncThunk<
  ApiResponse<PaginatedPurchaseResponse>,
  PaginationParams | undefined,
  { rejectValue: string; state: RootState }
>("purchases/fetchList", async (params = {}, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedPurchaseResponse>>("/proxy/purchases", {
      params: listQueryParams({
        ...params,
        pageSize: params.pageSize ?? 25,
        pageNumber: params.pageNumber ?? 1,
      }),
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch purchases");
  }
});

export const fetchPurchaseById = createAsyncThunk<
  ApiResponse<Purchase>,
  number,
  { rejectValue: string; state: RootState }
>("purchases/fetchById", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Purchase>>(`/proxy/purchases/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch purchase");
  }
});

/** Returns raw response body for client-side interpretation (nested / PascalCase payloads). */
export const createPurchase = createAsyncThunk<
  unknown,
  CreatePurchaseRequest,
  { rejectValue: string; state: RootState }
>("purchases/create", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<unknown>("/proxy/purchases", payload);
    const body = response.data as {
      success?: boolean;
      message?: string;
      errors?: string[] | null;
    };
    const failMsg = getApiErrorMessage(body);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to create purchase");
  }
});

export const updatePurchase = createAsyncThunk<
  ApiResponse<Purchase>,
  UpdatePurchaseRequest,
  { rejectValue: string; state: RootState }
>("purchases/update", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const { purchaseId, ...rest } = payload;
    const response = await api.post<ApiResponse<Purchase>>(`/proxy/purchases/update/${purchaseId}`, {
      purchaseId,
      ...rest,
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to update purchase");
  }
});

/** Unpaid / outstanding purchases for a supplier (`GET .../purchases/unpaid?supplierId=`). */
export const fetchUnpaidPurchasesBySupplier = createAsyncThunk<
  ApiResponse<Purchase[]>,
  number,
  { rejectValue: string; state: RootState }
>("purchases/fetchUnpaidBySupplier", async (supplierId, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Purchase[]>>("/proxy/purchases/unpaid", {
      params: { supplierId },
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load unpaid purchases");
  }
});

/**
 * Record payment against a purchase. Adjust URL/body if your API differs (e.g. `/purchases/payment`, PascalCase).
 */
export const paySupplierPurchase = createAsyncThunk<
  ApiResponse<unknown>,
  SupplierPurchasePaymentRequest,
  { rejectValue: string; state: RootState }
>("purchases/paySupplier", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>("/proxy/purchases/pay", payload);
    const body = response.data as { success?: boolean; message?: string };
    const failMsg = getApiErrorMessage(body);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to record payment");
  }
});

export const deletePurchase = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("purchases/delete", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<null>>(`/proxy/purchases/delete/${id}`, { purchaseId: id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || "Purchase deleted successfully" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete purchase");
  }
});

const purchasesSlice = createSlice({
  name: "purchases",
  initialState,
  reducers: {
    clearPurchasesState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedPurchase(state) {
      state.selectedPurchase = null;
    },
    clearUnpaidPurchases(state) {
      state.unpaidPurchases = [];
      state.unpaidLoading = false;
      state.unpaidError = null;
    },
    setPurchasesPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnpaidPurchasesBySupplier.pending, (state) => {
      state.unpaidLoading = true;
      state.unpaidError = null;
    });
    builder.addCase(fetchUnpaidPurchasesBySupplier.fulfilled, (state, { payload }) => {
      state.unpaidLoading = false;
      const rows = payload.data;
      state.unpaidPurchases = Array.isArray(rows) ? rows : [];
    });
    builder.addCase(fetchUnpaidPurchasesBySupplier.rejected, (state, { payload }) => {
      state.unpaidLoading = false;
      state.unpaidError = payload || "Failed to load unpaid purchases";
      state.unpaidPurchases = [];
    });

    builder.addCase(paySupplierPurchase.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(paySupplierPurchase.fulfilled, (state) => {
      state.actionLoading = false;
    });
    builder.addCase(paySupplierPurchase.rejected, (state) => {
      state.actionLoading = false;
    });

    builder.addCase(fetchPurchases.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPurchases.fulfilled, (state, { payload }) => {
      state.loading = false;
      const page = payload.data;
      state.purchases = page.data;
      state.totalCount = page.totalRecords;
      state.currentPage = page.pageNumber;
      state.pageSize = page.pageSize;
      state.totalPages = page.totalPages;
      state.hasPreviousPage = page.hasPreviousPage;
      state.hasNextPage = page.hasNextPage;
    });
    builder.addCase(fetchPurchases.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch purchases";
    });

    builder.addCase(fetchPurchaseById.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPurchaseById.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.selectedPurchase = payload.data;
    });
    builder.addCase(fetchPurchaseById.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to fetch purchase";
    });

    builder.addCase(createPurchase.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createPurchase.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const env = payload as { message?: string };
      state.success = true;
      state.message = typeof env?.message === "string" && env.message ? env.message : "Purchase created successfully";
    });
    builder.addCase(createPurchase.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to create purchase";
    });

    builder.addCase(updatePurchase.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updatePurchase.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Purchase updated successfully";
      const updated = payload.data;
      const idx = state.purchases.findIndex((p) => p.purchaseId === updated.purchaseId);
      if (idx >= 0) state.purchases[idx] = { ...state.purchases[idx], ...updated };
      if (state.selectedPurchase?.purchaseId === updated.purchaseId) {
        state.selectedPurchase = { ...state.selectedPurchase, ...updated };
      }
    });
    builder.addCase(updatePurchase.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update purchase";
    });

    builder.addCase(deletePurchase.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deletePurchase.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.purchases = state.purchases.filter((p) => p.purchaseId !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message;
      if (state.selectedPurchase?.purchaseId === payload.id) state.selectedPurchase = null;
    });
    builder.addCase(deletePurchase.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to delete purchase";
    });
  },
});

export const { clearPurchasesState, clearSelectedPurchase, clearUnpaidPurchases, setPurchasesPage } =
  purchasesSlice.actions;
export const purchasesSliceConfig = configureSlice(purchasesSlice, false);

export default purchasesSlice.reducer;
