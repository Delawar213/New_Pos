// ============================================
// Suppliers API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<PaginatedResponse<Supplier>, PaginationParams>({
      query: (params) => ({ url: "/suppliers", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Suppliers" as const, id })),
              { type: "Suppliers", id: "LIST" },
            ]
          : [{ type: "Suppliers", id: "LIST" }],
    }),

    getAllSuppliers: builder.query<Supplier[], void>({
      query: () => "/suppliers/all",
      providesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    getSupplierById: builder.query<Supplier, number>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Suppliers", id }],
    }),

    createSupplier: builder.mutation<ApiResponse<Supplier>, CreateSupplierRequest>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<ApiResponse<Supplier>, UpdateSupplierRequest>({
      query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Suppliers", id },
        { type: "Suppliers", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
