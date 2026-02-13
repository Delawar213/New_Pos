// ============================================
// Bank Account Types
// ============================================

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  openingBalance: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateBankAccountRequest extends CreateBankAccountRequest {
  id: number;
}
