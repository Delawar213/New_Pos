// store/slices/sale/sale.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse, PaginationParams, PaginatedResponse } from "@/types/common";
import type {
  CreatePosSaleRequest,
  PosPriceOverrideValidateData,
  PosPriceOverrideValidateRequest,
  Sale,
  SaleBarcodeScanData,
  SaleItem,
  SaleReturnRequest,
  SaleReturnResultData,
  SaleStatus,
  SaleUpdateThunkArg,
} from "@/types/sale";
import type { RootState } from "@/store";
import { listQueryParams } from "@/lib/listQueryParams";
import { authUserIsAdmin } from "@/lib/saleEdit";

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeSaleStatus(api: string | undefined): SaleStatus {
  const s = (api ?? "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "returned") return "returned";
  if (s === "completed") return "completed";
  return "completed";
}

function mapApiSaleDetailToSaleItem(row: Record<string, unknown>): SaleItem {
  const itemDisc = num(row.itemDiscount);
  const propDisc = num(row.proportionalDiscount);
  const totalDisc =
    num(row.totalDiscount) || (itemDisc || propDisc ? itemDisc + propDisc : 0);
  const idAmtRaw = row.itemDiscountAmount;
  const idPctRaw = row.itemDiscountPercentage;
  const itemDiscountAmount =
    idAmtRaw != null && idAmtRaw !== "" && Number(idAmtRaw) !== 0 ? num(idAmtRaw) : null;
  const itemDiscountPercentage =
    idPctRaw != null && idPctRaw !== "" && Number(idPctRaw) !== 0 ? num(idPctRaw) : null;

  return {
    id: num(row.saleDetailId ?? row.id),
    productId: num(row.productId),
    productName: str(row.productName) || undefined,
    sku: str(row.productCode ?? row.sku) || undefined,
    quantity: num(row.quantity),
    returnQuantity: num(row.returnQuantity),
    isReturned: Boolean(row.isReturned),
    unitPrice: num(row.sellingPriceExVat ?? row.unitPrice),
    taxPercentage: num(row.vatRate ?? row.taxPercentage),
    taxAmount: num(row.lineVatAmount ?? row.taxAmount),
    discount: totalDisc,
    total: num(row.lineTotalIncVat ?? row.total),
    purchaseDetailId:
      row.purchaseDetailId != null && row.purchaseDetailId !== ""
        ? num(row.purchaseDetailId)
        : undefined,
    itemDiscountAmount,
    itemDiscountPercentage,
  };
}

/** Maps `GET /api/Sales` list row or `GET /api/Sales/{id}` body to UI `Sale`. */
export function mapApiSalePayloadToSale(raw: unknown): Sale | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const saleId = num(o.saleId ?? o.id);
  if (!saleId) return null;

  let items: SaleItem[] = [];
  if (Array.isArray(o.saleDetails)) {
    items = o.saleDetails.map((d) =>
      mapApiSaleDetailToSaleItem(
        typeof d === "object" && d != null ? (d as Record<string, unknown>) : {}
      )
    );
  } else if (Array.isArray(o.items)) {
    items = o.items.map((d) =>
      mapApiSaleDetailToSaleItem(
        typeof d === "object" && d != null ? (d as Record<string, unknown>) : {}
      )
    );
  }

  const statusRaw = str(o.status, "completed");
  const createdByRaw = o.createdBy;
  const createdBy =
    typeof createdByRaw === "string"
      ? createdByRaw
      : createdByRaw != null && String(createdByRaw).trim() !== ""
        ? String(createdByRaw)
        : "—";

  const discPct = o.discountPercentage;
  const desc = str(o.description);
  const notesRaw = o.notes;

  return {
    id: saleId,
    invoiceNo: str(o.invoiceNumber ?? o.invoiceNo),
    customerId: o.customerId != null ? num(o.customerId) : undefined,
    customerName: str(o.customerName) || undefined,
    saleDate: str(o.saleDate ?? o.createdDatetime ?? o.createdAt),
    status: normalizeSaleStatus(statusRaw),
    subtotal: num(o.subtotalExVat ?? o.subtotal ?? o.netAmountExVat),
    taxAmount: num(o.totalVatAmount ?? o.taxAmount),
    discountAmount: num(o.discountAmount),
    discountPercentage:
      discPct != null && discPct !== "" && Number(discPct) !== 0 ? num(discPct) : undefined,
    grandTotal: num(o.totalAmountIncVat ?? o.grandTotal),
    paidAmount: num(o.paidAmount),
    dueAmount: num(o.remainingAmount ?? o.dueAmount),
    changeAmount: num(o.returnAmount ?? o.changeAmount),
    paymentMethod: str(o.paymentStatus ?? o.paymentMethod, ""),
    description: desc || undefined,
    notes: notesRaw === null ? null : str(notesRaw) || undefined,
    note: str(o.notes ?? o.description ?? o.note) || undefined,
    items,
    createdBy,
    createdAt: str(o.createdDatetime ?? o.createdAt ?? o.saleDate),
    updatedAt: o.updatedAt ? str(o.updatedAt) : undefined,
  };
}

