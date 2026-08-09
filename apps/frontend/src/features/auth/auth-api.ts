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
