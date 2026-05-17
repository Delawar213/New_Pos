// store/slices/product/product.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type {
  CreateProductRequest,
  PaginatedProductResponse,
  Product,
  ProductBatchesForPricing,
  ProductListMode,
  ProductPosSearchRow,
  ProductStockAlertRow,
  UpdateProductRequest,
  UpdateProductSellingPriceRequest,
} from "@/types/product";
import {
  mapPosSearchRowToProduct,
  mapStockAlertRowToProduct,
  normalizeProductRow,
} from "@/lib/productListMappers";
import { isBarcodeQuery, isProductCodeQuery } from "@/lib/productSearchResolve";
import type { RootState } from "@/store";
import type { PaginationParams } from "@/types/common";
import { listQueryParams } from "@/lib/listQueryParams";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface ProductListFilterResult {
  items: Product[];
  mode: ProductListMode;
  label: string;
}

interface ProductState {
  products: Product[];
  listMode: ProductListMode;
  listFilterLabel: string;
  /** Large product list for dropdowns (e.g. purchase lines). */
  allProducts: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  catalogLoading: boolean;
  barcodeLookupLoading: boolean;
  pricingLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  message: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const initialState: ProductState = {
  products: [],
  listMode: "catalog",
  listFilterLabel: "",
  allProducts: [],
  selectedProduct: null,
  loading: false,
  catalogLoading: false,
  barcodeLookupLoading: false,
  pricingLoading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: "",
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export const fetchProducts = createAsyncThunk<
  ApiResponse<PaginatedProductResponse>,
  PaginationParams | undefined,
  { rejectValue: string; state: RootState }
>("product/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedProductResponse>>(
      `/proxy/products`,
      { params: listQueryParams(params) }
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch products");
  }
});

export const createProduct = createAsyncThunk<
  ApiResponse<Product>,
  CreateProductRequest,
  { rejectValue: string; state: RootState }
>("product/create", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Product>>("/proxy/products", payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to create product");
  }
});

export const updateProduct = createAsyncThunk<
  ApiResponse<Product>,
  UpdateProductRequest,
  { rejectValue: string; state: RootState }
>("product/update", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<Product>>(
      `/proxy/products/update/${payload.productId}`,
      payload
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to update product");
  }
});