function extractSalesPage(raw: unknown): PaginatedResponse<Sale> | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner =
    o.data != null && typeof o.data === "object" && !Array.isArray(o.data)
      ? (o.data as Record<string, unknown>)
      : o;

  const rawList: unknown[] | null = Array.isArray(inner.data)
    ? (inner.data as unknown[])
    : Array.isArray(inner.items)
      ? (inner.items as unknown[])
      : null;

  if (!rawList) return null;

  const items: Sale[] = [];
  for (const row of rawList) {
    const s = mapApiSalePayloadToSale(row);
    if (s) items.push(s);
  }

  const sorted = [...items].sort((a, b) => {
    const ta = Date.parse(a.saleDate || a.createdAt) || 0;
    const tb = Date.parse(b.saleDate || b.createdAt) || 0;
    if (tb !== ta) return tb - ta;
    return b.id - a.id;
  });

  return {
    items: sorted,
    totalCount: Number(inner.totalRecords ?? inner.totalCount) || 0,
    pageNumber: Number(inner.pageNumber) || 1,
    pageSize: Number(inner.pageSize) || 10,
    totalPages: Number(inner.totalPages) || 0,
    hasNextPage: Boolean(inner.hasNextPage),
    hasPreviousPage: Boolean(inner.hasPreviousPage),
  };
}

