import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { configureSlice } from '@/lib/utils';
import { createAuthenticatedAxios } from '@/lib/createAuthenticatedAxios';
import { getApiErrorMessage } from '@/lib/apiResult';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerDropdown,
  CustomerType,
  CreateCustomerTypeRequest,
  UpdateCustomerTypeRequest,
  CustomerLedgerEntry,
  CustomerLedgerQuery,
  PaginatedCustomerResponse,
  CustomerLoyaltyRequest,
  CustomerBulkPaymentRequest,
  CustomerSalePaymentRequest,
  CustomerPendingPaymentsData,
  CustomerPendingSale,
  CustomerPendingSummary,
} from '@/types/customer';
import type { RootState } from '@/store';
import type { PaginationParams } from '@/types/common';
import { listQueryParams } from '@/lib/listQueryParams';
import { fetchBankAccountsDropdown } from '@/store/slices/bankAccount/bankAccount.slice';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface CustomerState {
  customers: Customer[];
  activeCustomers: Customer[];
  dropdownCustomers: CustomerDropdown[];
  customerTypes: CustomerType[];
  walkingCustomer: Customer | null;
  selectedCustomer: Customer | null;
  customerLedger: CustomerLedgerEntry[];
  customerLedgerMessage: string;
  ledgerLoading: boolean;
  customerBalance: number;
  customerLoyalty: number;
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
  pendingPayments: CustomerPendingPaymentsData | null;
  pendingPaymentsLoading: boolean;
  pendingPaymentsError: string | null;
  /** `0` = all customers; otherwise filtered by customer id. */
  pendingPaymentsCustomerId: number;
}

const initialState: CustomerState = {
  customers: [],
  activeCustomers: [],
  dropdownCustomers: [],
  customerTypes: [],
  walkingCustomer: null,
  selectedCustomer: null,
  customerLedger: [],
  customerLedgerMessage: '',
  ledgerLoading: false,
  customerBalance: 0,
  customerLoyalty: 0,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: '',
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  pendingPayments: null,
  pendingPaymentsLoading: false,
  pendingPaymentsError: null,
  pendingPaymentsCustomerId: 0,
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapPendingSale(raw: Record<string, unknown>): CustomerPendingSale {
  return {
    saleId: num(raw.saleId),
    invoiceNumber: String(raw.invoiceNumber ?? ''),
    saleDate: String(raw.saleDate ?? ''),
    customerId: num(raw.customerId),
    customerName: String(raw.customerName ?? ''),
    totalAmount: num(raw.totalAmount),
    paidAmount: num(raw.paidAmount),
    remainingAmount: num(raw.remainingAmount),
    paymentStatus: String(raw.paymentStatus ?? ''),
    daysOutstanding: num(raw.daysOutstanding),
    paymentStatusAge: String(raw.paymentStatusAge ?? ''),
  };
}

function mapPendingSummary(raw: Record<string, unknown>): CustomerPendingSummary {
  const summary: CustomerPendingSummary = {
    customerId: num(raw.customerId),
    customerCode: String(raw.customerCode ?? ''),
    customerName: String(raw.customerName ?? ''),
    contactNo: String(raw.contactNo ?? ''),
    creditLimit: num(raw.creditLimit),
    creditDays: num(raw.creditDays),
    currentBalance: num(raw.currentBalance),
    totalPendingSales: num(raw.totalPendingSales),
    totalRemaining: num(raw.totalRemaining),
    totalPaid: num(raw.totalPaid),
    totalInvoiced: num(raw.totalInvoiced),
    oldestPendingDate: String(raw.oldestPendingDate ?? ''),
    latestPendingDate: String(raw.latestPendingDate ?? ''),
  };
  if (raw.creditUtilizationPct != null) {
    summary.creditUtilizationPct = num(raw.creditUtilizationPct);
  }
  return summary;
}

function mapPendingPaymentsPayload(raw: unknown): CustomerPendingPaymentsData {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const summaries = Array.isArray(d.customerSummaries) ? d.customerSummaries : [];
  const sales = Array.isArray(d.pendingSales) ? d.pendingSales : [];
  return {
    grandTotalCustomers: num(d.grandTotalCustomers),
    grandTotalRemaining: num(d.grandTotalRemaining),
    customerSummaries: summaries.map((row) =>
      mapPendingSummary(row as Record<string, unknown>)
    ),
    pendingSales: sales.map((row) => mapPendingSale(row as Record<string, unknown>)),
  };
}

export const fetchCustomers = createAsyncThunk<
  ApiResponse<PaginatedCustomerResponse>,
  PaginationParams | undefined,
  { rejectValue: string; state: RootState }
>('customer/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<PaginatedCustomerResponse>>(
      `/proxy/customers`,
      { params: listQueryParams(params) }
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customers');
  }
});

