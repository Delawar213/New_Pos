// store/slices/auth/auth.slice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import axios from "axios";
import { configureSlice } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiResult";
import type { ApiResponse } from "@/types/common";
import type { AuthUser } from "@/types/auth";
import type { CompanyInfo } from "@/types/company";
import type { LoginUserData } from "@/types/user";
import { normalizeCompanyInfo } from "@/lib/companyInfo";

interface ApiError {
  status?: string;
  message?: string;
  errors?: string[];
  [key: string]: unknown;
}

interface IState {
  isLoggedIn: boolean;
  user: AuthUser | Record<string, never>;
  token: string;
  companyInfo: CompanyInfo | null;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
  message: string;
}

const initialState: IState = {
  isLoggedIn: false,
  user: {},
  token: "",
  companyInfo: null,
  loading: false,
  error: null,
  success: false,
  message: "",
};

function mapLoginDataToAuthUser(data: LoginUserData): AuthUser {
  return {
    id: data.userId,
    userId: data.userId,
    userName: data.userName,
    name: data.name,
    roleId: data.roleId,
    roleName: data.roleName,
    profileImageUrl: data.profileImageUrl ?? null,
  };
}

export const loginUser = createAsyncThunk<
  { user: AuthUser; token: string; companyInfo: CompanyInfo | null; message: string },
  { userName: string; password: string },
  { rejectValue: ApiError }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axios.post<ApiResponse<LoginUserData>>(
      "/proxy/User/login",
      {
        userName: credentials.userName.trim(),
        password: credentials.password,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const envelope = response.data;
    const failMsg = getApiErrorMessage(envelope);
    if (failMsg) {
      return rejectWithValue({ message: failMsg, errors: envelope.errors ?? undefined });
    }

    const data = envelope.data;
    if (data == null || typeof data !== "object" || typeof data.token !== "string") {
      return rejectWithValue({ message: "Invalid login response from server." });
    }

    const token = data.token.trim();
    if (!token) {
      return rejectWithValue({ message: "No token returned from server." });
    }

    return {
      user: mapLoginDataToAuthUser(data),
      token,
      companyInfo: normalizeCompanyInfo(data.companyInfo),
      message: typeof envelope.message === "string" ? envelope.message : "Login successful",
    };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const body = error.response?.data;
      if (body && typeof body === "object") {
        const msg =
          getApiErrorMessage(body as { success?: boolean; message?: string; errors?: string[] }) ||
          (typeof (body as { message?: string }).message === "string"
            ? (body as { message: string }).message
            : undefined);
        if (msg) return rejectWithValue({ message: msg });
      }
      const status = error.response?.status;
      if (status === 502 || status === 503 || status === 504) {
        return rejectWithValue({
          message:
            "Cannot reach the API server. Start the backend or update NEXT_PUBLIC_API_BASE_URL in .env.local, then restart `npm run dev`.",
        });
      }
      if (status === 500 && !body) {
        return rejectWithValue({
          message:
            "Server error while contacting the API. Check that the backend is running at the URL in .env.local.",
        });
      }
    }
    const apiError = error as { message?: string };
    const raw = apiError.message || "";
    if (/status code 500/i.test(raw)) {
      return rejectWithValue({
        message:
          "Cannot reach the API server. Verify NEXT_PUBLIC_API_BASE_URL in .env.local and that the backend is running.",
      });
    }
    return rejectWithValue({ message: raw || "Login failed" });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState(state) {
      state.isLoggedIn = false;
      state.user = {};
      state.token = "";
      state.companyInfo = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    setToken(state, action) {
      state.isLoggedIn = true;
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, { payload }) => {
      state.isLoggedIn = true;
      state.user = payload.user;
      state.token = payload.token;
      state.companyInfo = payload.companyInfo;
      state.loading = false;
      state.error = null;
      state.success = true;
      state.message = payload.message;
    });

    builder.addCase(loginUser.rejected, (state, { payload }) => {
      state.isLoggedIn = false;
      state.user = {};
      state.token = "";
      state.companyInfo = null;
      state.loading = false;
      state.success = false;
      state.error = payload || { message: "Login failed" };
      state.message = payload?.message || "Login failed";
    });
  },
});

export const { clearAuthState, setToken } = authSlice.actions;
export const authSliceConfig = configureSlice(authSlice, true);

export default authSlice.reducer;
