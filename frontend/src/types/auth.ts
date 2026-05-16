// ============================================
// Auth Types — `/api/User/login`
// ============================================

/** Normalized user stored in Redux after login. */
export interface AuthUser {
  id: number;
  userId: number;
  userName: string;
  name: string;
  roleId: number;
  roleName: string;
  profileImageUrl?: string | null;
}

/** Request body for `POST /api/User/login`. */
export interface UserLoginRequest {
  userName: string;
  password: string;
}
