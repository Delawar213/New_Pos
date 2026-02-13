// ============================================
// Category Types
// ============================================

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: number;
  isActive: boolean;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: number;
}
