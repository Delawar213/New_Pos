// ============================================
// Transaction Types
// ============================================

export type TransactionType = "income" | "expense" | "transfer";
export type PaymentMethod = "cash" | "card" | "bank" | "cheque" | "online";

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: number;
  bankAccountName?: string;
  expenseCategoryId?: number;
  expenseCategoryName?: string;
  referenceNo?: string;
  description?: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId?: number;
  expenseCategoryId?: number;
  referenceNo?: string;
  description?: string;
  date: string;
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {
  id: number;
}
