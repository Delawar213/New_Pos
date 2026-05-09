// ============================================
// Suppliers API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierDropdown,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const suppliersApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getSuppliers: builder.query<ApiResponse<{ data: Supplier[]; totalRecords: number; pageNumber: number; pageSize: number; totalPages: number; hasPreviousPage: boolean; hasNextPage: boolean }>, PaginationParams>({
      query: (params) => ({ url: "/proxy/suppliers", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.data.map(({ supplierId }) => ({ type: "Suppliers" as const, id: supplierId })),
              { type: "Suppliers", id: "LIST" },
            ]
          : [{ type: "Suppliers", id: "LIST" }],
    }),

    getActiveSuppliers: builder.query<Supplier[], void>({
      query: () => "/proxy/suppliers/active",
      transformResponse: (response: ApiResponse<Supplier[]>) => response.data,
      providesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    getSuppliersDropdown: builder.query<SupplierDropdown[], void>({
      query: () => "/proxy/suppliers/dropdown",
      transformResponse: (response: ApiResponse<SupplierDropdown[]>) => response.data,
      providesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    getSupplierById: builder.query<Supplier, number>({
      query: (id) => `/proxy/suppliers/${id}`,
      transformResponse: (response: ApiResponse<Supplier>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Suppliers", id }],
    }),

    getSupplierByCode: builder.query<Supplier, string>({
      query: (code) => `/proxy/suppliers/code/${code}`,
      transformResponse: (response: ApiResponse<Supplier>) => response.data,
      providesTags: (_r, _e, code) => [{ type: "Suppliers", id: code }],
    }),

    getSupplierLedger: builder.query<unknown[], { supplierId: number; fromDate: string; toDate: string }>({
      query: ({ supplierId, fromDate, toDate }) =>
        `/proxy/suppliers/${supplierId}/ledger?fromDate=${fromDate}&toDate=${toDate}`,
      transformResponse: (response: ApiResponse<unknown[]>) => response.data,
      providesTags: (_r, _e, { supplierId }) => [{ type: "Suppliers", id: `LEDGER-${supplierId}` }],
    }),

    getSupplierBalance: builder.query<number, number>({
      query: (supplierId) => `/proxy/suppliers/${supplierId}/balance`,
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: (_r, _e, supplierId) => [{ type: "Suppliers", id: `BALANCE-${supplierId}` }],
    }),

    createSupplier: builder.mutation<ApiResponse<Supplier>, CreateSupplierRequest>({
      query: (body) => ({ url: "/proxy/suppliers", method: "POST", body }),
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<ApiResponse<Supplier>, UpdateSupplierRequest>({
      query: ({ supplierId, ...body }) => ({
        url: `/proxy/suppliers/update/${supplierId}`,
        method: "POST",
        body: { supplierId, ...body },
      }),
      invalidatesTags: (_r, _e, { supplierId }) => [
        { type: "Suppliers", id: supplierId },
        { type: "Suppliers", id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/suppliers/delete/${id}`, method: "POST", body: { id } }),
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetActiveSuppliersQuery,
  useGetSuppliersDropdownQuery,
  useGetSupplierByIdQuery,
  useGetSupplierByCodeQuery,
  useGetSupplierLedgerQuery,
  useGetSupplierBalanceQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi;
