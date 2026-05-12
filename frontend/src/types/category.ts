// ============================================
// Category Types
// ============================================

/** Subcategory summary embedded on `Category` (API list/detail). Distinct from `SubCategory` in `./subcategory`. */
export interface CategorySubCategorySummary {
  subCategoryId: number;
  subCategoryName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number | null;
  parentCategoryName?: string;
  displayOrder: number;
  vatRate: number;
  isActive: boolean;
  createdDatetime: string;
  subCategories: CategorySubCategorySummary[];
}

export interface CreateCategoryRequest {
  categoryName: string;
  description?: string;
  parentCategoryId?: number | null;
  displayOrder?: number;
  vatRate?: number;
  isActive: boolean;
}

export interface UpdateCategoryRequest {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number | null;
  isActive: boolean;
}

/** List endpoint may return this shape instead of a bare `Category[]`. */
export interface PaginatedCategoryResponse {
  data: Category[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
