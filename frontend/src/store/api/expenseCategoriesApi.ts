// ============================================
// Expense Categories API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  ExpenseCategory,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  ApiResponse,
} from "@/types";

export const expenseCategoriesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getExpenseCategories: builder.query<ExpenseCategory[], void>({
      query: () => "/proxy/expensecategories",
      transformResponse: (response: ApiResponse<ExpenseCategory[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ expenseCategoryId }) => ({ type: "ExpenseCategories" as const, id: expenseCategoryId })),
              { type: "ExpenseCategories", id: "LIST" },
            ]
          : [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    getAllExpenseCategories: builder.query<ExpenseCategory[], void>({
      query: () => "/proxy/expensecategories",
      transformResponse: (response: ApiResponse<ExpenseCategory[]>) => response.data,
      providesTags: [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    getExpenseCategoryById: builder.query<ExpenseCategory, number>({
      query: (id) => `/proxy/expensecategories/${id}`,
      transformResponse: (response: ApiResponse<ExpenseCategory>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "ExpenseCategories", id }],
    }),

    createExpenseCategory: builder.mutation<ApiResponse<ExpenseCategory>, CreateExpenseCategoryRequest>({
      query: (body) => ({ url: "/proxy/expensecategories", method: "POST", body }),
      invalidatesTags: [{ type: "ExpenseCategories", id: "LIST" }],
    }),

    updateExpenseCategory: builder.mutation<ApiResponse<ExpenseCategory>, UpdateExpenseCategoryRequest>({
      query: ({ expenseCategoryId, ...body }) => ({ url: `/proxy/expensecategories/${expenseCategoryId}`, method: "PUT", body: { expenseCategoryId, ...body } }),
      invalidatesTags: (_r, _e, { expenseCategoryId }) => [
        { type: "ExpenseCategories", id: expenseCategoryId },
        { type: "ExpenseCategories", id: "LIST" },
      ],
    }),

    deleteExpenseCategory: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/expensecategories/${id}`, method: "DELETE" }),
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
