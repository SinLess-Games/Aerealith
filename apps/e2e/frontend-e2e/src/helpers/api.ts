import type { APIRequestContext, APIResponse } from '@playwright/test';

export const AuthPaths = {
  login: '/api/V1/auth/login',
  logout: '/api/V1/auth/logout',
  me: '/api/V1/auth/me',
  sessions: '/api/V1/auth/sessions',
  signUp: '/api/V1/auth/sign-up',
} as const;

export type AuthUserResponse = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
};

export type SessionSummary = {
  id: string;
  current: boolean;
  status: 'active' | 'expired' | 'revoked';
};

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export async function readSuccess<T>(
  response: APIResponse,
  expectedStatus: number,
): Promise<T> {
  if (response.status() !== expectedStatus) {
    throw new Error(
      `Expected HTTP ${expectedStatus}, received ${response.status()}.`,
    );
  }
  const body = (await response.json()) as ApiEnvelope<T>;
  if (body.ok === false)
    throw new Error(`Request failed with ${body.error.code}.`);
  return body.data;
}

export async function readErrorCode(response: APIResponse): Promise<string> {
  const body = (await response.json()) as ApiEnvelope<unknown>;
  return body.ok === false ? body.error.code : 'UNEXPECTED_SUCCESS';
}

export async function httpMe(request: APIRequestContext) {
  return request.get(AuthPaths.me);
}

export async function graphql(
  request: APIRequestContext,
  query: string,
  variables?: Record<string, unknown>,
) {
  return request.post('/graphql', { data: { query, variables } });
}

export async function trpcQuery(request: APIRequestContext, procedure: string) {
  return request.get(`/trpc/${procedure}`);
}

export async function trpcMutation(
  request: APIRequestContext,
  procedure: string,
  input: Record<string, unknown>,
) {
  return request.post(`/trpc/${procedure}`, { data: input });
}
