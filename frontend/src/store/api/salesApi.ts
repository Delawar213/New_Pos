// ============================================
// Sales API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Sale,
  CreateSaleRequest,
  UpdateSaleRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<PaginatedResponse<Sale>, PaginationParams & { status?: string }>({
      query: (params) => ({ url: "/sales", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Sales" as const, id })),
              { type: "Sales", id: "LIST" },
            ]
          : [{ type: "Sales", id: "LIST" }],
    }),

    getSaleById: builder.query<Sale, number>({
      query: (id) => `/sales/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Sales", id }],
    }),

    createSale: builder.mutation<ApiResponse<Sale>, CreateSaleRequest>({
      query: (body) => ({ url: "/sales", method: "POST", body }),
      invalidatesTags: [
        { type: "Sales", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Customers", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    updateSale: builder.mutation<ApiResponse<Sale>, UpdateSaleRequest>({
      query: ({ id, ...body }) => ({ url: `/sales/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Sales", id },
        { type: "Sales", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    deleteSale: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/sales/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Sales", id: "LIST" },
        { type: "Products", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} = salesApi;
