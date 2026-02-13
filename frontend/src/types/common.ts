// ============================================
// Common Types - Shared across all modules
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