interface SaleState {
  sales: Sale[];
  selectedSale: Sale | null;
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

const initialState: SaleState = {
  sales: [],
  selectedSale: null,
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

export type FetchSalesArgs = PaginationParams;

/** Tries backend routes in order — many APIs use `Sales` not `pos`. */
const SCAN_PATH_BUILDERS = [
  (code: string) => `/proxy/Sales/scan/${encodeURIComponent(code)}`,
  (code: string) => `/proxy/sales/scan/${encodeURIComponent(code)}`,
  (code: string) => `/proxy/pos/scan/${encodeURIComponent(code)}`,
];

function parseScanResponse(body: ApiResponse<SaleBarcodeScanData>): {
  data: SaleBarcodeScanData | null;
  error: string | null;
} {
  const failMsg = getApiErrorMessage(body);
  if (failMsg) return { data: null, error: failMsg };
  const data = body.data;
  if (data == null || typeof data !== "object") {
    return { data: null, error: "No product returned for this barcode." };
  }
  const normalized = normalizeScanData(data);
  return { data: normalized, error: null };
}

function normalizeScanData(data: SaleBarcodeScanData): SaleBarcodeScanData {
  return {
    ...data,
    qtyInStock: num(data.qtyInStock),
    remainingQuantity: num(data.remainingQuantity),
    availableBatches: (data.availableBatches ?? []).map((b) => ({
      ...b,
      remainingQuantity: num(b.remainingQuantity),
      sellingPrice: num(b.sellingPrice),
      sellingPriceExVat: num(b.sellingPriceExVat),
    })),
  };
}

/** GET scan — uses first working route: Sales/sales/pos. */
export const scanPosBarcode = createAsyncThunk<
  SaleBarcodeScanData,
  string,
  { rejectValue: string; state: RootState }
>("sale/scanPosBarcode", async (barcode, { rejectWithValue }) => {
  const code = barcode.trim();
  if (!code) return rejectWithValue("Enter a barcode.");

  const api = createAuthenticatedAxios();
  let last404 = false;
  let lastMessage = "Barcode scan failed.";

  for (const buildUrl of SCAN_PATH_BUILDERS) {
    const url = buildUrl(code);
    try {
      const response = await api.get<ApiResponse<SaleBarcodeScanData>>(url);
      const { data, error } = parseScanResponse(response.data);
      if (error || data == null) return rejectWithValue(error ?? "No product returned for this barcode.");
      return data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        last404 = true;
        continue;
      }
      const body = isAxiosError(error) ? error.response?.data : undefined;
      const msg =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof (body as { message?: string }).message === "string"
          ? (body as { message: string }).message
          : undefined;
      const fromErrors =
        body &&
        typeof body === "object" &&
        "errors" in body &&
        Array.isArray((body as { errors?: unknown }).errors)
          ? ((body as { errors: string[] }).errors || [])
              .filter((e): e is string => Boolean(e && String(e).trim()))
              .join(", ")
          : "";
      lastMessage = fromErrors || msg || (error instanceof Error ? error.message : lastMessage);
      if (isAxiosError(error) && error.response?.status === 404) {
        last404 = true;
        continue;
      }
      return rejectWithValue(lastMessage);
    }
  }

  if (last404) {
    return rejectWithValue(
      "Scan route not found (404). Backend may use /api/Sales/scan or /api/pos/scan — check API base URL."
    );
  }
  return rejectWithValue(lastMessage);
});

/** @deprecated Use scanPosBarcode */
export const scanSaleBarcode = scanPosBarcode;

/** POST `/api/pos/price-override/validate` */
export const validatePosPriceOverride = createAsyncThunk<
  PosPriceOverrideValidateData,
  PosPriceOverrideValidateRequest,
  { rejectValue: string; state: RootState }
>("sale/validatePosPriceOverride", async (payload, { rejectWithValue }) => {
  const paths = [
    "/proxy/pos/price-override/validate",
    "/proxy/Sales/price-override/validate",
    "/proxy/sales/price-override/validate",
  ];

  const api = createAuthenticatedAxios();

  for (const path of paths) {
    try {
      const response = await api.post<ApiResponse<PosPriceOverrideValidateData>>(path, payload);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      const data = response.data.data;
      if (data != null && typeof data === "object" && "allowed" in data) {
        return {
          allowed: Boolean(data.allowed),
          message: typeof data.message === "string" ? data.message : undefined,
        };
      }
      return { allowed: true };
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const body = isAxiosError(error) ? error.response?.data : undefined;
      const fromErrors =
        body &&
        typeof body === "object" &&
        "errors" in body &&
        Array.isArray((body as { errors?: string[] }).errors)
          ? ((body as { errors: string[] }).errors || [])
              .filter((e): e is string => Boolean(e && String(e).trim()))
              .join(", ")
          : "";
      const msg =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof (body as { message?: string }).message === "string"
          ? (body as { message: string }).message
          : undefined;
      return rejectWithValue(
        fromErrors || msg || (error instanceof Error ? error.message : "Price override validation failed.")
      );
    }
  }

  /** No validate endpoint deployed — allow price edits so POS still works. */
  return { allowed: true };
});

export const fetchSales = createAsyncThunk<
  PaginatedResponse<Sale>,
  FetchSalesArgs | undefined,
  { rejectValue: string; state: RootState }
>("sale/fetchList", async (params = {}, { rejectWithValue }) => {
  const api = createAuthenticatedAxios();
  const query = listQueryParams({
    ...params,
    sortBy: params.sortBy ?? "saleDate",
    sortDirection: params.sortDirection ?? "desc",
  });
  const paths = ["/proxy/Sales", "/proxy/sales"];
  let lastMessage = "Failed to fetch sales";

  for (const path of paths) {
    try {
      const response = await api.get<unknown>(path, { params: query });
      const body = response.data as {
        success?: boolean;
        message?: string;
        errors?: string[] | null;
      };
      const failMsg = getApiErrorMessage(body);
      if (failMsg) return rejectWithValue(failMsg);
      const page = extractSalesPage(response.data);
      if (page) return page;
      lastMessage = "Unexpected sales list response from server.";
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      lastMessage =
        err.response?.data?.message || err.message || "Failed to fetch sales";
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

export type FetchSaleByIdArg = number | { id: number; updateSelection?: boolean };

function normalizeFetchSaleByIdArg(arg: FetchSaleByIdArg): {
  id: number;
  updateSelection: boolean;
} {
  if (typeof arg === "number") return { id: arg, updateSelection: true };
  return {
    id: arg.id,
    updateSelection: arg.updateSelection !== false,
  };
}

export const fetchSaleById = createAsyncThunk<
  Sale,
  FetchSaleByIdArg,
  { rejectValue: string; state: RootState }
>("sale/fetchById", async (arg, { rejectWithValue }) => {
  const { id } = normalizeFetchSaleByIdArg(arg);
  const api = createAuthenticatedAxios();
  const paths = [`/proxy/Sales/${id}`, `/proxy/sales/${id}`];
  let lastMessage = "Failed to fetch sale";

  for (const path of paths) {
    try {
      const response = await api.get<unknown>(path);
      const raw = response.data as Record<string, unknown>;
      const failMsg = getApiErrorMessage(
        raw as { success?: boolean; message?: string; errors?: string[] | null }
      );
      if (failMsg) return rejectWithValue(failMsg);
      const inner = raw.data ?? raw;
      if (!inner || typeof inner !== "object") {
        lastMessage = "Unexpected sale response.";
        continue;
      }
      const sale = mapApiSalePayloadToSale(inner);
      if (sale) return sale;
      lastMessage = "Unexpected sale response.";
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      lastMessage = err.response?.data?.message || err.message || lastMessage;
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

export const createSale = createAsyncThunk<
  ApiResponse<Sale>,
  CreatePosSaleRequest,
  { rejectValue: string; state: RootState }
>("sale/create", async (payload, { rejectWithValue }) => {
  const api = createAuthenticatedAxios();
  const paths = ["/proxy/Sales/pos", "/proxy/sales/pos", "/proxy/Sales", "/proxy/sales"];

  for (const path of paths) {
    try {
      const response = await api.post<ApiResponse<Sale>>(path, payload);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create sale");
    }
  }
  return rejectWithValue("Create sale route not found (404). Check /api/sales vs /api/Sales on the server.");
});

export const updateSale = createAsyncThunk<
  ApiResponse<unknown>,
  SaleUpdateThunkArg,
  { rejectValue: string; state: RootState }
>("sale/update", async (payload, { getState, rejectWithValue }) => {
  const api = createAuthenticatedAxios();
  const { id, saleDate, ...rest } = payload;
  const user = getState().auth.user as Record<string, unknown> | undefined;
  const updatedBy = Number(user?.id ?? user?.userId) || 0;
  const body = {
    saleId: id,
    ...rest,
    saleDate: saleDate.includes("T") ? saleDate : `${saleDate}T00:00:00`,
    updatedBy,
    roleId: authUserIsAdmin(user) ? 1 : null,
  };
  const paths = [`/proxy/Sales/${id}`, `/proxy/sales/${id}`];
  let lastMessage = "Failed to update sale";

  for (const path of paths) {
    try {
      const response = await api.put<ApiResponse<unknown>>(path, body);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      lastMessage = err.response?.data?.message || err.message || lastMessage;
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

export const deleteSale = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("sale/delete", async (id, { rejectWithValue }) => {
  const api = createAuthenticatedAxios();
  const paths = [`/proxy/Sales/${id}`, `/proxy/sales/${id}`];
  let lastMessage = "Failed to delete sale";

  for (const path of paths) {
    try {
      const response = await api.delete<ApiResponse<null>>(path);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return { id, message: response.data.message || "Sale deleted successfully" };
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      lastMessage = err.response?.data?.message || err.message || lastMessage;
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

/** GET sale by invoice number (e.g. `INV-20260513-7402`). Does not update `selectedSale`. */
export const fetchSaleByInvoiceNumber = createAsyncThunk<
  Sale,
  string,
  { rejectValue: string; state: RootState }
>("sale/fetchByInvoice", async (invoiceRaw, { rejectWithValue }) => {
  const invoice = invoiceRaw.trim();
  if (!invoice) return rejectWithValue("Enter an invoice number.");

  const api = createAuthenticatedAxios();
  const enc = encodeURIComponent(invoice);
  const paths = [`/proxy/Sales/invoice/${enc}`, `/proxy/sales/invoice/${enc}`];
  let lastMessage = "Sale not found.";

  for (const path of paths) {
    try {
      const response = await api.get<unknown>(path);
      const raw = response.data as Record<string, unknown>;
      const failMsg = getApiErrorMessage(
        raw as { success?: boolean; message?: string; errors?: string[] | null }
      );
      if (failMsg) return rejectWithValue(failMsg);
      const inner = raw.data ?? raw;
      if (!inner || typeof inner !== "object") {
        lastMessage = "Unexpected sale response.";
        continue;
      }
      const sale = mapApiSalePayloadToSale(inner);
      if (sale) return sale;
      lastMessage = "Unexpected sale response.";
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      lastMessage =
        err.response?.data?.message || err.message || "Failed to load sale by invoice.";
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

/** POST `/api/sales/return` — partial cash or full credit per API contract. */
export const processSaleReturn = createAsyncThunk<
  { message: string; data: SaleReturnResultData | null },
  SaleReturnRequest,
  { rejectValue: string; state: RootState }
>("sale/processReturn", async (payload, { rejectWithValue }) => {
  const api = createAuthenticatedAxios();
  const paths = ["/proxy/Sales/return", "/proxy/sales/return"];
  let lastMessage = "Return failed.";

  for (const path of paths) {
    try {
      const response = await api.post<ApiResponse<SaleReturnResultData | null>>(path, payload);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return {
        message: response.data.message || "Sale return processed successfully",
        data: (response.data.data ?? null) as SaleReturnResultData | null,
      };
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      const body = isAxiosError(error) ? error.response?.data : undefined;
      const msg =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof (body as { message?: string }).message === "string"
          ? (body as { message: string }).message
          : undefined;
      lastMessage = msg || (error instanceof Error ? error.message : lastMessage);
      if (isAxiosError(error) && error.response?.status === 404) {
        continue;
      }
      return rejectWithValue(lastMessage);
    }
  }

  return rejectWithValue(lastMessage);
});

const saleSlice = createSlice({
  name: "sale",
  initialState,
  reducers: {
    clearSaleState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedSale(state) {
      state.selectedSale = null;
    },
    setSalePage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSales.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSales.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.sales = payload.items;
      state.totalCount = payload.totalCount;
      state.currentPage = payload.pageNumber;
      state.pageSize = payload.pageSize;
      state.totalPages = payload.totalPages;
      state.hasPreviousPage = payload.hasPreviousPage;
      state.hasNextPage = payload.hasNextPage;
    });
    builder.addCase(fetchSales.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || "Failed to fetch sales";
    });

    builder.addCase(fetchSaleById.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSaleById.fulfilled, (state, action) => {
      state.actionLoading = false;
      if (normalizeFetchSaleByIdArg(action.meta.arg).updateSelection) {
        state.selectedSale = action.payload;
      }
    });
    builder.addCase(fetchSaleById.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to fetch sale";
    });

    builder.addCase(fetchSaleByInvoiceNumber.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSaleByInvoiceNumber.fulfilled, (state) => {
      state.actionLoading = false;
    });
    builder.addCase(fetchSaleByInvoiceNumber.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to fetch sale by invoice";
    });

    builder.addCase(processSaleReturn.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
      state.success = false;
      state.message = "";
    });
    builder.addCase(processSaleReturn.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message;
    });
    builder.addCase(processSaleReturn.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Return failed";
    });

    builder.addCase(createSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Sale created successfully";
    });
    builder.addCase(createSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to create sale";
    });

    builder.addCase(updateSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.success = true;
      state.message = payload.message || "Sale updated successfully";
      const mapped = mapApiSalePayloadToSale(payload.data as unknown);
      const updated = mapped ?? (payload.data as Sale | null);
      if (updated?.id) {
        const idx = state.sales.findIndex((s) => s.id === updated.id);
        if (idx >= 0) {
          const prev = state.sales[idx];
          const mergedItems =
            mapped?.items?.length && mapped.items.length > 0 ? mapped.items : prev.items;
          state.sales[idx] = { ...prev, ...updated, items: mergedItems };
        }
        if (state.selectedSale?.id === updated.id) {
          const prevSel = state.selectedSale;
          const mergedItems =
            mapped?.items?.length && mapped.items.length > 0 ? mapped.items : prevSel.items;
          state.selectedSale = { ...prevSel, ...updated, items: mergedItems };
        }
      }
    });
    builder.addCase(updateSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to update sale";
    });

    builder.addCase(deleteSale.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteSale.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.sales = state.sales.filter((s) => s.id !== payload.id);
      state.totalCount = Math.max(0, state.totalCount - 1);
      state.success = true;
      state.message = payload.message;
      if (state.selectedSale?.id === payload.id) state.selectedSale = null;
    });
    builder.addCase(deleteSale.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || "Failed to delete sale";
    });
  },
});

export const { clearSaleState, clearSelectedSale, setSalePage } = saleSlice.actions;
export const saleSliceConfig = configureSlice(saleSlice, false);

export default saleSlice.reducer;
