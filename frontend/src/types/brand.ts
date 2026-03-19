// ============================================
// Brand Types
// ============================================

export interface Brand {
  brandId: number;
  brandName: string;
  isActive: boolean;
  createdDatetime: string;
}

export interface CreateBrandRequest {
  brandName: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateBrandRequest {
  brandId: number;
  brandName: string;
  description?: string;
  isActive: boolean;
}

export interface BrandDropdown {
  brandId: number;
  brandName: string;
}

export interface PaginatedBrandResponse {
  data: Brand[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