export const fetchCustomerById = createAsyncThunk<ApiResponse<Customer>, number, { rejectValue: string; state: RootState }>(
  'customer/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Customer>>(`/proxy/customers/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer');
    }
  }
);

export const fetchCustomerByCode = createAsyncThunk<ApiResponse<Customer>, string, { rejectValue: string; state: RootState }>(
  'customer/fetchByCode',
  async (code, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Customer>>(`/proxy/customers/code/${code}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer by code');
    }
  }
);

export const fetchActiveCustomers = createAsyncThunk<ApiResponse<Customer[]>, void, { rejectValue: string; state: RootState }>(
  'customer/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Customer[]>>('/proxy/customers/active');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active customers');
    }
  }
);

export const fetchWalkingCustomer = createAsyncThunk<ApiResponse<Customer>, void, { rejectValue: string; state: RootState }>(
  'customer/fetchWalking',
  async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<Customer>>('/proxy/customers/walking');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch walking customer');
    }
  }
);

export const fetchCustomerTypes = createAsyncThunk<ApiResponse<CustomerType[]>, void, { rejectValue: string; state: RootState }>(
  'customer/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<CustomerType[]>>('/proxy/customers/types');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer types');
    }
  }
);

export const createCustomerType = createAsyncThunk<
  ApiResponse<CustomerType>,
  CreateCustomerTypeRequest,
  { rejectValue: string; state: RootState }
>('customer/createType', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<CustomerType>>('/proxy/customers/types', payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create customer type');
  }
});

export const updateCustomerType = createAsyncThunk<
  ApiResponse<CustomerType>,
  UpdateCustomerTypeRequest,
  { rejectValue: string; state: RootState }
>('customer/updateType', async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<CustomerType>>(
      `/proxy/customers/types/${payload.customerTypeId}`,
      payload
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update customer type');
  }
});

export const deleteCustomerType = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>('customer/deleteType', async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/customers/types/${id}`, { customerTypeId: id });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return { id, message: response.data.message || 'Customer type deleted successfully' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete customer type');
  }
});

export const fetchCustomersDropdown = createAsyncThunk<ApiResponse<CustomerDropdown[]>, void, { rejectValue: string; state: RootState }>(
  'customer/fetchDropdown',
  async (_, { rejectWithValue }) => {
    const api = createAuthenticatedAxios();
    const paths = ['/proxy/Customers/dropdown', '/proxy/customers/dropdown'];
    let lastMessage = 'Failed to fetch customers dropdown';
    for (const path of paths) {
      try {
        const response = await api.get<ApiResponse<CustomerDropdown[]>>(path);
        const failMsg = getApiErrorMessage(response.data);
        if (failMsg) return rejectWithValue(failMsg);
        const rows = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          ...response.data,
          data: rows.map((row) => ({
            ...row,
            currentBalance: Number(row.currentBalance) || 0,
            creditLimit: Number(row.creditLimit) || 0,
          })),
        };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        lastMessage = err.response?.data?.message || err.message || lastMessage;
      }
    }
    return rejectWithValue(lastMessage);
  }
);

export const fetchCustomerBalance = createAsyncThunk<ApiResponse<number>, number, { rejectValue: string; state: RootState }>(
  'customer/fetchBalance',
  async (customerId, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<number>>(`/proxy/Customers/${customerId}/balance`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer balance');
    }
  }
);

export const fetchCustomerLedger = createAsyncThunk<
  ApiResponse<CustomerLedgerEntry[]>,
  CustomerLedgerQuery,
  { rejectValue: string; state: RootState }
