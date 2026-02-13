// ============================================
// Customer Types
// ============================================

export interface Customer {
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
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
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

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
}
