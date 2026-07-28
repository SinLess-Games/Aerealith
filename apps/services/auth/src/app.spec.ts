import { TestLogger } from '@aerealith-ai/api-platform';
import {
  AuthorizationService,
  InMemoryAuthorizationRepository,
} from '@aerealith-ai/authorization';
import type { AuthUser, LoginRequest, SignUpRequest } from '@aerealith-ai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type AuthApplication,
  type AuthResult,
} from './auth/auth-application.service';
import { createAuthServiceApp } from './create-auth-service-app';

const user: AuthUser = {
  id: '0191ef35-d3c2-74d8-bb2c-253724e5bca8',
  username: 'ada',
  email: 'ada@example.com',
  emailVerified: false,
  displayName: 'Ada',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

class FakeAuthApplication implements AuthApplication {
  readonly signUp = vi.fn(async (input: SignUpRequest): Promise<AuthResult> => {
    void input;
    return {
      user,
      sessionToken: 'signup-token',
    };
  });
  readonly login = vi.fn(async (input: LoginRequest): Promise<AuthResult> => {
    void input;
    return {
      user,
      sessionToken: 'login-token',
    };
  });
  readonly currentUser = vi.fn(async (token: string | undefined) =>
    token ? user : null,
  );
  readonly logout = vi.fn(async (token: string | undefined) => {
    void token;
  });
  readonly verifyEmail = vi.fn(async (token: string) => {
    void token;
    return { ...user, emailVerified: true };
  });
  readonly resendVerification = vi.fn(async (email: string) => {
    void email;
  });
}

describe('auth service', () => {
  let application: FakeAuthApplication;
  let app: ReturnType<typeof createAuthServiceApp>;

  beforeEach(() => {
    application = new FakeAuthApplication();
    app = createAuthServiceApp({
      application,
      authorization: createAuthorizationService(),
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
    });
  });

  it('preserves its service status endpoint', async () => {
    const response = await app.request('/api/v1/services/auth');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'auth',
      status: 'ok',
    });
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('registers a user over HTTP and issues the session cookie', async () => {
    const response = await app.request('/api/V1/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'ada',
        email: 'ada@example.com',
        password: 'correct-horse-battery-staple',
      }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain(
      'aerealith_session=signup-token',
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: user,
    });
  });

  it('exposes the current user through both auth and user HTTP routes', async () => {
    for (const path of ['/api/V1/auth/me', '/api/V1/users/me']) {
      const response = await app.request(path, {
        headers: { cookie: 'aerealith_session=session-token' },
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        data: user,
      });
    }
  });

  it('rejects an invalid HTTP payload without calling the application', async () => {
    const response = await app.request('/api/V1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: '', password: 'short' }),
    });
    expect(response.status).toBe(422);
    expect(application.login).not.toHaveBeenCalled();
  });

  it('serves the same login operation through tRPC', async () => {
    const response = await app.request('/trpc/auth.login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: 'ada',
        password: 'correct-horse-battery-staple',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain(
      'aerealith_session=login-token',
    );
    expect(application.login).toHaveBeenCalledOnce();
  });

  it('serves the current user through GraphQL', async () => {
    const response = await app.request('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'aerealith_session=session-token',
      },
      body: JSON.stringify({
        query: '{ me { id username email } }',
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        me: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  });

  it('verifies an email over HTTP', async () => {
    const response = await app.request('/api/V1/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'a'.repeat(32) }),
    });
    expect(response.status).toBe(200);
    expect(application.verifyEmail).toHaveBeenCalledWith('a'.repeat(32));
    await expect(response.json()).resolves.toMatchObject({
      data: { emailVerified: true },
    });
  });

  it('resends verification without exposing account state', async () => {
    const response = await app.request('/api/V1/auth/resend-verification', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com' }),
    });
    expect(response.status).toBe(200);
    expect(application.resendVerification).toHaveBeenCalledWith(
      'ada@example.com',
    );
  });
});

function createAuthorizationService(): AuthorizationService {
  const repository = new InMemoryAuthorizationRepository();
  const date = new Date(0);
  repository.permissions.set('account.read', {
    id: 'permission-account-read',
    key: 'account.read',
    resource: 'account',
    action: 'read',
    displayName: 'Read account',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.authorizations.set(user.id, {
    principal: { id: user.id, type: 'user' },
    version: 1,
    assignments: [
      {
        id: 'assignment-user',
        principal: { id: user.id, type: 'user' },
        roleId: 'role-user',
        scope: { type: 'global' },
        assignedBy: 'test',
        assignedAt: date,
        metadata: {},
      },
    ],
    roles: [
      {
        id: 'role-user',
        key: 'user',
        displayName: 'User',
        system: true,
        assignable: true,
        administrativeRank: 0,
        enabled: true,
        createdAt: date,
        updatedAt: date,
      },
    ],
    permissionsByRole: {
      'role-user': [repository.permissions.get('account.read')!],
    },
    parentRoleIdsByRole: {},
  });
  return new AuthorizationService({ repository });
}
