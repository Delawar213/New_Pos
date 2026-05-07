// ============================================
// Bank Accounts API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  BankAccount,
  CashAccount,
  BankAccountDropdown,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  ApiResponse,
} from "@/types";

export const bankAccountsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getBankAccounts: builder.query<BankAccount[], void>({
      query: () => "/proxy/bankaccounts",
      transformResponse: (response: ApiResponse<BankAccount[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ bankAccountId }) => ({ type: "BankAccounts" as const, id: bankAccountId })),
              { type: "BankAccounts", id: "LIST" },
            ]
          : [{ type: "BankAccounts", id: "LIST" }],
    }),

    getAllBankAccounts: builder.query<BankAccount[], void>({
      query: () => "/proxy/bankaccounts",
      transformResponse: (response: ApiResponse<BankAccount[]>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    getCashAccounts: builder.query<CashAccount[], void>({
      query: () => "/proxy/bankaccounts/cash",
      transformResponse: (response: ApiResponse<CashAccount[]>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    getBankOnlyAccounts: builder.query<BankAccount[], void>({
      query: () => "/proxy/bankaccounts/bank",
      transformResponse: (response: ApiResponse<BankAccount[]>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    getAccountsDropdown: builder.query<BankAccountDropdown[], void>({
      query: () => "/proxy/bankaccounts/dropdown",
      transformResponse: (response: ApiResponse<BankAccountDropdown[]>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    getBankAccountById: builder.query<BankAccount, number>({
      query: (id) => `/proxy/bankaccounts/${id}`,
      transformResponse: (response: ApiResponse<BankAccount>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "BankAccounts", id }],
    }),

    getAccountBalance: builder.query<number, number>({
      query: (id) => `/proxy/bankaccounts/${id}/balance`,
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "BankAccounts", id: `BALANCE-${id}` }],
    }),

    getTotalCashBalance: builder.query<number, void>({
      query: () => "/proxy/bankaccounts/totals/cash",
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "TOTAL-CASH-BALANCE" }],
    }),

    getTotalBankBalance: builder.query<number, void>({
      query: () => "/proxy/bankaccounts/totals/bank",
      transformResponse: (response: ApiResponse<number>) => response.data,
      providesTags: [{ type: "BankAccounts", id: "TOTAL-BANK-BALANCE" }],
    }),

    createBankAccount: builder.mutation<ApiResponse<BankAccount>, CreateBankAccountRequest>({
      query: (body) => ({ url: "/proxy/bankaccounts", method: "POST", body }),
      invalidatesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),

    updateBankAccount: builder.mutation<ApiResponse<BankAccount>, UpdateBankAccountRequest>({
      query: ({ bankAccountId, ...body }) => ({ url: `/proxy/bankaccounts/${bankAccountId}`, method: "PUT", body: { bankAccountId, ...body } }),
      invalidatesTags: (_r, _e, { bankAccountId }) => [
        { type: "BankAccounts", id: bankAccountId },
        { type: "BankAccounts", id: "LIST" },
      ],
    }),

    deleteBankAccount: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/bankaccounts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "BankAccounts", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBankAccountsQuery,
  useGetAllBankAccountsQuery,
  useGetCashAccountsQuery,
  useGetBankOnlyAccountsQuery,
  useGetAccountsDropdownQuery,
  useGetBankAccountByIdQuery,
  useGetAccountBalanceQuery,
  useGetTotalCashBalanceQuery,
  useGetTotalBankBalanceQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} = bankAccountsApi;
