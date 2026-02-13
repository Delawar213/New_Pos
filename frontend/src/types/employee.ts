// ============================================
// Employee Types
// ============================================

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: number;
  branchName?: string;
  salary: number;
  address?: string;
  joiningDate: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  branchId?: number;
  salary: number;
  address?: string;
  joiningDate: string;
  avatar?: string;
  isActive: boolean;
}

export interface UpdateEmployeeRequest {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: number;
  salary: number;
  address?: string;
  joiningDate: string;
  avatar?: string;
  isActive: boolean;
}
