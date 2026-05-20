// store/slices/dashboard/dashboard.slice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { DashboardSummary } from "@/types/dashboard";
import type { RootState } from "@/store";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[] | null;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSummary(raw: Record<string, unknown>): DashboardSummary {
  const topRaw = Array.isArray(raw.topSellingProducts) ? raw.topSellingProducts : [];
  const txRaw = Array.isArray(raw.recentTransactions) ? raw.recentTransactions : [];

  return {
    todaySales: num(raw.todaySales),
    todayPurchases: num(raw.todayPurchases),
    todayExpenses: num(raw.todayExpenses),
    todayProfit: num(raw.todayProfit),
    monthSales: num(raw.monthSales),
    monthPurchases: num(raw.monthPurchases),
    monthExpenses: num(raw.monthExpenses),
    monthProfit: num(raw.monthProfit),
    cashInHand: num(raw.cashInHand),
    bankBalance: num(raw.bankBalance),
    totalReceivables: num(raw.totalReceivables),
    totalPayables: num(raw.totalPayables),
    lowStockProducts: num(raw.lowStockProducts),
    outOfStockProducts: num(raw.outOfStockProducts),
    pendingSalesInvoices: num(raw.pendingSalesInvoices),
    pendingPurchaseInvoices: num(raw.pendingPurchaseInvoices),
    topSellingProducts: topRaw.map((row) => {
      const p = row as Record<string, unknown>;
      return {
        productId: num(p.productId),
        productCode: String(p.productCode ?? ""),
        productName: String(p.productName ?? ""),
        totalQuantitySold: num(p.totalQuantitySold),
        totalRevenue: num(p.totalRevenue),
        totalProfit: num(p.totalProfit),
      };
    }),
    recentTransactions: txRaw.map((row) => {
      const t = row as Record<string, unknown>;
      return {
        transactionId: num(t.transactionId),
        transactionCode: String(t.transactionCode ?? ""),
        transactionDate: String(t.transactionDate ?? ""),
        title: String(t.title ?? ""),
        amount: num(t.amount),
        status: String(t.status ?? ""),
      };
    }),
  };
}

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  loading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk<
  DashboardSummary,
  void,
  { rejectValue: string; state: RootState }
>("dashboard/fetchSummary", async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiEnvelope<Record<string, unknown>>>(
      "/proxy/dashboard/summary"
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    const data = response.data?.data;
    if (!data || typeof data !== "object") {
      return rejectWithValue("Invalid dashboard summary response.");
    }
    return normalizeSummary(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to load dashboard summary"
    );
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
    builder.addCase(fetchDashboardSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardSummary.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.summary = payload;
    });
    builder.addCase(fetchDashboardSummary.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to load dashboard";
    });
  },
});

export const { clearDashboardState } = dashboardSlice.actions;
export const dashboardSliceConfig = configureSlice(dashboardSlice, false);

export default dashboardSlice.reducer;
