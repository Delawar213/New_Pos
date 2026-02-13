// ============================================
// Bank Accounts API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  BankAccount,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const bankAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBankAccounts: builder.query<PaginatedResponse<BankAccount>, PaginationParams>({
      query: (params) => ({ url: "/bank-accounts", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "BankAccounts" as const, id })),
              { type: "BankAccounts", id: "LIST" },
            ]
          : [{ type: "BankAccounts", id: "LIST" }],
    }),

    getAllBankAccounts: builder.query<BankAccount[], void>({
      query: () => "/bank-accounts/all",
      providesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    getBankAccountById: builder.query<BankAccount, number>({
      query: (id) => `/bank-accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "BankAccounts", id }],
    }),

    createBankAccount: builder.mutation<ApiResponse<BankAccount>, CreateBankAccountRequest>({
      query: (body) => ({ url: "/bank-accounts", method: "POST", body }),
      invalidatesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    updateBankAccount: builder.mutation<ApiResponse<BankAccount>, UpdateBankAccountRequest>({
      query: ({ id, ...body }) => ({ url: `/bank-accounts/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "BankAccounts", id },
        { type: "BankAccounts", id: "LIST" },
      ],
    }),

    deleteBankAccount: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/bank-accounts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBankAccountsQuery,
  useGetAllBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} = bankAccountsApi;
