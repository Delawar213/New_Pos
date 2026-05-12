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
  PaginatedCustomerResponse,
  CustomerLoyaltyRequest,
} from '@/types/customer';
import type { RootState } from '@/store';
import type { PaginationParams } from '@/types/common';
import { listQueryParams } from '@/lib/listQueryParams';

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
}

const initialState: CustomerState = {
  customers: [],
  activeCustomers: [],
  dropdownCustomers: [],
  customerTypes: [],
  walkingCustomer: null,
  selectedCustomer: null,
  customerLedger: [],
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
};

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
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<CustomerDropdown[]>>('/proxy/customers/dropdown');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customers dropdown');
    }
  }
);

export const fetchCustomerBalance = createAsyncThunk<ApiResponse<number>, number, { rejectValue: string; state: RootState }>(
  'customer/fetchBalance',
  async (customerId, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<ApiResponse<number>>(`/proxy/customers/${customerId}/balance`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer balance');
    }
  }
);

export const fetchCustomerLedger = createAsyncThunk<
  ApiResponse<CustomerLedgerEntry[]>,
  { customerId: number; fromDate: string; toDate: string },
  { rejectValue: string; state: RootState }
>('customer/fetchLedger', async ({ customerId, fromDate, toDate }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<CustomerLedgerEntry[]>>(
      `/proxy/customers/${customerId}/ledger?fromDate=${fromDate}&toDate=${toDate}`
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch customer ledger');
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
    builder.addCase(fetchCustomerLedger.fulfilled, (state, { payload }) => {
      state.customerLedger = payload.data;
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
  },
});

export const { clearCustomerState, clearSelectedCustomer, setCurrentPage } = customerSlice.actions;
export const customerSliceConfig = configureSlice(customerSlice, false);

export default customerSlice.reducer;

