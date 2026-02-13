// ============================================
// Transactions API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<PaginatedResponse<Transaction>, PaginationParams & { type?: string }>({
      query: (params) => ({ url: "/transactions", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Transactions" as const, id })),
              { type: "Transactions", id: "LIST" },
            ]
          : [{ type: "Transactions", id: "LIST" }],
    }),

    getTransactionById: builder.query<Transaction, number>({
      query: (id) => `/transactions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Transactions", id }],
    }),

    createTransaction: builder.mutation<ApiResponse<Transaction>, CreateTransactionRequest>({
      query: (body) => ({ url: "/transactions", method: "POST", body }),
      invalidatesTags: [
        { type: "Transactions", id: "LIST" },
        { type: "BankAccounts", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    updateTransaction: builder.mutation<ApiResponse<Transaction>, UpdateTransactionRequest>({
      query: ({ id, ...body }) => ({ url: `/transactions/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Transactions", id },
        { type: "Transactions", id: "LIST" },
        { type: "BankAccounts", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    deleteTransaction: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/transactions/${id}`, method: "DELETE" }),
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
