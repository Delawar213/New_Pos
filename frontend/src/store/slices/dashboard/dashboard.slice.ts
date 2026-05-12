// store/slices/dashboard/dashboard.slice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { DateRange } from "@/types/common";
import type {
  DashboardStats,
  RecentTransaction,
  SalesChartData,
  TopSellingProduct,
} from "@/types/dashboard";
import type { RootState } from "@/store";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[] | null;
}

function unwrapData<T>(raw: unknown): T | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if ("data" in o && o.data !== undefined) return o.data as T;
  return raw as T;
}

interface DashboardState {
  stats: DashboardStats | null;
  salesChart: SalesChartData | null;
  topSellingProducts: TopSellingProduct[];
  recentTransactions: RecentTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  salesChart: null,
  topSellingProducts: [],
  recentTransactions: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk<
  DashboardStats,
  void,
  { rejectValue: string; state: RootState }
>("dashboard/fetchStats", async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<unknown>("/proxy/dashboard/stats");
    const failMsg = getApiErrorMessage(response.data as ApiEnvelope<unknown>);
    if (failMsg) return rejectWithValue(failMsg);
    const data = unwrapData<DashboardStats>(response.data);
    if (!data || typeof data !== "object") return rejectWithValue("Invalid dashboard stats response.");
    return data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load dashboard stats");
  }
});

export const fetchSalesChart = createAsyncThunk<
  SalesChartData,
  DateRange,
  { rejectValue: string; state: RootState }
>("dashboard/fetchSalesChart", async (range, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<unknown>("/proxy/dashboard/sales-chart", { params: range });
    const failMsg = getApiErrorMessage(response.data as ApiEnvelope<unknown>);
    if (failMsg) return rejectWithValue(failMsg);
    const data = unwrapData<SalesChartData>(response.data);
    if (!data || typeof data !== "object") return rejectWithValue("Invalid sales chart response.");
    return data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load sales chart");
  }
});

export const fetchTopSellingProducts = createAsyncThunk<
  TopSellingProduct[],
  number | undefined,
  { rejectValue: string; state: RootState }
>("dashboard/fetchTopProducts", async (limit = 10, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<unknown>("/proxy/dashboard/top-products", {
      params: { limit },
    });
    const failMsg = getApiErrorMessage(response.data as ApiEnvelope<unknown>);
    if (failMsg) return rejectWithValue(failMsg);
    const data = unwrapData<TopSellingProduct[]>(response.data);
    if (!Array.isArray(data)) return rejectWithValue("Invalid top products response.");
    return data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load top products");
  }
});

export const fetchRecentDashboardTransactions = createAsyncThunk<
  RecentTransaction[],
  number | undefined,
  { rejectValue: string; state: RootState }
>("dashboard/fetchRecentTransactions", async (limit = 10, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<unknown>("/proxy/dashboard/recent-transactions", {
      params: { limit },
    });
    const failMsg = getApiErrorMessage(response.data as ApiEnvelope<unknown>);
    if (failMsg) return rejectWithValue(failMsg);
    const data = unwrapData<RecentTransaction[]>(response.data);
    if (!Array.isArray(data)) return rejectWithValue("Invalid recent transactions response.");
    return data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load recent transactions");
  }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardState(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.stats = payload;
    });
    builder.addCase(fetchDashboardStats.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to load stats";
    });

    builder.addCase(fetchSalesChart.fulfilled, (state, { payload }) => {
      state.salesChart = payload;
    });
    builder.addCase(fetchSalesChart.rejected, (state, { payload }) => {
      state.error = payload || state.error;
    });

    builder.addCase(fetchTopSellingProducts.fulfilled, (state, { payload }) => {
      state.topSellingProducts = payload;
    });
    builder.addCase(fetchTopSellingProducts.rejected, (state, { payload }) => {
      state.error = payload || state.error;
    });

    builder.addCase(fetchRecentDashboardTransactions.fulfilled, (state, { payload }) => {
      state.recentTransactions = payload;
    });
    builder.addCase(fetchRecentDashboardTransactions.rejected, (state, { payload }) => {
      state.error = payload || state.error;
    });
  },
});

export const { clearDashboardState } = dashboardSlice.actions;
export const dashboardSliceConfig = configureSlice(dashboardSlice, false);

export default dashboardSlice.reducer;