>('customer/fetchLedger', async ({ customerId, fromDate, toDate }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const params: Record<string, string> = {};
    if (fromDate?.trim()) params.fromDate = fromDate.trim();
    if (toDate?.trim()) params.toDate = toDate.trim();
    const response = await api.get<ApiResponse<CustomerLedgerEntry[]>>(
      `/proxy/Customers/${customerId}/ledger`,
      { params }
    );
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    const rows = Array.isArray(response.data.data) ? response.data.data : [];
    return {
      ...response.data,
      data: rows.map((row) => ({
        ...row,
        debit: Number(row.debit) || 0,
        credit: Number(row.credit) || 0,
        balance: Number(row.balance) || 0,
      })),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer ledger');
  }
});

/** GET `/api/Customers/pending-payments` — all customers with outstanding sale balances. */
export const fetchAllCustomerPendingPayments = createAsyncThunk<
  CustomerPendingPaymentsData,
  void,
  { rejectValue: string; state: RootState }
>('customer/fetchAllPendingPayments', async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const paths = ['/proxy/Customers/pending-payments', '/proxy/customers/pending-payments'];
    let lastMessage = 'Failed to load pending payments';
    for (const path of paths) {
      try {
        const response = await api.get<ApiResponse<unknown>>(path);
        const failMsg = getApiErrorMessage(response.data);
        if (failMsg) return rejectWithValue(failMsg);
        return mapPendingPaymentsPayload(response.data.data);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        lastMessage = err.response?.data?.message || err.message || lastMessage;
      }
    }
    return rejectWithValue(lastMessage);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to load pending payments');
  }
});

/** GET `/api/Customers/{id}/pending-payments` — one customer's pending sales. */
export const fetchCustomerPendingPayments = createAsyncThunk<
  CustomerPendingPaymentsData,
  number,
  { rejectValue: string; state: RootState }
>('customer/fetchPendingPayments', async (customerId, { rejectWithValue }) => {
  if (!Number.isFinite(customerId) || customerId <= 0) {
    return rejectWithValue('Select a customer.');
  }
  try {
    const api = createAuthenticatedAxios();
    const paths = [
      `/proxy/Customers/${customerId}/pending-payments`,
      `/proxy/customers/${customerId}/pending-payments`,
    ];
    let lastMessage = 'Failed to load pending payments';
    for (const path of paths) {
      try {
        const response = await api.get<ApiResponse<unknown>>(path);
        const failMsg = getApiErrorMessage(response.data);
        if (failMsg) return rejectWithValue(failMsg);
        return mapPendingPaymentsPayload(response.data.data);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        lastMessage = err.response?.data?.message || err.message || lastMessage;
      }
    }
    return rejectWithValue(lastMessage);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to load pending payments');
  }
});

export const fetchCustomerLoyalty = createAsyncThunk<ApiResponse<number>, number, { rejectValue: string; state: RootState }>(
  'customer/fetchLoyalty',
  async (customerId, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<number>>(`/proxy/customers/${customerId}/loyalty`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer loyalty');
    }
  }
);

export const addCustomerLoyalty = createAsyncThunk<
  ApiResponse<boolean>,
  { customerId: number; payload: CustomerLoyaltyRequest },
  { rejectValue: string; state: RootState }
>('customer/addLoyalty', async ({ customerId, payload }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<boolean>>(`/proxy/customers/${customerId}/loyalty/add`, payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to add loyalty points');
  }
});

export const redeemCustomerLoyalty = createAsyncThunk<
  ApiResponse<boolean>,
  { customerId: number; payload: CustomerLoyaltyRequest },
  { rejectValue: string; state: RootState }
>('customer/redeemLoyalty', async ({ customerId, payload }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<boolean>>(`/proxy/customers/${customerId}/loyalty/redeem`, payload);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to redeem loyalty points');
  }
});

export const createCustomer = createAsyncThunk<ApiResponse<Customer>, CreateCustomerRequest, { rejectValue: string; state: RootState }>(
  'customer/create',
  async (customerData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<Customer>>('/proxy/customers', customerData);
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create customer');
    }
  }
);

