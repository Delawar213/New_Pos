// ============================================
// Base API - RTK Query Configuration
// ============================================
// Single base API with tag-based caching. All
// module APIs inject endpoints into this base.
// ============================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";

const prepareAuthHeaders = (headers: Headers, getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  const normalizedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
  if (normalizedToken) {
    headers.set("Authorization", `Bearer ${normalizedToken}`);
    headers.set("X-Access-Token", normalizedToken);
  }
  headers.set("Content-Type", "application/json");
  return headers;
};

const remoteBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7001/api",
  prepareHeaders: (headers, { getState }) => prepareAuthHeaders(headers, getState),
});

// Use same-origin for local proxy routes to avoid browser CORS issues.
const localProxyBaseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers, { getState }) => prepareAuthHeaders(headers, getState),
});

// Wrapper to handle 401 responses
const baseQueryWithReauth: typeof remoteBaseQuery = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  const useLocalProxy = typeof url === "string" && url.startsWith("/proxy/");
  const result = useLocalProxy
    ? await localProxyBaseQuery(args, api, extraOptions)
    : await remoteBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token is invalid or expired - clear auth state
    // You can implement token refresh logic here if your API supports it
    api.dispatch({ type: 'auth/clearAuthState' });
    
    // Optionally redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return result;
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
