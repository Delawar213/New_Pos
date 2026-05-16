import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserCreatedData,
  UserListRow,
  UserPagedPayload,
} from "@/types/user";
import type { RootState } from "@/store";

function mapUserPage(payload: UserPagedPayload): PaginatedResponse<UserListRow> {
  return {
    items: Array.isArray(payload.data) ? payload.data : [],
    totalCount: Number(payload.totalRecords) || 0,
    pageNumber: Number(payload.pageNumber) || 1,
    pageSize: Number(payload.pageSize) || 10,
    totalPages: Number(payload.totalPages) || 0,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

interface UserState {
  list: UserListRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  message: string;
}

const initialState: UserState = {
  list: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  loading: false,
  actionLoading: false,
  error: null,
  message: "",
};

export const fetchUsersPage = createAsyncThunk<
  PaginatedResponse<UserListRow>,
  PaginationParams | void,
  { rejectValue: string; state: RootState }
>("user/fetchUsersPage", async (params, { rejectWithValue }) => {
  const pageNumber = params?.pageNumber ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const search = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (params?.searchTerm?.trim()) {
    search.set("searchTerm", params.searchTerm.trim());
  }

  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<UserPagedPayload>>(`/proxy/User?${search.toString()}`);
    const fail = getApiErrorMessage(response.data);
    if (fail) return rejectWithValue(fail);
    const inner = response.data.data;
    if (inner == null || typeof inner !== "object") {
      return rejectWithValue("Invalid user list response.");
    }
    return mapUserPage(inner as UserPagedPayload);
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const body = e.response?.data;
      if (body && typeof body === "object" && "message" in body) {
        const msg = getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] });
        return rejectWithValue(msg || String((body as { message?: string }).message));
      }
    }
    return rejectWithValue(e instanceof Error ? e.message : "Failed to load users.");
  }
});

export const createUser = createAsyncThunk<
  UserCreatedData,
  CreateUserRequest,
  { rejectValue: string; state: RootState }
>("user/createUser", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<UserCreatedData>>("/proxy/User", payload);
    const fail = getApiErrorMessage(response.data);
    if (fail) return rejectWithValue(fail);
    const row = response.data.data;
    if (row == null || typeof row !== "object" || !("userId" in row)) {
      return rejectWithValue("Invalid create user response.");
    }
    return row as UserCreatedData;
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const body = e.response?.data;
      if (body && typeof body === "object") {
        const msg = getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] });
        return rejectWithValue(msg || "Create user failed.");
      }
    }
    return rejectWithValue(e instanceof Error ? e.message : "Create user failed.");
  }
});

export const updateUser = createAsyncThunk<
  void,
  { id: number; body: UpdateUserRequest },
  { rejectValue: string; state: RootState }
>("user/updateUser", async ({ id, body }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/User/update/${id}`, body);
    const fail = getApiErrorMessage(response.data);
    if (fail) return rejectWithValue(fail);
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const body = e.response?.data;
      if (body && typeof body === "object") {
        const msg = getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] });
        return rejectWithValue(msg || "Update user failed.");
      }
    }
    return rejectWithValue(e instanceof Error ? e.message : "Update user failed.");
  }
});

export const deleteUser = createAsyncThunk<void, number, { rejectValue: string; state: RootState }>(
  "user/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<ApiResponse<unknown>>(`/proxy/User/delete/${id}`);
      const fail = getApiErrorMessage(response.data);
      if (fail) return rejectWithValue(fail);
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const body = e.response?.data;
        if (body && typeof body === "object") {
          const msg = getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] });
          return rejectWithValue(msg || "Delete user failed.");
        }
      }
      return rejectWithValue(e instanceof Error ? e.message : "Delete user failed.");
    }
  }
);

export const changeUserPassword = createAsyncThunk<
  void,
  ChangePasswordRequest,
  { rejectValue: string; state: RootState }
>("user/changeUserPassword", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>("/proxy/User/change-password", payload);
    const fail = getApiErrorMessage(response.data);
    if (fail) return rejectWithValue(fail);
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const body = e.response?.data;
      if (body && typeof body === "object") {
        const msg = getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] });
        return rejectWithValue(msg || "Change password failed.");
      }
    }
    return rejectWithValue(e instanceof Error ? e.message : "Change password failed.");
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserState(state) {
      state.list = [];
      state.totalCount = 0;
      state.currentPage = 1;
      state.pageSize = 10;
      state.totalPages = 0;
      state.hasPreviousPage = false;
      state.hasNextPage = false;
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersPage.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.totalCount = payload.totalCount;
        state.currentPage = payload.pageNumber;
        state.pageSize = payload.pageSize;
        state.totalPages = payload.totalPages;
        state.hasNextPage = payload.hasNextPage;
        state.hasPreviousPage = payload.hasPreviousPage;
        state.message = "";
      })
      .addCase(fetchUsersPage.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to load users";
      })
      .addCase(createUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.message = "User created";
        state.list = [
          {
            userId: payload.userId,
            name: payload.name,
            userName: payload.userName,
            roleId: payload.roleId,
            roleName: payload.roleName,
            isActive: payload.isActive,
            createdDateTime: payload.createdDateTime,
            profileImageUrl: payload.profileImageUrl,
          },
          ...state.list,
        ];
        state.totalCount += 1;
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Create failed";
      })
      .addCase(updateUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = "User updated";
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Update failed";
      })
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = "User deleted";
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Delete failed";
      })
      .addCase(changeUserPassword.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.actionLoading = false;
        state.message = "Password changed";
      })
      .addCase(changeUserPassword.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Password change failed";
      });
  },
});

export const { clearUserState } = userSlice.actions;
export const userSliceConfig = configureSlice(userSlice, false);

export default userSlice.reducer;
