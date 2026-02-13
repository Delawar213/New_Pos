// ============================================
// Brands API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<PaginatedResponse<Brand>, PaginationParams>({
      query: (params) => ({ url: "/brands", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Brands" as const, id })),
              { type: "Brands", id: "LIST" },
            ]
          : [{ type: "Brands", id: "LIST" }],
    }),

    getAllBrands: builder.query<Brand[], void>({
      query: () => "/brands/all",
      providesTags: [{ type: "Brands", id: "LIST" }],
    }),

    getBrandById: builder.query<Brand, number>({
      query: (id) => `/brands/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Brands", id }],
    }),

    createBrand: builder.mutation<ApiResponse<Brand>, CreateBrandRequest>({
      query: (body) => ({ url: "/brands", method: "POST", body }),
      invalidatesTags: [{ type: "Brands", id: "LIST" }],
    }),

    updateBrand: builder.mutation<ApiResponse<Brand>, UpdateBrandRequest>({
      query: ({ id, ...body }) => ({ url: `/brands/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Brands", id },
        { type: "Brands", id: "LIST" },
      ],
    }),

    deleteBrand: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/brands/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Brands", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useGetAllBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi;
