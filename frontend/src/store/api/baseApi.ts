// ============================================
// Base API - RTK Query Configuration
// ============================================
// Single base API with tag-based caching. All
// module APIs inject endpoints into this base.
// ============================================

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../index";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7001/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Wrapper to handle 401 responses
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

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
