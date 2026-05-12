// store/slices/bankAccount/bankAccount.slice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { configureSlice } from "@/lib/utils";
import { createAuthenticatedAxios } from "@/lib/createAuthenticatedAxios";
import { getApiErrorMessage } from "@/lib/apiResult";
import type {
  BankAccount,
  BankAccountDropdown,
  CashAccount,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
} from "@/types";
import type { RootState } from "@/store";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

/** Backend expects PascalCase `SortCode` on write. */
function toWriteBody(body: CreateBankAccountRequest) {
  return {
    accountName: body.accountName.trim(),
    accountNumber: body.accountNumber.trim(),
    accountType: body.accountType,
    bankName: body.bankName ?? null,
    branchName: body.branchName ?? null,
    SortCode: (body.sortCode ?? "").trim(),
    openingBalance: body.openingBalance,
    isActive: body.isActive,
  };
}

export interface BankAccountPagePayload {
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  bankOnlyAccounts: BankAccount[];
  dropdownAccounts: BankAccountDropdown[];
  totalCashBalance: number;
  totalBankBalance: number;
  firstAccountBalance: number;
}

interface BankAccountState {
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  bankOnlyAccounts: BankAccount[];
  dropdownAccounts: BankAccountDropdown[];
  totalCashBalance: number;
  totalBankBalance: number;
  firstAccountBalance: number;
  selectedBankAccount: BankAccount | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
  message: string;
}

const initialState: BankAccountState = {
  bankAccounts: [],
  cashAccounts: [],
  bankOnlyAccounts: [],
  dropdownAccounts: [],
  totalCashBalance: 0,
  totalBankBalance: 0,
  firstAccountBalance: 0,
  selectedBankAccount: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
  message: "",
};

/** Loads only `/proxy/bankaccounts/dropdown` (e.g. supplier payment source account). */
export const fetchBankAccountsDropdown = createAsyncThunk<
  BankAccountDropdown[],
  void,
  { rejectValue: string; state: RootState }
>("bankAccount/fetchDropdown", async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<BankAccountDropdown[]>>("/proxy/bankaccounts/dropdown");
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data.data ?? [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load accounts");
  }
});

export const loadBankAccountPage = createAsyncThunk<
  BankAccountPagePayload,
  void,
  { rejectValue: string; state: RootState }
>("bankAccount/loadPage", async (_, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const [
      allRes,
      cashRes,
      bankRes,
      dropdownRes,
      totalCashRes,
      totalBankRes,
    ] = await Promise.all([
      api.get<ApiResponse<BankAccount[]>>("/proxy/bankaccounts"),
      api.get<ApiResponse<CashAccount[]>>("/proxy/bankaccounts/cash"),
      api.get<ApiResponse<BankAccount[]>>("/proxy/bankaccounts/bank"),
      api.get<ApiResponse<BankAccountDropdown[]>>("/proxy/bankaccounts/dropdown"),
      api.get<ApiResponse<number>>("/proxy/bankaccounts/totals/cash"),
      api.get<ApiResponse<number>>("/proxy/bankaccounts/totals/bank"),
    ]);

    const bankAccounts = allRes.data.data ?? [];
    const firstId = bankAccounts[0]?.bankAccountId;
    let firstAccountBalance = 0;
    if (firstId != null) {
      try {
        const balRes = await api.get<ApiResponse<number>>(`/proxy/bankaccounts/${firstId}/balance`);
        const v = balRes.data.data;
        firstAccountBalance = typeof v === "number" ? v : Number(v) || 0;
      } catch {
        firstAccountBalance = 0;
      }
    }

    const tc = totalCashRes.data.data;
    const tb = totalBankRes.data.data;

    return {
      bankAccounts,
      cashAccounts: cashRes.data.data ?? [],
      bankOnlyAccounts: bankRes.data.data ?? [],
      dropdownAccounts: dropdownRes.data.data ?? [],
      totalCashBalance: typeof tc === "number" ? tc : Number(tc) || 0,
      totalBankBalance: typeof tb === "number" ? tb : Number(tb) || 0,
      firstAccountBalance,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to load bank accounts");
  }
});

export const fetchBankAccountById = createAsyncThunk<
  ApiResponse<BankAccount>,
  number,
  { rejectValue: string; state: RootState }
>("bankAccount/fetchById", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.get<ApiResponse<BankAccount>>(`/proxy/bankaccounts/${id}`);
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch bank account");
  }
});

