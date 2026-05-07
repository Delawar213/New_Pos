import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { configureSlice } from '@/lib/utils';
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  PaginatedEmployeeResponse,
} from '@/types/employee';
import type { RootState } from '@/store';

const createAuthenticatedRequest = (token?: string) => {
  const normalizedToken = token?.startsWith('Bearer ') ? token.slice(7) : token;
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      ...(normalizedToken
        ? {
            Authorization: `Bearer ${normalizedToken}`,
            'X-Access-Token': normalizedToken,
          }
        : {}),
    },
  });
};

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
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

const initialState: EmployeeState = {
  employees: [],
  selectedEmployee: null,
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

export const fetchEmployees = createAsyncThunk<
  ApiResponse<PaginatedEmployeeResponse>,
  { pageNumber?: number; pageSize?: number },
  { rejectValue: string; state: RootState }
>('employee/fetchAll', async ({ pageNumber = 1, pageSize = 10 }, { rejectWithValue, getState }) => {
  try {
    const api = createAuthenticatedRequest(getState().auth?.token);
    const response = await api.get<ApiResponse<PaginatedEmployeeResponse>>(
      `/proxy/employees?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch employees');
  }
});

export const fetchEmployeeById = createAsyncThunk<ApiResponse<Employee>, number, { rejectValue: string; state: RootState }>(
  'employee/fetchById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest(getState().auth?.token);
      const response = await api.get<ApiResponse<Employee>>(`/proxy/employees/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch employee');
    }
  }
);

export const createEmployee = createAsyncThunk<ApiResponse<Employee>, CreateEmployeeRequest, { rejectValue: string; state: RootState }>(
  'employee/create',
  async (employeeData, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest(getState().auth?.token);
      const response = await api.post<ApiResponse<Employee>>('/proxy/employees', employeeData);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk<ApiResponse<Employee>, UpdateEmployeeRequest, { rejectValue: string; state: RootState }>(
  'employee/update',
  async (employeeData, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest(getState().auth?.token);
      const response = await api.put<ApiResponse<Employee>>(`/proxy/employees/${employeeData.employeeId}`, employeeData);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk<{ id: number; message: string }, number, { rejectValue: string; state: RootState }>(
  'employee/delete',
  async (id, { rejectWithValue, getState }) => {
    try {
      const api = createAuthenticatedRequest(getState().auth?.token);
      const response = await api.delete<ApiResponse<unknown>>(`/proxy/employees/${id}`);
      return { id, message: response.data.message || 'Employee deleted successfully' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete employee');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearEmployeeState(state) {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearSelectedEmployee(state) {
      state.selectedEmployee = null;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEmployees.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.employees = payload.data.data;
      state.totalCount = payload.data.totalRecords;
      state.currentPage = payload.data.pageNumber;
      state.pageSize = payload.data.pageSize;
      state.totalPages = payload.data.totalPages;
      state.hasPreviousPage = payload.data.hasPreviousPage;
      state.hasNextPage = payload.data.hasNextPage;
    });
    builder.addCase(fetchEmployees.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload || 'Failed to fetch employees';
    });

    builder.addCase(fetchEmployeeById.fulfilled, (state, { payload }) => {
      state.selectedEmployee = payload.data;
    });

    builder.addCase(createEmployee.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(createEmployee.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.employees.unshift(payload.data);
      state.success = true;
      state.message = payload.message || 'Employee created successfully';
    });
    builder.addCase(createEmployee.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to create employee';
    });

    builder.addCase(updateEmployee.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateEmployee.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      const index = state.employees.findIndex((e) => e.employeeId === payload.data.employeeId);
      if (index !== -1) {
        state.employees[index] = payload.data;
      }
      state.selectedEmployee = payload.data;
      state.success = true;
      state.message = payload.message || 'Employee updated successfully';
    });
    builder.addCase(updateEmployee.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to update employee';
    });

    builder.addCase(deleteEmployee.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deleteEmployee.fulfilled, (state, { payload }) => {
      state.actionLoading = false;
      state.employees = state.employees.filter((e) => e.employeeId !== payload.id);
      state.success = true;
      state.message = payload.message || 'Employee deleted successfully';
    });
    builder.addCase(deleteEmployee.rejected, (state, { payload }) => {
      state.actionLoading = false;
      state.error = payload || 'Failed to delete employee';
    });
  },
});

export const { clearEmployeeState, clearSelectedEmployee, setCurrentPage } = employeeSlice.actions;
export const employeeSliceConfig = configureSlice(employeeSlice, false);

export default employeeSlice.reducer;

