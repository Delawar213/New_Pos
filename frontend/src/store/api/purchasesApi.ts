// ============================================
// Purchases API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Purchase,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchases: builder.query<PaginatedResponse<Purchase>, PaginationParams & { status?: string }>({
      query: (params) => ({ url: "/purchases", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Purchases" as const, id })),
              { type: "Purchases", id: "LIST" },
            ]
          : [{ type: "Purchases", id: "LIST" }],
    }),

    getPurchaseById: builder.query<Purchase, number>({
      query: (id) => `/purchases/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Purchases", id }],
    }),

    createPurchase: builder.mutation<ApiResponse<Purchase>, CreatePurchaseRequest>({
      query: (body) => ({ url: "/purchases", method: "POST", body }),
      invalidatesTags: [
        { type: "Purchases", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Suppliers", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    updatePurchase: builder.mutation<ApiResponse<Purchase>, UpdatePurchaseRequest>({
      query: ({ id, ...body }) => ({ url: `/purchases/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Purchases", id },
        { type: "Purchases", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    deletePurchase: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/purchases/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Purchases", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),
  }),
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
} = purchasesApi;
