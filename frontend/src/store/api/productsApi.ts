// ============================================
// Products API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, PaginationParams>({
      query: (params) => ({ url: "/products", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Products" as const, id })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),

    getAllProducts: builder.query<Product[], void>({
      query: () => "/products/all",
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    getProductById: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),

    searchProducts: builder.query<Product[], string>({
      query: (term) => `/products/search?term=${term}`,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    getProductByBarcode: builder.query<Product, string>({
      query: (barcode) => `/products/barcode/${barcode}`,
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductRequest>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductRequest>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),

    deleteProduct: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
  useGetProductByBarcodeQuery,
  useLazyGetProductByBarcodeQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
