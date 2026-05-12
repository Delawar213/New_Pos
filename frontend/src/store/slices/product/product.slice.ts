// store/slices/product/product.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { configureSlice } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { CreateProductRequest, PaginatedProductResponse, Product, UpdateProductRequest } from "@/types/product";
import type { RootState } from "@/store";

const createAuthenticatedRequest = () => {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
    },
  });
};

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
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
  selectedProduct: null,
  loading: false,
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
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>("product/fetchAll", async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue, getState }) => {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get<ApiResponse<PaginatedProductResponse>>(
      `/proxy/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
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
>("product/create", async (payload, { rejectWithValue, getState }) => {
  try {
    const api = createAuthenticatedRequest();
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
>("product/update", async (payload, { rejectWithValue, getState }) => {
  try {
    const api = createAuthenticatedRequest();
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
>("product/delete", async (id, { rejectWithValue, getState }) => {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/products/delete/${id}`, { id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || "Product deleted successfully" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete product");
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
      state.products = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });
    builder.addCase(fetchProducts.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch products";
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
