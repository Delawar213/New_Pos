// ============================================
// Category Types
// ============================================

export interface SubCategory {
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
  subCategories: SubCategory[];
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
