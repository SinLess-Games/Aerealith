import { TestLogger } from '@aerealith-ai/api-platform';
import {
  AuthorizationService,
  InMemoryAuthorizationRepository,
} from '@aerealith-ai/authorization';
import {
  UserRole,
  ProfileStatus,
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
} from '@aerealith-ai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthApplicationError,
  type AuthApplication,
  type AuthResult,
  type AdminEntityPage,
} from './auth/auth-application.service';
import { createAuthServiceApp } from './create-auth-service-app';

const user: AuthUser = {
  id: '0191ef35-d3c2-74d8-bb2c-253724e5bca8',
  username: 'ada',
  email: 'ada@example.com',
  emailVerified: false,
  role: UserRole.User,
  displayName: 'Ada',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const profile = {
  id: '0191ef35-d3c2-74d8-bb2c-253724e5bca9',
  userId: user.id,
  handle: 'ada',
  displayName: 'Ada',
  givenName: null,
  middleName: null,
  familyName: null,
  pronouns: null,
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  status: ProfileStatus.Active,
  fieldVisibility: {},
  locationLabel: null,
  country: null,
  gender: null,
  sex: null,
  sexuality: null,
  romanticOrientation: null,
  sexAttitude: null,
  languages: [],
  websiteUrl: null,
  links: [],
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
  readonly requestPasswordReset = vi.fn(async () => undefined);
  readonly completePasswordReset = vi.fn(async () => undefined);
  readonly listSessions = vi.fn(async () => []);
  readonly revokeSession = vi.fn(async () => true);
  readonly revokeOtherSessions = vi.fn(async () => 0);
  readonly adminOverview = vi.fn(async () => ({
    totalUsers: 42,
    verifiedUsers: 36,
    activeSessions: 12,
    newUsersLast7Days: 7,
    superAdmins: 1,
    generatedAt: '2026-07-28T00:00:00.000Z',
  }));
  readonly accountDetails = vi.fn(async () => ({
    user,
    avatarUrl: null,
    timezone: null,
    locale: null,
  }));
  readonly updateAccount = vi.fn(async () => ({
    user,
    avatarUrl: null,
    timezone: null,
    locale: null,
  }));
  readonly profileDetails = vi.fn(async () => profile);
  readonly updateProfile = vi.fn(async () => profile);
  readonly listAdminEntities = vi.fn(async (): Promise<AdminEntityPage> => ({
    entity: 'users',
    records: [],
    total: 0,
    page: 1,
    pageSize: 25,
  }));
  readonly adminEntityCatalog = vi.fn(async () => [
    {
      name: 'users',
      label: 'Users',
      singularLabel: 'User',
      columns: [],
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      name: 'waitlist_entries',
      label: 'Waitlist entries',
      singularLabel: 'Waitlist entry',
      columns: [],
      canCreate: true,
      canUpdate: false,
      canDelete: false,
    },
  ]);
  readonly createAdminEntity = vi.fn(
    async (_entity: string, input: Record<string, unknown>) => ({
      id: 'created-user',
      ...input,
    }),
  );
  readonly updateAdminEntity = vi.fn(async (_entity: string, id: string) => ({
    id,
  }));
  readonly deleteAdminEntity = vi.fn(async () => undefined);
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

  it('serves its status endpoint only at the canonical API version casing', async () => {
    const response = await app.request('/api/V1/services/auth');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'auth',
      status: 'ok',
    });
    expect(response.headers.get('x-request-id')).toBeTruthy();

    expect((await app.request('/api/v1/services/auth')).status).toBe(404);
  });

  it('registers a user over HTTP and issues the session cookie', async () => {
    const response = await app.request('/api/V1/auth/sign-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'ada',
        email: 'ada@example.com',
        password: 'SecurePassword1',
      }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain(
      'aerealith_session=signup-token',
    );
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax');
    expect(response.headers.get('set-cookie')).toContain('Path=/');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=2592000');
    expect(response.headers.get('set-cookie')).not.toContain('Secure');
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: user,
    });
  });

  it('uses Secure cookies on HTTPS and clears the same cookie scope on logout', async () => {
    const loginResponse = await app.request(
      'https://auth.aerealith.test/api/V1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: 'ada',
          password: 'SecurePassword1',
        }),
      },
    );
    expect(loginResponse.headers.get('set-cookie')).toContain('Secure');

    const logoutResponse = await app.request(
      'https://auth.aerealith.test/api/V1/auth/logout',
      {
        method: 'POST',
        headers: { cookie: 'aerealith_session=session-token' },
      },
    );
    const cleared = logoutResponse.headers.get('set-cookie');
    expect(cleared).toContain('aerealith_session=');
    expect(cleared).toContain('Max-Age=0');
    expect(cleared).toContain('HttpOnly');
    expect(cleared).toContain('SameSite=Lax');
    expect(cleared).toContain('Path=/');
    expect(cleared).toContain('Secure');
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

  it('reads and updates the authenticated account profile', async () => {
    const headers = {
      cookie: 'aerealith_session=session-token',
      'content-type': 'application/json',
    };
    const read = await app.request('/api/V1/account', { headers });
    expect(read.status).toBe(200);
    expect(application.accountDetails).toHaveBeenCalledWith(user.id);

    const update = await app.request('/api/V1/account', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        username: 'ada_lovelace',
        email: 'ada@example.com',
        timezone: 'UTC',
        locale: 'en-GB',
      }),
    });
    expect(update.status).toBe(200);
    expect(application.updateAccount).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        username: 'ada_lovelace',
        timezone: 'UTC',
        locale: 'en-GB',
      }),
    );
  });

  it('reads and updates every owner-facing profile field', async () => {
    const headers = {
      cookie: 'aerealith_session=session-token',
      'content-type': 'application/json',
    };
    expect((await app.request('/api/V1/profile', { headers })).status).toBe(
      200,
    );

    const update = await app.request('/api/V1/profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        handle: 'ada_lovelace',
        displayName: 'Ada Lovelace',
        bio: 'Mathematician',
        languages: [
          { language: 'eng', proficiency: 'native', isPrimary: true },
        ],
        links: [{ platform: 'website', url: 'https://example.com' }],
      }),
    });

    expect(update.status).toBe(200);
    expect(application.updateProfile).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        handle: 'ada_lovelace',
        displayName: 'Ada Lovelace',
      }),
    );
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

  it('clears the browser session after an authenticated email change', async () => {
    const response = await app.request('/api/V1/account', {
      method: 'PATCH',
      headers: {
        cookie: 'aerealith_session=session-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ada',
        email: 'new-address@example.com',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('aerealith_session=');
  });

  it('passes legacy-shaped credentials to authentication and preserves generic failures', async () => {
    application.login.mockRejectedValueOnce(
      new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'The supplied credentials are invalid.',
        401,
      ),
    );
    const response = await app.request('/api/V1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'ada', password: 'legacy08' }),
    });

    expect(response.status).toBe(401);
    expect(application.login).toHaveBeenCalledWith({
      usernameOrEmail: 'ada',
      password: 'legacy08',
    });
  });

  it('keeps alternate login transport validation equivalent to HTTP', async () => {
    const response = await app.request('/trpc/auth.login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: 'ada',
        password: 'SecurePassword1',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain(
      'aerealith_session=login-token',
    );
    expect(application.login).toHaveBeenCalledOnce();
  });

  it('does not expose signup through tRPC or GraphQL, where Worker signup controls cannot be bypassed', async () => {
    const trpcResponse = await app.request('/trpc/auth.signUp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'ada',
        email: 'ada@example.com',
        password: 'SecurePassword1',
      }),
    });
    expect(trpcResponse.status).toBe(404);

    const graphqlResponse = await app.request('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query:
          'mutation { signUp(input: { username: "ada", email: "ada@example.com", password: "SecurePassword1" }) { id } }',
      }),
    });
    const graphqlBody = (await graphqlResponse.json()) as {
      errors?: Array<{ message?: string }>;
    };
    expect(graphqlBody.errors?.[0]?.message).toContain('Cannot query field');
    expect(application.signUp).not.toHaveBeenCalled();
  });

  it('rejects unsafe cross-origin writes before invoking application behavior', async () => {
    const response = await app.request('/api/V1/auth/logout', {
      method: 'POST',
      headers: {
        cookie: 'aerealith_session=session-token',
        origin: 'https://attacker.example',
      },
    });

    expect(response.status).toBe(403);
    expect(application.logout).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed URL', 'not an origin'],
    ['origin with a path', 'https://console.aerealith.example/path'],
    ['opaque origin', 'null'],
    ['lookalike subdomain', 'https://console.aerealith.example.attacker.test'],
  ])('rejects a %s Origin header', async (_case, origin) => {
    const protectedApp = createAuthServiceApp({
      application,
      authorization: createAuthorizationService(),
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
      allowedOrigins: ['https://console.aerealith.example'],
    });
    const response = await protectedApp.request('/api/V1/auth/logout', {
      method: 'POST',
      headers: { origin },
    });

    expect(response.status).toBe(403);
    expect(application.logout).not.toHaveBeenCalled();
  });

  it('intentionally allows non-browser writes without Origin', async () => {
    const response = await app.request('/api/V1/auth/logout', {
      method: 'POST',
    });
    expect(response.status).toBe(200);
  });

  it('allows same-origin unsafe writes', async () => {
    const response = await app.request('http://localhost/api/V1/auth/logout', {
      method: 'POST',
      headers: {
        cookie: 'aerealith_session=session-token',
        origin: 'http://localhost',
      },
    });

    expect(response.status).toBe(200);
    expect(application.logout).toHaveBeenCalledWith('session-token');
  });

  it('allows explicitly configured trusted browser origins', async () => {
    const allowedApp = createAuthServiceApp({
      application,
      authorization: createAuthorizationService(),
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
      allowedOrigins: ['https://console.aerealith.example'],
    });
    const response = await allowedApp.request('/api/V1/auth/logout', {
      method: 'POST',
      headers: {
        cookie: 'aerealith_session=session-token',
        origin: 'https://console.aerealith.example',
      },
    });

    expect(response.status).toBe(200);
  });

  it('answers trusted credentialed CORS preflight without a wildcard', async () => {
    const allowedApp = createAuthServiceApp({
      application,
      authorization: createAuthorizationService(),
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
      allowedOrigins: ['http://localhost:4200'],
    });
    const response = await allowedApp.request('/api/V1/auth/login', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:4200',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:4200',
    );
    expect(response.headers.get('access-control-allow-credentials')).toBe(
      'true',
    );
    expect(response.headers.get('access-control-allow-origin')).not.toBe('*');
  });

  it('does not return credentialed CORS headers to an untrusted origin', async () => {
    const allowedApp = createAuthServiceApp({
      application,
      authorization: createAuthorizationService(),
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
      allowedOrigins: ['http://localhost:4200'],
    });
    const response = await allowedApp.request('/api/V1/auth/login', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://evil.example',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('validates GraphQL mutation inputs with the same Zod schemas', async () => {
    const response = await app.request('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query:
          'mutation { login(input: { usernameOrEmail: "ada", password: "" }) { id } }',
      }),
    });

    const body = (await response.json()) as {
      errors?: Array<{ message?: string }>;
    };
    expect(body.errors).toHaveLength(1);
    expect(application.login).not.toHaveBeenCalled();
  });

  it('rejects unknown and malformed admin changes', async () => {
    const response = await app.request('/api/V1/admin/entities/users/user-1', {
      method: 'PATCH',
      headers: {
        cookie: 'aerealith_session=session-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ role: 'not-a-role', arbitrary: true }),
    });

    expect(response.status).toBe(422);
    expect(application.updateAdminEntity).not.toHaveBeenCalled();
  });

  it('serves the current user through GraphQL', async () => {
    const response = await app.request('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'aerealith_session=session-token',
      },
      body: JSON.stringify({
        query: '{ me { id username email role } }',
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        me: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
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

  it('serves the protected admin overview', async () => {
    const response = await app.request('/api/V1/admin/overview', {
      headers: { cookie: 'aerealith_session=session-token' },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        totalUsers: 42,
        activeSessions: 12,
        superAdmins: 1,
      },
    });
  });

  it('does not treat the users.role compatibility projection as authorization', async () => {
    application.currentUser.mockResolvedValueOnce({
      ...user,
      role: UserRole.SuperAdmin,
    });
    const deniedAuthorization = {
      can: vi.fn(async () => ({ allowed: false })),
    } as unknown as AuthorizationService;
    const deniedApp = createAuthServiceApp({
      application,
      authorization: deniedAuthorization,
      logger: new TestLogger(),
      environment: 'test',
      enableGraphiql: false,
    });

    const response = await deniedApp.request('/api/V1/admin/overview', {
      headers: { cookie: 'aerealith_session=session-token' },
    });

    expect(response.status).toBe(403);
    expect(application.adminOverview).not.toHaveBeenCalled();
  });

  it('does not expose administrator operations through alternate transports', async () => {
    const trpcResponse = await app.request('/trpc/admin.overview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(trpcResponse.status).toBe(404);

    const graphqlResponse = await app.request('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ adminOverview { totalUsers } }' }),
    });
    const graphqlBody = (await graphqlResponse.json()) as {
      errors?: Array<{ message?: string }>;
    };
    expect(graphqlBody.errors?.[0]?.message).toContain('Cannot query field');
    expect(application.adminOverview).not.toHaveBeenCalled();
  });

  it('lists protected database entities without exposing persistence secrets', async () => {
    application.listAdminEntities.mockResolvedValueOnce({
      entity: 'users',
      records: [{ id: user.id, username: user.username, email: user.email }],
      total: 1,
      page: 1,
      pageSize: 25,
    });
    const response = await app.request(
      '/api/V1/admin/entities/users?search=ada&page=1',
      { headers: { cookie: 'aerealith_session=session-token' } },
    );
    expect(response.status).toBe(200);
    expect(application.listAdminEntities).toHaveBeenCalledWith(
      'users',
      'ada',
      1,
      25,
    );
    await expect(response.json()).resolves.toMatchObject({
      data: { total: 1, records: [{ username: 'ada' }] },
    });
  });

  it('serves the complete database entity catalog', async () => {
    const response = await app.request('/api/V1/admin/entities', {
      headers: { cookie: 'aerealith_session=session-token' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        { name: 'users', canCreate: true },
        { name: 'waitlist_entries', canCreate: true },
      ],
    });
  });

  it('creates a validated user entity with explicit administrator permission', async () => {
    const response = await app.request('/api/V1/admin/entities/users', {
      method: 'POST',
      headers: {
        cookie: 'aerealith_session=session-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username: 'grace_hopper',
        email: 'grace@example.com',
        password: 'SecurePassword1',
        displayName: 'Grace Hopper',
        emailVerified: false,
      }),
    });

    expect(response.status).toBe(201);
    expect(application.createAdminEntity).toHaveBeenCalledWith(
      'users',
      expect.objectContaining({
        username: 'grace_hopper',
        email: 'grace@example.com',
        displayName: 'Grace Hopper',
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      data: { id: 'created-user', username: 'grace_hopper' },
    });
  });

  it('creates a non-user database entity with system management permission', async () => {
    const response = await app.request(
      '/api/V1/admin/entities/waitlist_entries',
      {
        method: 'POST',
        headers: {
          cookie: 'aerealith_session=session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'waitlist@example.com' }),
      },
    );

    expect(response.status).toBe(201);
    expect(application.createAdminEntity).toHaveBeenCalledWith(
      'waitlist_entries',
      { email: 'waitlist@example.com' },
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
  repository.permissions.set('account.update', {
    id: 'permission-account-update',
    key: 'account.update',
    resource: 'account',
    action: 'update',
    displayName: 'Update account',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.permissions.set('platform.user.read', {
    id: 'permission-platform-user-read',
    key: 'platform.user.read',
    resource: 'users',
    action: 'read',
    displayName: 'Read users',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.permissions.set('platform.user.update', {
    id: 'permission-platform-user-update',
    key: 'platform.user.update',
    resource: 'users',
    action: 'update',
    displayName: 'Update users',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.permissions.set('platform.user.create', {
    id: 'permission-platform-user-create',
    key: 'platform.user.create',
    resource: 'users',
    action: 'create',
    displayName: 'Create users',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.permissions.set('platform.system.read', {
    id: 'permission-platform-system-read',
    key: 'platform.system.read',
    resource: 'system',
    action: 'read',
    displayName: 'Read system entities',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  });
  repository.permissions.set('platform.system.manage', {
    id: 'permission-platform-system-manage',
    key: 'platform.system.manage',
    resource: 'system',
    action: 'manage',
    displayName: 'Manage system entities',
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
      'role-user': [
        repository.permissions.get('account.read')!,
        repository.permissions.get('account.update')!,
        repository.permissions.get('platform.user.read')!,
        repository.permissions.get('platform.user.create')!,
        repository.permissions.get('platform.user.update')!,
        repository.permissions.get('platform.system.read')!,
        repository.permissions.get('platform.system.manage')!,
      ],
    },
    parentRoleIdsByRole: {},
  });
  return new AuthorizationService({ repository });
}
