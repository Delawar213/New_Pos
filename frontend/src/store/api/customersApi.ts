// ============================================
// Customers API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerType,
  CustomerDropdown,
  CustomerLoyaltyRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const customersApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getCustomers: builder.query<
      ApiResponse<{
        data: Customer[];
        totalRecords: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
      }>,
      PaginationParams
    >({
      query: (params) => ({ url: "/proxy/customers", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.data.map(({ customerId }) => ({ type: "Customers" as const, id: customerId })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    getActiveCustomers: builder.query<Customer[], void>({
      query: () => "/proxy/customers/active",
      transformResponse: (response: ApiResponse<Customer[]>) => response.data,
      providesTags: [{ type: "Customers", id: "LIST" }],
    }),

    getWalkingCustomer: builder.query<Customer, void>({
      query: () => "/proxy/customers/walking",
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      providesTags: [{ type: "Customers", id: "WALKING" }],
    }),

    getCustomerTypes: builder.query<CustomerType[], void>({
      query: () => "/proxy/customers/types",
      transformResponse: (response: ApiResponse<CustomerType[]>) => response.data,
      providesTags: [{ type: "Customers", id: "TYPES" }],
    }),

    getCustomersDropdown: builder.query<CustomerDropdown[], void>({
      query: () => "/proxy/customers/dropdown",
      transformResponse: (response: ApiResponse<CustomerDropdown[]>) => response.data,
      providesTags: [{ type: "Customers", id: "LIST" }],
    }),

    getCustomerById: builder.query<Customer, number>({
      query: (id) => `/proxy/customers/${id}`,
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),

    getCustomerByCode: builder.query<Customer, string>({
      query: (code) => `/proxy/customers/code/${code}`,
      transformResponse: (response: ApiResponse<Customer>) => response.data,
      providesTags: (_r, _e, code) => [{ type: "Customers", id: code }],
    }),

    getCustomerBalance: builder.query<number, number>({
      query: (id) => `/proxy/customers/${id}/balance`,
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Customers", id: `BALANCE-${id}` }],
    }),

    getCustomerLedger: builder.query<unknown[], { customerId: number; fromDate: string; toDate: string }>({
      query: ({ customerId, fromDate, toDate }) =>
        `/proxy/customers/${customerId}/ledger?fromDate=${fromDate}&toDate=${toDate}`,
      transformResponse: (response: ApiResponse<unknown[]>) => response.data,
      providesTags: (_r, _e, { customerId }) => [{ type: "Customers", id: `LEDGER-${customerId}` }],
    }),

    getCustomerLoyalty: builder.query<number, number>({
      query: (id) => `/proxy/customers/${id}/loyalty`,
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Customers", id: `LOYALTY-${id}` }],
    }),

    addCustomerLoyalty: builder.mutation<ApiResponse<boolean>, { customerId: number; body: CustomerLoyaltyRequest }>({
      query: ({ customerId, body }) => ({
        url: `/proxy/customers/${customerId}/loyalty/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { customerId }) => [{ type: "Customers", id: `LOYALTY-${customerId}` }],
    }),

    redeemCustomerLoyalty: builder.mutation<ApiResponse<boolean>, { customerId: number; body: CustomerLoyaltyRequest }>({
      query: ({ customerId, body }) => ({
        url: `/proxy/customers/${customerId}/loyalty/redeem`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { customerId }) => [{ type: "Customers", id: `LOYALTY-${customerId}` }],
    }),

    createCustomer: builder.mutation<ApiResponse<Customer>, CreateCustomerRequest>({
      query: (body) => ({ url: "/proxy/customers", method: "POST", body }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<ApiResponse<Customer>, UpdateCustomerRequest>({
      query: ({ customerId, ...body }) => ({ url: `/proxy/customers/${customerId}`, method: "PUT", body: { customerId, ...body } }),
      invalidatesTags: (_r, _e, { customerId }) => [
        { type: "Customers", id: customerId },
        { type: "Customers", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/customers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetActiveCustomersQuery,
  useGetWalkingCustomerQuery,
  useGetCustomerTypesQuery,
  useGetCustomersDropdownQuery,
  useGetCustomerByIdQuery,
  useGetCustomerByCodeQuery,
  useGetCustomerBalanceQuery,
  useGetCustomerLedgerQuery,
  useGetCustomerLoyaltyQuery,
  useAddCustomerLoyaltyMutation,
  useRedeemCustomerLoyaltyMutation,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
