// ============================================
// Expense Category Types
// ============================================

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateExpenseCategoryRequest extends CreateExpenseCategoryRequest {
  id: number;
}
