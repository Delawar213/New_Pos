// ============================================
// Categories API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /categories
    getCategories: builder.query<PaginatedResponse<Category>, PaginationParams>({
      query: (params) => ({
        url: "/categories",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Categories" as const, id })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),

    // GET /categories/all (dropdown)
    getAllCategories: builder.query<Category[], void>({
      query: () => "/categories/all",
      providesTags: [{ type: "Categories", id: "LIST" }],
    }),

    // GET /categories/:id
    getCategoryById: builder.query<Category, number>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Categories", id }],
    }),

    // POST /categories
    createCategory: builder.mutation<ApiResponse<Category>, CreateCategoryRequest>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    // PUT /categories/:id
    updateCategory: builder.mutation<ApiResponse<Category>, UpdateCategoryRequest>({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),

    // DELETE /categories/:id
    deleteCategory: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
