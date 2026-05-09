// ============================================
// Subcategory Types
// ============================================

export interface SubCategory {
  subCategoryId: number;
  categoryId: number;
  categoryName: string;
  subCategoryName: string;
  isActive: boolean;
  createdDatetime: string;
}

export interface CreateSubCategoryRequest {
  categoryId: number;
  subCategoryName: string;
  isActive: boolean;
}

export interface UpdateSubCategoryRequest {
  subCategoryId: number;
  categoryId: number;
  subCategoryName: string;
  isActive: boolean;
}
