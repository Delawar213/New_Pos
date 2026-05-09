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
  isActive: boolean;
}

export interface UpdateCategoryRequest {
  categoryId: number;
  categoryName: string;
  description?: string;
  parentCategoryId?: number | null;
  isActive: boolean;
}
