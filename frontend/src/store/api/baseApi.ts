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

// Wrapper to handle 401 and auto-refresh tokens
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: {
            token: state.auth.token,
            refreshToken: refreshToken,
          },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // Store the new tokens
        api.dispatch({
          type: "auth/tokenRefreshed",
          payload: refreshResult.data,
        });
        // Retry original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed — logout
        api.dispatch({ type: "auth/logout" });
      }
    } else {
      api.dispatch({ type: "auth/logout" });
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
