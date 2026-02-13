// ============================================
// Brand Types
// ============================================

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
}

export interface UpdateBrandRequest extends CreateBrandRequest {
  id: number;
}
