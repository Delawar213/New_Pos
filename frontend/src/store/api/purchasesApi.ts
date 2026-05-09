// ============================================
// Purchases API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Purchase,
  PaginatedPurchaseResponse,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const purchasesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getPurchases: builder.query<ApiResponse<PaginatedPurchaseResponse>, PaginationParams>({
      query: (params) => ({ url: "/proxy/purchases", params }),
      providesTags: (result) => {
        const rows = result?.data?.data ?? [];
        return [
          { type: "Purchases", id: "LIST" },
          "Purchases",
          ...rows.map(({ purchaseId }) => ({ type: "Purchases" as const, id: purchaseId })),
        ];
      },
    }),

    getPurchaseById: builder.query<Purchase, number>({
      query: (id) => `/proxy/purchases/${id}`,
      transformResponse: (response: ApiResponse<Purchase>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Purchases", id }],
    }),

    createPurchase: builder.mutation<ApiResponse<Purchase>, CreatePurchaseRequest>({
      query: (body) => ({ url: "/proxy/purchases", method: "POST", body }),
      // Invalidate every purchases query (all pages / args) so the list refetches after create.
      invalidatesTags: ["Purchases", { type: "Products", id: "LIST" }, { type: "Suppliers", id: "LIST" }, "Dashboard"],
    }),

    updatePurchase: builder.mutation<ApiResponse<Purchase>, UpdatePurchaseRequest>({
      query: ({ purchaseId, ...body }) => ({ url: `/proxy/purchases/${purchaseId}`, method: "PUT", body: { purchaseId, ...body } }),
      invalidatesTags: (_r, _e, { purchaseId }) => [
        { type: "Purchases", id: purchaseId },
        "Purchases",
        { type: "Products", id: "LIST" },
        "Dashboard",
      ],
    }),

    deletePurchase: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/purchases/${id}`, method: "DELETE" }),
      invalidatesTags: ["Purchases", { type: "Products", id: "LIST" }, "Dashboard"],
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
