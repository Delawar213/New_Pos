// ============================================
// Auth API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type { LoginRequest, LoginResponse, ApiResponse } from "@/types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    getProfile: builder.query<ApiResponse<LoginResponse["user"]>, void>({
      query: () => "/auth/profile",
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
} = authApi;
