// ============================================
// Transaction Types
// ============================================

export interface TransactionDetail {
  detailId: number;
  accountType: string;
  accountName: string;
  refTable?: string;
  refId?: number;
  bankAccountId?: number;
  bankAccountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface Transaction {
  transactionId: number;
  transactionCode: string;
  transactionDate: string;
  title: string;
  description?: string;
  referenceNo?: string;
  status: string;
  createdDatetime: string;
  transactionDetails: TransactionDetail[];
}

export interface PaginatedTransactionResponse {
  data: Transaction[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateTransactionDetailLine {
  accountType: string;
  accountName: string;
  refTable: string | null;
  refId: number | null;
  bankAccountId: number | null;
  debit: number;
  credit: number;
  description: string;
}

export interface CreateTransactionRequest {
  transactionDate: string;
  title: string;
  referenceNo?: string;
  description?: string;
  status?: string;
  createdBy?: number | null;
  transactionDetails: CreateTransactionDetailLine[];
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {
  transactionId: number;
}
