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

export interface CustomerDropdown {
  customerId: number;
  customerCode: string;
  customerName: string;
  customerTypeName: string;
  currentBalance: number;
  creditLimit: number;
}

export interface CustomerLedgerEntry {
  [key: string]: unknown;
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
