// ============================================
// Supplier Types
// ============================================

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  companyName?: string;
  taxNumber?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  companyName?: string;
  taxNumber?: string;
  openingBalance: number;
  isActive: boolean;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  id: number;
}
