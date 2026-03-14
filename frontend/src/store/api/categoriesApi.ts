// ============================================
// Categories API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const categoriesApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    // GET /categories?pageNumber=1&pageSize=10
    getCategories: builder.query<Category[], PaginationParams>({
      query: (params) => ({
        url: "/categories",
        params,
      }),
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ categoryId }) => ({ type: "Categories" as const, id: categoryId })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),

    // GET /categories/active
    getActiveCategories: builder.query<Category[], void>({
      query: () => "/categories/active",
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
      providesTags: [{ type: "Categories", id: "LIST" }],
    }),

    // GET /categories/:id
    getCategoryById: builder.query<Category, number>({
      query: (id) => `/categories/${id}`,
      transformResponse: (response: ApiResponse<Category>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Categories", id }],
    }),

    // POST /categories
    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    // PUT /categories/:id
    updateCategory: builder.mutation<Category, UpdateCategoryRequest>({
      query: ({ categoryId, ...body }) => ({
        url: `/categories/${categoryId}`,
        method: "PUT",
        body: { categoryId, ...body },
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data,
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: "Categories", id: categoryId },
        { type: "Categories", id: "LIST" },
      ],
    }),

    // DELETE /categories/:id
    deleteCategory: builder.mutation<void, number>({
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
  useGetActiveCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
