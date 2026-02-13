// ============================================
// Expense Categories API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  ExpenseCategory,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const expenseCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenseCategories: builder.query<PaginatedResponse<ExpenseCategory>, PaginationParams>({
      query: (params) => ({ url: "/expense-categories", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "ExpenseCategories" as const, id })),
              { type: "ExpenseCategories", id: "LIST" },
            ]
          : [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    getAllExpenseCategories: builder.query<ExpenseCategory[], void>({
      query: () => "/expense-categories/all",
      providesTags: [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    getExpenseCategoryById: builder.query<ExpenseCategory, number>({
      query: (id) => `/expense-categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ExpenseCategories", id }],
    }),

    createExpenseCategory: builder.mutation<ApiResponse<ExpenseCategory>, CreateExpenseCategoryRequest>({
      query: (body) => ({ url: "/expense-categories", method: "POST", body }),
      invalidatesTags: [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    updateExpenseCategory: builder.mutation<ApiResponse<ExpenseCategory>, UpdateExpenseCategoryRequest>({
      query: ({ id, ...body }) => ({ url: `/expense-categories/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ExpenseCategories", id },
        { type: "ExpenseCategories", id: "LIST" },
      ],
    }),

    deleteExpenseCategory: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/expense-categories/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "ExpenseCategories", id: "LIST" }],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useGetAllExpenseCategoriesQuery,
  useGetExpenseCategoryByIdQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} = expenseCategoriesApi;
