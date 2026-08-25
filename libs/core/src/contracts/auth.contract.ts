// /mnt/disk-sdc/Projects/Aerealith/libs/core/src/contracts/auth.contract.ts

import type { ApiResponse } from './api.contract';
import type { UserRole } from '../enumns';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardOverview = {
  totalUsers: number;
  verifiedUsers: number;
  activeSessions: number;
  newUsersLast7Days: number;
  superAdmins: number;
  generatedAt: string;
};

export type AccountDetails = {
  user: AuthUser;
  avatarUrl: string | null;
  timezone: string | null;
  locale: string | null;
};

export type UpdateAccountRequest = {
  username: string;
  email: string;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
};

export type PublicAuthUser = {
  id: string;
  username: string;
  displayName?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type SignUpRequest = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
};

export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken?: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ResendVerificationRequest = {
  email: string;
};

export type AuthSessionResponse = ApiResponse<AuthSession>;

export type AuthUserResponse = ApiResponse<AuthUser>;

export type PublicAuthUserResponse = ApiResponse<PublicAuthUser>;

export type RefreshResponse = ApiResponse<AuthTokens>;

export type LogoutResponse = ApiResponse<null>;

export type VerifyEmailResponse = ApiResponse<{
  emailVerified: true;
}>;

export type ResendVerificationResponse = ApiResponse<{
  sent: true;
}>;
