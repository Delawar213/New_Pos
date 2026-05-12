// ============================================
// Base API - RTK Query Configuration
// ============================================
// All requests go through `/proxy/*` (same origin) so the Next server talks to the API.
// ============================================

import type { FetchArgs } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const prepareHeaders = (headers: Headers) => {
  headers.set("Content-Type", "application/json");
  return headers;
};

function ensureProxyUrl(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return path.startsWith("/proxy/") ? path : `/proxy${path}`;
}

function withProxyPath(args: string | FetchArgs): string | FetchArgs {
  if (typeof args === "string") {
    return ensureProxyUrl(args);
  }
  return { ...args, url: ensureProxyUrl(args.url) };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers) => prepareHeaders(headers),
});

const baseQueryThroughProxy: typeof rawBaseQuery = async (args, api, extraOptions) => {
  return rawBaseQuery(withProxyPath(args), api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryThroughProxy,
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
  endpoints: () => ({}),
});
