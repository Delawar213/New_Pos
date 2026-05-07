// ============================================
// Expense Category Types
// ============================================

export interface ExpenseCategory {
  expenseCategoryId: number;
  categoryName: string;
  expenseType: string;
  isVatApplicable: boolean;
  defaultVatRate: number;
  description?: string;
  isActive: boolean;
}

export interface CreateExpenseCategoryRequest {
  categoryName: string;
  expenseType: string;
  isVatApplicable: boolean;
  defaultVatRate: number;
  description?: string;
  isActive: boolean;
}

export interface UpdateExpenseCategoryRequest extends CreateExpenseCategoryRequest {
  expenseCategoryId: number;
}
