// store/slices/dashboard/dashboard.slice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { DashboardSummary, ProfitRangeParams, ProfitRangeReport, ProfitInvoiceRow } from "@/types/dashboard";
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

function normalizeProfitInvoice(row: Record<string, unknown>): ProfitInvoiceRow {
  return {
    saleId: num(row.saleId),
    invoiceNumber: String(row.invoiceNumber ?? ""),
    saleDate: String(row.saleDate ?? ""),
    customerName: String(row.customerName ?? ""),
    totalItems: num(row.totalItems),
    subtotalExVat: num(row.subtotalExVat),
    discountAmount: num(row.discountAmount),
    netAmountExVat: num(row.netAmountExVat),
    totalVat: num(row.totalVat),
    totalAmountIncVat: num(row.totalAmountIncVat),
    totalCost: num(row.totalCost),
    profitAmount: num(row.profitAmount),
    profitPercentage: num(row.profitPercentage),
    paymentStatus: String(row.paymentStatus ?? ""),
  };
}

function normalizeProfitInvoicesBlock(
  raw: unknown,
  defaultPageSize: number
): Pick<
  ProfitRangeReport,
  | "invoices"
  | "totalCount"
  | "pageNumber"
  | "pageSize"
  | "totalPages"
  | "hasNextPage"
  | "hasPreviousPage"
> {
  if (Array.isArray(raw)) {
    const invoices = raw.map((row) =>
      normalizeProfitInvoice(row as Record<string, unknown>)
    );
    const totalCount = invoices.length;
    return {
      invoices,
      totalCount,
      pageNumber: 1,
      pageSize: totalCount || defaultPageSize,
      totalPages: totalCount > 0 ? 1 : 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const listRaw = Array.isArray(o.items)
      ? o.items
      : Array.isArray(o.invoices)
        ? o.invoices
        : [];
    const invoices = listRaw.map((row) =>
      normalizeProfitInvoice(row as Record<string, unknown>)
    );
    const totalCount = num(o.totalCount ?? o.totalRecords) || invoices.length;
    const pageSize = num(o.pageSize) || defaultPageSize;
    const pageNumber = num(o.pageNumber) || 1;
    let totalPages = num(o.totalPages);
    if (!totalPages && pageSize > 0) {
      totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    }
    return {
      invoices,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage: Boolean(o.hasNextPage),
      hasPreviousPage: Boolean(o.hasPreviousPage),
    };
  }

  return {
    invoices: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: defaultPageSize,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function normalizeProfitRange(
  raw: Record<string, unknown>,
  defaultPageSize: number
): ProfitRangeReport {
  const invBlock = normalizeProfitInvoicesBlock(raw.invoices, defaultPageSize);
  const totalCount = num(raw.totalCount ?? raw.totalRecords) || invBlock.totalCount;
  const pageNumber = num(raw.pageNumber) || invBlock.pageNumber;
  const pageSize = num(raw.pageSize) || invBlock.pageSize;
  let totalPages = num(raw.totalPages) || invBlock.totalPages;
  if (!totalPages && pageSize > 0) {
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  }

  return {
    totalSales: num(raw.totalSales),
    totalRevenue: num(raw.totalRevenue),
    totalCost: num(raw.totalCost),
    totalProfit: num(raw.totalProfit),
    profitPercentage: num(raw.profitPercentage),
    invoices: invBlock.invoices,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasNextPage: raw.hasNextPage != null ? Boolean(raw.hasNextPage) : invBlock.hasNextPage,
    hasPreviousPage:
      raw.hasPreviousPage != null ? Boolean(raw.hasPreviousPage) : invBlock.hasPreviousPage,
  };
}

function profitRangeQueryParams(params: ProfitRangeParams): Record<string, string | number> {
  const q: Record<string, string | number> = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 10,
  };
  const term = params.searchTerm?.trim();
  if (term) q.searchTerm = term;
  if (params.sortBy?.trim()) q.sortBy = params.sortBy.trim();
  if (params.sortDirection) q.sortDirection = params.sortDirection;
  return q;
}

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  profitReport: ProfitRangeReport | null;
  profitLoading: boolean;
  profitError: string | null;
}

const initialState: DashboardState = {
  summary: null,
  loading: false,
  error: null,
  profitReport: null,
  profitLoading: false,
  profitError: null,
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

export const fetchProfitByRange = createAsyncThunk<
  ProfitRangeReport,
  ProfitRangeParams,
  { rejectValue: string; state: RootState }
>("dashboard/fetchProfitByRange", async (params, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiEnvelope<Record<string, unknown>>>(
      "/proxy/dashboard/profit/range",
      { params: profitRangeQueryParams(params) }
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    const data = response.data?.data;
    if (!data || typeof data !== "object") {
      return rejectWithValue("Invalid profit report response.");
    }
    return normalizeProfitRange(data, params.pageSize ?? 10);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to load profit report"
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
    clearProfitReport(state) {
      state.profitReport = null;
      state.profitError = null;
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
    builder.addCase(fetchProfitByRange.pending, (state) => {
      state.profitLoading = true;
      state.profitError = null;
    });
    builder.addCase(fetchProfitByRange.fulfilled, (state, { payload }) => {
      state.profitLoading = false;
      state.profitReport = payload;
    });
    builder.addCase(fetchProfitByRange.rejected, (state, { payload }) => {
      state.profitLoading = false;
      state.profitError = payload || "Failed to load profit report";
    });
  },
});

export const { clearDashboardState, clearProfitReport } = dashboardSlice.actions;
export const dashboardSliceConfig = configureSlice(dashboardSlice, false);

export default dashboardSlice.reducer;
