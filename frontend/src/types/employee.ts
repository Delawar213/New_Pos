// ============================================
// Employee Types
// ============================================

export interface Employee {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  contactNo?: string;
  email?: string;
  address?: string;
  postcode?: string;
  nationalInsuranceNumber?: string;
  dateOfJoining: string;
  isDaily: boolean;
  monthlySalary?: number | null;
  dailyRate?: number | null;
  isActive: boolean;
  createdDatetime: string;
}

export interface CreateEmployeeRequest {
  employeeCode: string;
  employeeName: string;
  contactNo?: string;
  email?: string;
  address?: string;
  postcode?: string;
  nationalInsuranceNumber?: string;
  dateOfJoining: string;
  isDaily: boolean;
  monthlySalary?: number | null;
  dailyRate?: number | null;
  isActive: boolean;
  createdBy?: string;
}

export interface UpdateEmployeeRequest {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  contactNo?: string;
  email?: string;
  address?: string;
  postcode?: string;
  nationalInsuranceNumber?: string;
  dateOfJoining: string;
  isDaily: boolean;
  monthlySalary?: number | null;
  dailyRate?: number | null;
  isActive: boolean;
  updatedBy?: string;
}

export interface PaginatedEmployeeResponse {
  data: Employee[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