export const deleteProduct = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("product/delete", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/products/delete/${id}`, { id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || "Product deleted successfully" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete product");
  }
});

export const fetchAllProducts = createAsyncThunk<
  ApiResponse<PaginatedProductResponse>,
  void,
  { rejectValue: string; state: RootState }
>("product/fetchAllCatalog", async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedProductResponse>>(
      `/proxy/products?pageNumber=1&pageSize=500&sortDirection=desc`
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch products");
  }
});

function applyFilteredProductList(state: ProductState, result: ProductListFilterResult) {
  state.products = result.items;
  state.listMode = result.mode;
  state.listFilterLabel = result.label;
  state.totalCount = result.items.length;
  state.currentPage = 1;
  state.pageSize = Math.max(result.items.length, 10);
  state.totalPages = 1;
  state.hasPreviousPage = false;
  state.hasNextPage = false;
}

async function getProductArray<T>(
  url: string,
  rejectWithValue: (msg: string) => unknown
): Promise<T[]> {
  const api = createAuthenticatedAxios();
  const response = await api.get<ApiResponse<T[]>>(url);
  const failMsg = getApiErrorMessage(response.data);
  if (failMsg) throw new Error(failMsg);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export const fetchProductsByCategory = createAsyncThunk<
  ProductListFilterResult,
  { categoryId: number; categoryName: string },
  { rejectValue: string; state: RootState }
>("product/fetchByCategory", async ({ categoryId, categoryName }, { rejectWithValue }) => {
  try {
    const rows = await getProductArray<Product>(
      `/proxy/Products/category/${categoryId}`,
      rejectWithValue
    );
    return {
      items: rows.map(normalizeProductRow),
      mode: "category" as const,
      label: `Category: ${categoryName}`,
    };
  } catch (e: unknown) {
    return rejectWithValue(e instanceof Error ? e.message : "Failed to load products by category");
  }
});

export const fetchProductsByBrand = createAsyncThunk<
  ProductListFilterResult,
  { brandId: number; brandName: string },
  { rejectValue: string; state: RootState }
>("product/fetchByBrand", async ({ brandId, brandName }, { rejectWithValue }) => {
  try {
    const rows = await getProductArray<Product>(`/proxy/Products/brand/${brandId}`, rejectWithValue);
    return {
      items: rows.map(normalizeProductRow),
      mode: "brand" as const,
      label: `Brand: ${brandName}`,
    };
  } catch (e: unknown) {
    return rejectWithValue(e instanceof Error ? e.message : "Failed to load products by brand");
  }
});

export const fetchProductsOutOfStock = createAsyncThunk<
  ProductListFilterResult,
  void,
  { rejectValue: string; state: RootState }
>("product/fetchOutOfStock", async (_, { rejectWithValue }) => {
  try {
    const rows = await getProductArray<ProductStockAlertRow>(
      "/proxy/Products/outofstock",
      rejectWithValue
    );
    return {
      items: rows.map(mapStockAlertRowToProduct),
      mode: "outofstock" as const,
      label: "Out of stock",
    };
  } catch (e: unknown) {
    return rejectWithValue(e instanceof Error ? e.message : "Failed to load out-of-stock products");
  }
});

export const fetchProductsLowStock = createAsyncThunk<
  ProductListFilterResult,
  void,
  { rejectValue: string; state: RootState }
>("product/fetchLowStock", async (_, { rejectWithValue }) => {
  const paths = ["/proxy/Products/lowstock", "/proxy/Products/low-stock"];
  let lastErr = "Failed to load low-stock products";
  for (const path of paths) {
    try {
      const rows = await getProductArray<ProductStockAlertRow>(path, rejectWithValue);
      return {
        items: rows.map(mapStockAlertRowToProduct),
        mode: "lowstock" as const,
        label: "Low stock",
      };
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : lastErr;
    }
  }
  return rejectWithValue(lastErr);
});

async function fetchSingleProductFromApi(url: string): Promise<Product | null> {
  const api = createAuthenticatedAxios();
  const response = await api.get<ApiResponse<Product>>(url);
  const failMsg = getApiErrorMessage(response.data);
  if (failMsg) return null;
  const data = response.data.data;
  if (data == null || typeof data !== "object" || !("productId" in data)) return null;
  return normalizeProductRow(data as Product);
}

/** GET `/api/Products/code/{productCode}` — exact code lookup for list. */
export const fetchProductByCode = createAsyncThunk<
  ProductListFilterResult,
  string,
  { rejectValue: string; state: RootState }
>("product/fetchByCode", async (productCode, { rejectWithValue }) => {
  const code = productCode.trim();
  if (!code) return rejectWithValue("Enter a product code.");
  try {
    const product = await fetchSingleProductFromApi(
      `/proxy/Products/code/${encodeURIComponent(code)}`
    );
    if (!product) return rejectWithValue(`No product found for code ${code}.`);
    return {
      items: [product],
      mode: "search" as const,
      label: `Code: ${product.productCode}`,
    };
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Product code lookup failed"
    );
  }
});

/** GET `/api/Products/barcode/{barcode}` — exact barcode lookup for list. */
export const fetchProductByBarcodeForList = createAsyncThunk<
  ProductListFilterResult,
  string,
  { rejectValue: string; state: RootState }
>("product/fetchByBarcodeForList", async (barcode, { rejectWithValue }) => {
  const code = barcode.trim();
  if (!code) return rejectWithValue("Enter a barcode.");
  try {
    const product = await fetchSingleProductFromApi(
      `/proxy/Products/barcode/${encodeURIComponent(code)}`
    );
    if (!product) return rejectWithValue(`No product found for barcode ${code}.`);
    return {
      items: [product],
      mode: "search" as const,
      label: `Barcode: ${code}`,
    };
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Barcode lookup failed"
    );
  }
});

/**
 * Quick search: product code → `/Products/code/…`, barcode → `/Products/barcode/…`, else POS text search.
 */
export const resolveProductQuickSearch = createAsyncThunk<
  ProductListFilterResult,
  string,
  { rejectValue: string; state: RootState }
>("product/resolveQuickSearch", async (searchTerm, { rejectWithValue }) => {
  const term = searchTerm.trim();
  if (term.length < 2) {
    return { items: [], mode: "search" as const, label: "" };
  }

  try {
    if (isProductCodeQuery(term)) {
      const product = await fetchSingleProductFromApi(
        `/proxy/Products/code/${encodeURIComponent(term)}`
      );
      if (product) {
        return {
          items: [product],
          mode: "search" as const,
          label: `Code: ${product.productCode}`,
        };
      }
    } else if (isBarcodeQuery(term)) {
      const product = await fetchSingleProductFromApi(
        `/proxy/Products/barcode/${encodeURIComponent(term)}`
      );
      if (product) {
        return {
          items: [product],
          mode: "search" as const,
          label: `Barcode: ${term}`,
        };
      }
    }

    return await fetchPosSearchList(term);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Product search failed"
    );
  }
});

async function fetchPosSearchList(term: string): Promise<ProductListFilterResult> {
  const api = createAuthenticatedAxios();
  const response = await api.get<ApiResponse<ProductPosSearchRow[]>>(
    "/proxy/Products/pos/search",
    { params: { searchTerm: term } }
  );
  const failMsg = getApiErrorMessage(response.data);
  if (failMsg) throw new Error(failMsg);
  const rows = Array.isArray(response.data.data) ? response.data.data : [];
  return {
    items: rows.map(mapPosSearchRowToProduct),
    mode: "search" as const,
    label: `Search: “${term}”`,
  };
}

export const searchProductsPos = createAsyncThunk<
  ProductListFilterResult,
  string,
  { rejectValue: string; state: RootState }
>("product/searchPos", async (searchTerm, { rejectWithValue }) => {
  const term = searchTerm.trim();
  if (!term) {
    return { items: [], mode: "search" as const, label: "" };
  }
  try {
    return await fetchPosSearchList(term);
  } catch (e: unknown) {
    return rejectWithValue(e instanceof Error ? e.message : "Product search failed");
  }
});

/** GET `/api/Products/{productId}/batches-for-pricing` */
export const fetchProductBatchesForPricing = createAsyncThunk<
  ProductBatchesForPricing,
  number,
  { rejectValue: string; state: RootState }
>("product/fetchBatchesForPricing", async (productId, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<ProductBatchesForPricing>>(
      `/proxy/Products/${productId}/batches-for-pricing`
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    const data = response.data.data;
    if (data == null || typeof data !== "object") {
      return rejectWithValue("Invalid pricing data from server.");
    }
    return {
      ...data,
      sellingPrice: Number(data.sellingPrice) || 0,
      minSellingPrice: Number(data.minSellingPrice) || 0,
      vatRate: Number(data.vatRate) || 0,
      qtyInStock: Number(data.qtyInStock) || 0,
      batches: Array.isArray(data.batches)
        ? data.batches.map((b) => ({
            ...b,
            costPrice: Number(b.costPrice) || 0,
            sellingPriceExVat: Number(b.sellingPriceExVat) || 0,
            sellingPriceIncVat: Number(b.sellingPriceIncVat) || 0,
            remainingQuantity: Number(b.remainingQuantity) || 0,
            vatRate: Number(b.vatRate) || 0,
          }))
        : [],
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to load batch pricing"
    );
  }
});

/** PUT `/api/Products/{productId}/selling-price` */
export const updateProductSellingPrice = createAsyncThunk<
  { productId: number; message: string },
  UpdateProductSellingPriceRequest,
  { rejectValue: string; state: RootState }
>("product/updateSellingPrice", async (payload, { rejectWithValue, getState }) => {
  const user = getState().auth.user;
  const updatedBy = Number(user?.userId ?? user?.id) || 0;
  const body: UpdateProductSellingPriceRequest = {
    ...payload,
    productId: payload.productId,
    updatedBy: payload.updatedBy || updatedBy,
  };
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(
      `/proxy/Products/${payload.productId}/selling-price`,
      body
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return {
      productId: payload.productId,
      message: response.data.message || "Selling price updated successfully",
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to update selling price"
    );
  }
});

export const fetchProductByBarcode = createAsyncThunk<
  Product,
  string,
  { rejectValue: string; state: RootState }
>("product/fetchByBarcode", async (barcode, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<Product>>(
      `/proxy/Products/barcode/${encodeURIComponent(barcode.trim())}`
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Product not found");
  }
});

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.listMode = "catalog";
      state.listFilterLabel = "";
      state.products = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });

    const filterCases = [
      fetchProductsByCategory,
      fetchProductsByBrand,
      fetchProductsOutOfStock,
      fetchProductsLowStock,
      searchProductsPos,
      resolveProductQuickSearch,
      fetchProductByCode,
      fetchProductByBarcodeForList,
    ] as const;
    for (const thunk of filterCases) {
      builder.addCase(thunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      });
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        applyFilteredProductList(state, payload);
      });
      builder.addCase(thunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to load products";
      });
    }
    builder.addCase(fetchProducts.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch products";
    });

    builder.addCase(fetchAllProducts.pending, (state) => {
      state.catalogLoading = true;
    });
    builder.addCase(fetchAllProducts.fulfilled, (state, { payload }) => {
      state.catalogLoading = false;
      state.allProducts = payload.data.data;
    });
    builder.addCase(fetchAllProducts.rejected, (state, { payload }) => {
      state.catalogLoading = false;
      state.error = payload || "Failed to load product catalog";
    });

    builder.addCase(fetchProductBatchesForPricing.pending, (state) => {
      state.pricingLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProductBatchesForPricing.fulfilled, (state) => {
      state.pricingLoading = false;
    });
    builder.addCase(fetchProductBatchesForPricing.rejected, (state, { payload }) => {
      state.pricingLoading = false;
      state.error = payload || "Failed to load batch pricing";
    });

    builder.addCase(updateProductSellingPrice.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateProductSellingPrice.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message;
    });
    builder.addCase(updateProductSellingPrice.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update selling price";
    });

    builder.addCase(fetchProductByBarcode.pending, (state) => {
      state.barcodeLookupLoading = true;
    });
    builder.addCase(fetchProductByBarcode.fulfilled, (state) => {
      state.barcodeLookupLoading = false;
    });
    builder.addCase(fetchProductByBarcode.rejected, (state) => {
      state.barcodeLookupLoading = false;
    });

    builder.addCase(createProduct.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createProduct.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Product created successfully";
    });
    builder.addCase(createProduct.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to create product";
    });

    builder.addCase(updateProduct.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateProduct.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Product updated successfully";
    });
    builder.addCase(updateProduct.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update product";
    });

    builder.addCase(deleteProduct.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteProduct.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.products = state.products.filter((p) => p.productId !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message || "Product deleted successfully";
    });
    builder.addCase(deleteProduct.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to delete product";
    });
  },
});

export const { clearProductState, clearSelectedProduct, setCurrentPage } = productSlice.actions;
export const productSliceConfig = configureSlice(productSlice, false);

export default productSlice.reducer;
