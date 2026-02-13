// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
  expiresAt: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  branchId?: number;
  branchName?: string;
  avatar?: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}