export const updateCustomer = createAsyncThunk<ApiResponse<Customer>, UpdateCustomerRequest, { rejectValue: string; state: RootState }>(
  'customer/update',
  async (customerData, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<Customer>>(
        `/proxy/customers/update/${customerData.customerId}`,
        customerData
      );
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update customer');
    }
  }
);

function resolveCreatedBy(getState: () => RootState): number {
  const user = getState().auth.user;
  return Number(user?.userId ?? user?.id) || 0;
}

/** POST `/api/Customers/sale-payment` */
export const customerSalePayment = createAsyncThunk<
  ApiResponse<unknown>,
  Omit<CustomerSalePaymentRequest, 'createdBy'> & { createdBy?: number },
  { rejectValue: string; state: RootState }
>('customer/salePayment', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const api = createAuthenticatedAxios();
    const body: CustomerSalePaymentRequest = {
      ...payload,
      createdBy: payload.createdBy ?? resolveCreatedBy(getState),
    };
    const response = await api.post<ApiResponse<unknown>>('/proxy/Customers/sale-payment', body);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    await dispatch(fetchBankAccountsDropdown());
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Sale payment failed');
  }
});

/** POST `/api/Customers/bulk-payment` */
export const customerBulkPayment = createAsyncThunk<
  ApiResponse<unknown>,
  Omit<CustomerBulkPaymentRequest, 'createdBy'> & { createdBy?: number },
  { rejectValue: string; state: RootState }
>('customer/bulkPayment', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const api = createAuthenticatedAxios();
    const body: CustomerBulkPaymentRequest = {
      ...payload,
      createdBy: payload.createdBy ?? resolveCreatedBy(getState),
    };
    const response = await api.post<ApiResponse<unknown>>('/proxy/Customers/bulk-payment', body);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    await dispatch(fetchBankAccountsDropdown());
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Bulk payment failed');
  }
});

