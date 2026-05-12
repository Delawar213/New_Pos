// ============================================
// Base API - RTK Query Configuration
// ============================================
// Single base API with tag-based caching. All
// module APIs inject endpoints into this base.
// ============================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const prepareHeaders = (headers: Headers) => {
  headers.set("Content-Type", "application/json");
  return headers;
};

const remoteBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7001/api",
  prepareHeaders: (headers) => prepareHeaders(headers),
});

// Use same-origin for local proxy routes to avoid browser CORS issues.
const localProxyBaseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers) => prepareHeaders(headers),
});

const baseQueryWithReauth: typeof remoteBaseQuery = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  const useLocalProxy = typeof url === "string" && url.startsWith("/proxy/");
  return useLocalProxy
    ? await localProxyBaseQuery(args, api, extraOptions)
    : await remoteBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  // Tag types for cache invalidation across all modules
  tagTypes: [
    "Categories",
    "Brands",
    "Products",
    "Suppliers",
    "Customers",
    "Employees",
    "BankAccounts",
    "ExpenseCategories",
    "Transactions",
    "Purchases",
    "Sales",
    "Dashboard",
  ],
  endpoints: () => ({}), // Endpoints injected from separate API files
});
