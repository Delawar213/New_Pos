// ============================================
// Dashboard API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  DashboardStats,
  SalesChartData,
  TopSellingProduct,
  RecentTransaction,
  DateRange,
} from "@/types";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/dashboard/stats",
      providesTags: [{ type: "Dashboard" }],
    }),

    getSalesChart: builder.query<SalesChartData, DateRange>({
      query: (params) => ({
        url: "/dashboard/sales-chart",
        params,
      }),
      providesTags: [{ type: "Dashboard" }],
    }),

    getTopSellingProducts: builder.query<TopSellingProduct[], number | void>({
      query: (limit = 10) => `/dashboard/top-products?limit=${limit}`,
      providesTags: [{ type: "Dashboard" }],
    }),

    getRecentTransactions: builder.query<RecentTransaction[], number | void>({
      query: (limit = 10) => `/dashboard/recent-transactions?limit=${limit}`,
      providesTags: [{ type: "Dashboard" }],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetSalesChartQuery,
  useGetTopSellingProductsQuery,
  useGetRecentTransactionsQuery,
} = dashboardApi;
