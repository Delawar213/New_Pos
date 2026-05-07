// ============================================
// Bank Account Types
// ============================================

export interface BankAccount {
  bankAccountId: number;
  accountName: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  sortCode?: string;
  openingBalance: number;
  currentBalance: number;
  lastTransactionDate?: string;
  isActive: boolean;
  createdDatetime: string;
}

export interface CashAccount {
  bankAccountId: number;
  accountName: string;
  accountType: string;
  currentBalance: number;
}

export interface BankAccountDropdown {
  bankAccountId: number;
  accountName: string;
  accountType: string;
  currentBalance: number;
}

export interface CreateBankAccountRequest {
  accountName: string;
  accountType: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNumber: string;
  sortCode?: string;
  openingBalance: number;
  isActive: boolean;
}

export interface UpdateBankAccountRequest extends CreateBankAccountRequest {
  bankAccountId: number;
}

export interface BankAccountsByTypeParams {
  accountType: "Cash" | "Bank";
}
