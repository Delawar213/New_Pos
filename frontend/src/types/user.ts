// ============================================
// User API (`/api/User/*`)
// ============================================

import type { ApiResponse } from "./common";
import type { CompanyInfoApi } from "./company";

/** Row from `GET /api/User` paginated list. */
export interface UserListRow {
  userId: number;
  name: string;
  userName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdDateTime: string;
  profileImageUrl?: string | null;
}

/** Nested `data` on successful `GET /api/User`. */
export interface UserPagedPayload {
  data: UserListRow[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type UserListApiResponse = ApiResponse<UserPagedPayload>;

/** Payload inside `data` on successful `POST /api/User/login`. */
export interface LoginUserData {
  userId: number;
  name: string;
  userName: string;
  roleId: number;
  roleName: string;
  profileImageUrl?: string | null;
  token: string;
  companyInfo?: CompanyInfoApi | null;
}

export type LoginApiResponse = ApiResponse<LoginUserData>;

/** `data` on successful `POST /api/User` (create). */
export interface UserCreatedData {
  userId: number;
  name: string;
  userName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdDateTime: string;
  profileImageUrl?: string | null;
}

/** `POST /api/User` create body (extend if your API requires more fields). */
export interface CreateUserRequest {
  name: string;
  userName: string;
  roleId: number;
  password?: string;
  isActive?: boolean;
  createdBy?: number;
}

/** `POST /api/User/update/{id}` body. */
export interface UpdateUserRequest {
  userId: number;
  name: string;
  userName: string;
  roleId: number;
  isActive: boolean;
  profileImageUrl?: string | null;
  updatedBy: number;
}

/** `POST /api/User/change-password` body. */
export interface ChangePasswordRequest {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
