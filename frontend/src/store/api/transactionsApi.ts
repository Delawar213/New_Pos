// ============================================
// Transactions API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Transaction,
  PaginatedTransactionResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const transactionsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getTransactions: builder.query<
      ApiResponse<PaginatedTransactionResponse>,
      PaginationParams
    >({
      query: (params) => ({ url: "/proxy/transactions", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.data.map(({ transactionId }) => ({ type: "Transactions" as const, id: transactionId })),
              { type: "Transactions", id: "LIST" },
            ]
          : [{ type: "Transactions", id: "LIST" }],
    }),

    getTransactionById: builder.query<Transaction, number>({
      query: (id) => `/proxy/transactions/${id}`,
      transformResponse: (response: ApiResponse<Transaction>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Transactions", id }],
    }),

    createTransaction: builder.mutation<ApiResponse<Transaction>, CreateTransactionRequest>({
      query: (body) => ({ url: "/proxy/transactions", method: "POST", body }),
      invalidatesTags: [
        { type: "Transactions", id: "LIST" },
        { type: "BankAccounts", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    updateTransaction: builder.mutation<ApiResponse<Transaction>, UpdateTransactionRequest>({
      query: ({ transactionId, ...body }) => ({ url: `/proxy/transactions/${transactionId}`, method: "PUT", body: { transactionId, ...body } }),
      invalidatesTags: (_r, _e, { transactionId }) => [
        { type: "Transactions", id: transactionId },
        { type: "Transactions", id: "LIST" },
        { type: "BankAccounts", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    deleteTransaction: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/transactions/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Transactions", id: "LIST" },
        { type: "BankAccounts", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi;