export const deleteCustomer = createAsyncThunk<{ id: number; message: string }, number, { rejectValue: string; state: RootState }>(
  'customer/delete',
  async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<unknown>>(`/proxy/customers/delete/${id}`, { id });
      const failMsg = getApiErrorMessage(response.data);
      if (failMsg) return rejectWithValue(failMsg);
      return { id, message: response.data.message || 'Customer deleted successfully' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete customer');
    }
  }
);

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    clearCustomerState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedCustomer(state) {
      state.selectedCustomer = null;
    },
    clearCustomerLedger(state) {
      state.customerLedger = [];
      state.customerLedgerMessage = '';
      state.error = null;
    },
    clearPendingPayments(state) {
      state.pendingPayments = null;
      state.pendingPaymentsLoading = false;
      state.pendingPaymentsError = null;
      state.pendingPaymentsCustomerId = 0;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.customers = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });
    builder.addCase(fetchCustomers.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch customers';
    });

    builder.addCase(fetchCustomerById.fulfilled, (state, { payload }) => {
      state.selectedCustomer = payload.data;
    });
    builder.addCase(fetchCustomerByCode.fulfilled, (state, { payload }) => {
      state.selectedCustomer = payload.data;
    });
    builder.addCase(fetchActiveCustomers.fulfilled, (state, { payload }) => {
      state.activeCustomers = payload.data;
    });
    builder.addCase(fetchWalkingCustomer.fulfilled, (state, { payload }) => {
      state.walkingCustomer = payload.data;
    });
    builder.addCase(fetchCustomerTypes.fulfilled, (state, { payload }) => {
      state.customerTypes = payload.data;
    });
    builder.addCase(createCustomerType.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createCustomerType.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.customerTypes.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Customer type created successfully';
    });
    builder.addCase(createCustomerType.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create customer type';
    });

    builder.addCase(updateCustomerType.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateCustomerType.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.customerTypes.findIndex((c) => c.customerTypeId === payload.data.customerTypeId);
      if (index !== -1) state.customerTypes[index] = payload.data;
      state.success = true;
      state.message = payload.message || 'Customer type updated successfully';
    });
    builder.addCase(updateCustomerType.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update customer type';
    });

    builder.addCase(deleteCustomerType.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteCustomerType.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.customerTypes = state.customerTypes.filter((c) => c.customerTypeId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Customer type deleted successfully';
    });
    builder.addCase(deleteCustomerType.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete customer type';
    });

    builder.addCase(fetchCustomersDropdown.fulfilled, (state, { payload }) => {
      state.dropdownCustomers = payload.data;
    });
    builder.addCase(fetchCustomerBalance.fulfilled, (state, { payload }) => {
      state.customerBalance = payload.data;
    });
    builder.addCase(fetchCustomerLedger.pending, (state) => {
      state.ledgerLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerLedger.fulfilled, (state, { payload }) => {
      state.ledgerLoading = false;
      state.customerLedger = payload.data;
      state.customerLedgerMessage = payload.message || '';
    });
    builder.addCase(fetchCustomerLedger.rejected, (state, { payload }) => {
      state.ledgerLoading = false;
      state.customerLedger = [];
      state.customerLedgerMessage = '';
      state.error = payload || 'Failed to fetch customer ledger';
    });

    builder.addCase(fetchAllCustomerPendingPayments.pending, (state) => {
      state.pendingPaymentsLoading = true;
      state.pendingPaymentsError = null;
    });
    builder.addCase(fetchAllCustomerPendingPayments.fulfilled, (state, { payload }) => {
      state.pendingPaymentsLoading = false;
      state.pendingPayments = payload;
      state.pendingPaymentsCustomerId = 0;
    });
    builder.addCase(fetchAllCustomerPendingPayments.rejected, (state, { payload }) => {
      state.pendingPaymentsLoading = false;
      state.pendingPaymentsError = payload || 'Failed to load pending payments';
      state.pendingPayments = null;
    });

    builder.addCase(fetchCustomerPendingPayments.pending, (state) => {
      state.pendingPaymentsLoading = true;
      state.pendingPaymentsError = null;
    });
    builder.addCase(fetchCustomerPendingPayments.fulfilled, (state, { payload, meta }) => {
      state.pendingPaymentsLoading = false;
      state.pendingPayments = payload;
      state.pendingPaymentsCustomerId = meta.arg;
    });
    builder.addCase(fetchCustomerPendingPayments.rejected, (state, { payload }) => {
      state.pendingPaymentsLoading = false;
      state.pendingPaymentsError = payload || 'Failed to load pending payments';
      state.pendingPayments = null;
    });
    builder.addCase(fetchCustomerLoyalty.fulfilled, (state, { payload }) => {
      state.customerLoyalty = payload.data;
    });

    builder.addCase(createCustomer.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createCustomer.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.customers.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Customer created successfully';
    });
    builder.addCase(createCustomer.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create customer';
    });

    builder.addCase(updateCustomer.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateCustomer.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.customers.findIndex((c) => c.customerId === payload.data.customerId);
      if (index !== -1) state.customers[index] = payload.data;
      state.selectedCustomer = payload.data;
      state.success = true;
      state.message = payload.message || 'Customer updated successfully';
    });
    builder.addCase(updateCustomer.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update customer';
    });

    builder.addCase(deleteCustomer.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteCustomer.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.customers = state.customers.filter((c) => c.customerId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Customer deleted successfully';
    });
    builder.addCase(deleteCustomer.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete customer';
    });

    builder.addCase(addCustomerLoyalty.fulfilled, (state, { payload }) => {
      state.success = true;
      state.message = payload.message || 'Loyalty points added successfully';
    });
    builder.addCase(redeemCustomerLoyalty.fulfilled, (state, { payload }) => {
      state.success = true;
      state.message = payload.message || 'Loyalty points redeemed successfully';
    });

    const paymentCases = [customerSalePayment, customerBulkPayment] as const;
    for (const thunk of paymentCases) {
      builder.addCase(thunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      });
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.success = true;
        state.message = payload.message || 'Payment recorded successfully';
      });
      builder.addCase(thunk.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || 'Payment failed';
      });
    }
  },
});

export const {
  clearCustomerState,
  clearSelectedCustomer,
  clearCustomerLedger,
  clearPendingPayments,
  setCurrentPage,
} = customerSlice.actions;
export const customerSliceConfig = configureSlice(customerSlice, false);

export default customerSlice.reducer;

