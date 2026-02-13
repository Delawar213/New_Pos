// ============================================
// Customers API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, PaginationParams>({
      query: (params) => ({ url: "/customers", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Customers" as const, id })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    getAllCustomers: builder.query<Customer[], void>({
      query: () => "/customers/all",
      providesTags: [{ type: "Customers", id: "LIST" }],
    }),

    getCustomerById: builder.query<Customer, number>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),

    createCustomer: builder.mutation<ApiResponse<Customer>, CreateCustomerRequest>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<ApiResponse<Customer>, UpdateCustomerRequest>({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetAllCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
