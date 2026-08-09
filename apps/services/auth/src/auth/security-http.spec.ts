import { LocalAuthorizationService } from './local-authorization.service';
import { InMemoryAuthApplication } from './in-memory-auth-application';
import { createAuthServiceApp } from '../create-auth-service-app';
import { TestLogger } from '@aerealith-ai/api-platform';
import type { AuthorizationService } from '@aerealith-ai/authorization';
import { describe, expect, it, vi } from 'vitest';

const basePath = '/api/V1';

function createApp(
  application = new InMemoryAuthApplication(),
  authorization: AuthorizationService = new LocalAuthorizationService(),
) {
  return createAuthServiceApp({
    application,
    authorization,
    logger: new TestLogger(),
    environment: 'test',
    enableGraphiql: false,
  });
}

async function signUp(
  app: ReturnType<typeof createApp>,
  username: string,
  email: string,
) {
  const response = await app.request(`${basePath}/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, email, password: 'SecurePassword1' }),
  });
  expect(response.status).toBe(201);
  return response.headers
    .get('set-cookie')!
    .match(/aerealith_session=([^;]+)/)![1];
}

describe('auth security HTTP boundaries', () => {
  it('keeps password-reset requests generic for known and unknown addresses', async () => {
    const app = createApp();
    await signUp(app, 'ada', 'ada@example.com');

    const requestReset = (email: string) =>
      app.request(`${basePath}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

    const [known, unknown] = await Promise.all([
      requestReset('ada@example.com'),
      requestReset('nobody@example.com'),
    ]);

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    await expect(known.json()).resolves.toMatchObject({ ok: true, data: null });
    await expect(unknown.json()).resolves.toMatchObject({
      ok: true,
      data: null,
    });
  });

  it('rejects malformed reset requests before reaching the application', async () => {
    const application = new InMemoryAuthApplication();
    const requestPasswordReset = vi.spyOn(application, 'requestPasswordReset');
    const app = createApp(application);

    const response = await app.request(
      `${basePath}/auth/password-reset/request`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      },
    );

    expect(response.status).toBe(422);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('requires an authenticated and authorized session to enumerate sessions', async () => {
    const application = new InMemoryAuthApplication();
    const app = createApp(application);
    const token = await signUp(app, 'ada', 'ada@example.com');

    expect((await app.request(`${basePath}/auth/sessions`)).status).toBe(401);

    const deniedAuthorization = {
      can: vi.fn(async () => ({ allowed: false })),
    } as unknown as AuthorizationService;
    const deniedApp = createApp(application, deniedAuthorization);
    const denied = await deniedApp.request(`${basePath}/auth/sessions`, {
      headers: { cookie: `aerealith_session=${token}` },
    });
    expect(denied.status).toBe(403);
  });

  it('does not allow account.read to substitute for account.update', async () => {
    const application = new InMemoryAuthApplication();
    const app = createApp(application);
    const token = await signUp(app, 'ada', 'ada@example.com');
    const can = vi.fn(async () => ({ allowed: false }));
    const deniedApp = createApp(application, {
      can,
    } as unknown as AuthorizationService);

    const response = await deniedApp.request(`${basePath}/account`, {
      method: 'PATCH',
      headers: {
        cookie: `aerealith_session=${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ username: 'ada_lovelace' }),
    });

    expect(response.status).toBe(403);
    expect(can).toHaveBeenCalledWith(
      expect.objectContaining({ permission: 'account.update' }),
    );
  });

  it('returns not found for another user session and only revokes owned sessions', async () => {
    const application = new InMemoryAuthApplication();
    const app = createApp(application);
    const adaToken = await signUp(app, 'ada', 'ada@example.com');
    const graceToken = await signUp(app, 'grace', 'grace@example.com');

    const graceSessions = await application.listSessions(graceToken);
    const foreign = await app.request(
      `${basePath}/auth/sessions/${graceSessions[0]!.id}`,
      {
        method: 'DELETE',
        headers: { cookie: `aerealith_session=${adaToken}` },
      },
    );
    expect(foreign.status).toBe(404);

    const adaSessions = await application.listSessions(adaToken);
    const owned = await app.request(
      `${basePath}/auth/sessions/${adaSessions[0]!.id}`,
      {
        method: 'DELETE',
        headers: { cookie: `aerealith_session=${adaToken}` },
      },
    );
    expect(owned.status).toBe(200);
    expect(await application.currentUser(adaToken)).toBeNull();
  });

  it('revokes other sessions while preserving the current session', async () => {
    const application = new InMemoryAuthApplication();
    const app = createApp(application);
    const firstToken = await signUp(app, 'ada', 'ada@example.com');
    const currentToken = await application.login({
      usernameOrEmail: 'ada@example.com',
      password: 'SecurePassword1',
    });

    const response = await app.request(`${basePath}/auth/sessions`, {
      method: 'DELETE',
      headers: { cookie: `aerealith_session=${currentToken.sessionToken}` },
    });

    expect(response.status).toBe(200);
    expect(
      await application.currentUser(currentToken.sessionToken),
    ).not.toBeNull();
    expect(await application.currentUser(firstToken)).toBeNull();
  });
});
