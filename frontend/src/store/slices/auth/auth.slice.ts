// store/slices/auth.slice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API } from '@/config/api.config';
import { configureSlice } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

interface ApiError {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  status: string;
  user?: User;
  token?: string;
  access_token?: string;
  message?: string;
  [key: string]: unknown;
}

interface IState {
  isLoggedIn: boolean;
  user: User | Record<string, never>;
  token: string;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
  message: string;
}

const initialState: IState = {
  isLoggedIn: false,
  user: {},
  token: '',
  loading: false,
  error: null,
  success: false,
  message: '',
};

export const loginUser = createAsyncThunk<
  LoginResponse,
  { username: string; password: string },
  { rejectValue: ApiError }
>(
  'auth/login',
  async (data: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await API('api').post<LoginResponse>('/User/login', data);

      // Check API status
      if (response.data.status !== "Success") {
        return rejectWithValue(response.data as ApiError);
      }

      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ApiError }; message?: string };
      return rejectWithValue(apiError.response?.data || { message: apiError.message });
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState(state) {
      state.isLoggedIn = false;
      state.user = {};
      state.token = '';
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
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
      state.user = payload.user || (payload as unknown as User);
      state.token = payload.token || payload.access_token || '';
      state.loading = false;
      state.error = null;
      state.success = true;
      state.message = payload.message || 'Login successful';
    });

    builder.addCase(loginUser.rejected, (state, { payload }) => {
      state.isLoggedIn = false;
      state.user = {};
      state.token = '';
      state.loading = false;
      state.success = false;
      state.error = payload || { message: 'Login failed' };
      state.message = payload?.message || 'Login failed';
    });

  },
});

export const { clearAuthState, setToken } = authSlice.actions;
export const authSliceConfig = configureSlice(authSlice, true);

export default authSlice.reducer;