export const createBankAccount = createAsyncThunk<
  ApiResponse<BankAccount>,
  CreateBankAccountRequest,
  { rejectValue: string; state: RootState }
>("bankAccount/create", async (payload, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<BankAccount>>("/proxy/bankaccounts", toWriteBody(payload));
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to create bank account");
  }
});

export const updateBankAccount = createAsyncThunk<
  ApiResponse<BankAccount>,
  UpdateBankAccountRequest,
  { rejectValue: string; state: RootState }
>("bankAccount/update", async ({ bankAccountId, ...rest }, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<BankAccount>>(`/proxy/bankaccounts/update/${bankAccountId}`, {
      bankAccountId,
      ...toWriteBody(rest),
    });
    const failMsg = getApiErrorMessage(response.data);
    if (failMsg) return rejectWithValue(failMsg);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to update bank account");
  }
});

export const deleteBankAccount = createAsyncThunk<
  { id: number; message: string },
  number,
  { rejectValue: string; state: RootState }
>("bankAccount/delete", async (id, { rejectWithValue }) => {
  try {
    const api = createAuthenticatedAxios();
    const response = await api.post<ApiResponse<unknown>>(`/proxy/bankaccounts/${id}`);
    const body = response.data;
    if (body && typeof body === "object") {
      const failMsg = getApiErrorMessage(body as ApiResponse<unknown>);
      if (failMsg) return rejectWithValue(failMsg);
      const msg = (body as ApiResponse<unknown>).message;
      return { id, message: typeof msg === "string" && msg.trim() ? msg : "Bank account deleted" };
    }
    return { id, message: "Bank account deleted" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete bank account");
  }
});

const bankAccountSlice = createSlice({
  name: "bankAccount",
  initialState,
  reducers: {
    clearBankAccountState(state) {
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearSelectedBankAccount(state) {
      state.selectedBankAccount = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBankAccountPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBankAccountPage.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.bankAccounts = payload.bankAccounts;
        state.cashAccounts = payload.cashAccounts;
        state.bankOnlyAccounts = payload.bankOnlyAccounts;
        state.dropdownAccounts = payload.dropdownAccounts;
        state.totalCashBalance = payload.totalCashBalance;
        state.totalBankBalance = payload.totalBankBalance;
        state.firstAccountBalance = payload.firstAccountBalance;
      })
      .addCase(loadBankAccountPage.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed to load";
      });

    builder.addCase(fetchBankAccountsDropdown.fulfilled, (state, { payload }) => {
      state.dropdownAccounts = payload;
    });

    builder
      .addCase(fetchBankAccountById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchBankAccountById.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.selectedBankAccount = payload.data;
      })
      .addCase(fetchBankAccountById.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Failed to fetch account";
      });

    builder
      .addCase(createBankAccount.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBankAccount.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.success = true;
        state.message = payload.message || "Bank account created successfully";
      })
      .addCase(createBankAccount.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Failed to create";
        state.success = false;
      });

    builder
      .addCase(updateBankAccount.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateBankAccount.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.success = true;
        state.message = payload.message || "Bank account updated successfully";
        const row = payload.data;
        if (row) {
          const i = state.bankAccounts.findIndex((a) => a.bankAccountId === row.bankAccountId);
          if (i !== -1) state.bankAccounts[i] = { ...state.bankAccounts[i], ...row };
        }
      })
      .addCase(updateBankAccount.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Failed to update";
        state.success = false;
      });

    builder
      .addCase(deleteBankAccount.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteBankAccount.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.success = true;
        state.message = payload.message;
        state.bankAccounts = state.bankAccounts.filter((a) => a.bankAccountId !== payload.id);
        state.cashAccounts = state.cashAccounts.filter((a) => a.bankAccountId !== payload.id);
        state.bankOnlyAccounts = state.bankOnlyAccounts.filter((a) => a.bankAccountId !== payload.id);
        state.dropdownAccounts = state.dropdownAccounts.filter((a) => a.bankAccountId !== payload.id);
      })
      .addCase(deleteBankAccount.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload || "Failed to delete";
        state.success = false;
      });
  },
});

export const { clearBankAccountState, clearSelectedBankAccount } = bankAccountSlice.actions;
export const bankAccountSliceConfig = configureSlice(bankAccountSlice, false);

export default bankAccountSlice.reducer;
