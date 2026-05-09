// ============================================
// Products API - RTK Query Endpoints
// ============================================

import { baseApi } from "./baseApi";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  PaginatedProductResponse,
  ApiResponse,
  PaginationParams,
} from "@/types";

export const productsApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getProducts: builder.query<
      {
        items: Product[];
        totalCount: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      },
      PaginationParams
    >({
      query: (params) => ({ url: "/proxy/products", params }),
      transformResponse: (response: ApiResponse<PaginatedProductResponse>) => {
        const d = response.data;
        return {
          items: d.data,
          totalCount: d.totalRecords,
          pageNumber: d.pageNumber,
          pageSize: d.pageSize,
          totalPages: d.totalPages,
          hasNextPage: d.hasNextPage,
          hasPreviousPage: d.hasPreviousPage,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ productId }) => ({ type: "Products" as const, id: productId })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),

    getAllProducts: builder.query<Product[], void>({
      query: () => "/proxy/products?pageNumber=1&pageSize=500",
      transformResponse: (response: ApiResponse<PaginatedProductResponse>) => response.data.data,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    getProductById: builder.query<Product, number>({
      query: (id) => `/proxy/products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),

    searchProducts: builder.query<Product[], string>({
      query: (term) => `/proxy/products/search?term=${encodeURIComponent(term)}`,
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    getProductByBarcode: builder.query<Product, string>({
      query: (barcode) => `/proxy/products/barcode/${encodeURIComponent(barcode)}`,
      transformResponse: (response: ApiResponse<Product>) => response.data,
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductRequest>({
      query: (body) => ({ url: "/proxy/products", method: "POST", body }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductRequest>({
      query: ({ productId, ...body }) => ({
        url: `/proxy/products/update/${productId}`,
        method: "POST",
        body: { productId, ...body },
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: "Products", id: productId },
        { type: "Products", id: "LIST" },
      ],
    }),

    deleteProduct: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/proxy/products/delete/${id}`, method: "POST", body: { id } }),
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
