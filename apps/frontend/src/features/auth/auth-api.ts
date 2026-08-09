// apps/frontend/src/features/auth/auth-api.ts

import { AuthRoute, type AuthUser } from '@aerealith-ai/core';

import { apiFetch } from '../../lib/api-client';

export type SignUpInput = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  turnstileToken?: string;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};

export type PasswordResetRequestInput = {
  email: string;
};

export type PasswordResetCompleteInput = {
  token: string;
  newPassword: string;
};

/** A session summary deliberately excludes session credentials and token data. */
export type AuthSessionSummary = {
  id: string;
  current: boolean;
  deviceName: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  createdAt?: string;
  lastActiveAt?: string;
  expiresAt?: string;
};

export type AuthSessionsResponse = {
  sessions: AuthSessionSummary[];
};

/** Registers a new account and starts a session. */
export function signUp(input: SignUpInput): Promise<AuthUser> {
  return apiFetch<AuthUser>(`${AuthRoute}/sign-up`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Authenticates with credentials and starts a session. */
export function login(input: LoginInput): Promise<AuthUser> {
  return apiFetch<AuthUser>(`${AuthRoute}/login`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Ends the current session (server-side revocation + cookie clear). */
export function logout(): Promise<null> {
  return apiFetch<null>(`${AuthRoute}/logout`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Returns the currently authenticated user, or throws if not signed in. */
export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>(`${AuthRoute}/me`);
}

export function verifyEmail(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>(`${AuthRoute}/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string): Promise<null> {
  return apiFetch<null>(`${AuthRoute}/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Always resolves to the same generic response to protect account privacy. */
export function requestPasswordReset(
  input: PasswordResetRequestInput,
): Promise<null> {
  return apiFetch<null>(`${AuthRoute}/password-reset/request`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Completes a password reset using a single-use recovery token. */
export function completePasswordReset(
  input: PasswordResetCompleteInput,
): Promise<null> {
  return apiFetch<null>(`${AuthRoute}/password-reset/complete`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchSessions(): Promise<AuthSessionsResponse> {
  return apiFetch<AuthSessionsResponse>(`${AuthRoute}/sessions`);
}

export function revokeSession(sessionId: string): Promise<null> {
  return apiFetch<null>(
    `${AuthRoute}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: 'DELETE',
    },
  );
}

/** Revokes every active session except the session making this request. */
export function revokeOtherSessions(): Promise<null> {
  return apiFetch<null>(`${AuthRoute}/sessions`, {
    method: 'DELETE',
  });
}
