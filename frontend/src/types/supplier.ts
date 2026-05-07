// ============================================
// Supplier Types
// ============================================

export interface Supplier {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  contactNo?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  vatNumber?: string;
  openingBalance?: number;
  currentBalance?: number;
  creditDays: number;
  isActive: boolean;
  createdDatetime: string;
}

export interface CreateSupplierRequest {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  contactNo?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  vatNumber?: string;
  creditDays: number;
  isActive: boolean;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  supplierId: number;
}

export interface SupplierDropdown {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  currentBalance: number;
}

export interface SupplierLedgerEntry {
  [key: string]: unknown;
}

export interface PaginatedSupplierResponse {
  data: Supplier[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
