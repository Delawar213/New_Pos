// ============================================
// Customer Types
// ============================================

export interface Customer {
  customerId: number;
  customerCode: string;
  customerTypeId: number;
  customerTypeName?: string;
  customerName: string;
  contactNo?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  vatNumber?: string;
  isVatRegistered?: boolean;
  openingBalance?: number;
  currentBalance?: number;
  creditLimit: number;
  creditDays: number;
  loyaltyPoints?: number;
  isActive: boolean;
  createdDatetime: string;
}

export interface CreateCustomerRequest {
  customerCode: string;
  customerName: string;
  customerTypeId: number;
  contactNo?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  vatNumber?: string;
  creditLimit: number;
  creditDays: number;
  isActive: boolean;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  customerId: number;
}

export interface CustomerType {
  customerTypeId: number;
  typeName: string;
  description?: string;
  isActive: boolean;
}

export interface CreateCustomerTypeRequest {
  typeName: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateCustomerTypeRequest extends CreateCustomerTypeRequest {
  customerTypeId: number;
}

export interface CustomerDropdown {
  customerId: number;
  customerCode: string;
  customerName: string;
  customerTypeName: string;
  currentBalance: number;
  creditLimit: number;
}

/** Row from `GET /api/Customers/{customerId}/ledger`. */
export interface CustomerLedgerEntry {
  customerId: number;
  customerName: string;
  transactionDate: string;
  transactionType: string;
  referenceNo: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
}

export interface CustomerLedgerQuery {
  customerId: number;
  fromDate?: string;
  toDate?: string;
}

export interface PaginatedCustomerResponse {
  data: Customer[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CustomerLoyaltyRequest {
  points: number;
}

/** POST `/api/Customers/sale-payment` — payment against one sale invoice. */
export interface CustomerSalePaymentRequest {
  saleId: number;
  paymentAmount: number;
  bankAccountId: number;
  paymentDate: string;
  description: string;
  createdBy: number;
}

/** POST `/api/Customers/bulk-payment` — allocate payment across customer balance. */
export interface CustomerBulkPaymentRequest {
  customerId: number;
  paymentAmount: number;
  bankAccountId: number;
  paymentDate: string;
  description: string;
  createdBy: number;
}
