// apps/frontend/src/features/auth/auth-api.spec.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completePasswordReset,
  fetchCurrentUser,
  fetchSessions,
  login,
  logout,
  requestPasswordReset,
  resendVerification,
  revokeOtherSessions,
  revokeSession,
  signUp,
  verifyEmail,
} from './auth-api';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    json: () =>
      Promise.resolve({ ok: true, data: { id: 'u1', username: 'ada' } }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('auth-api', () => {
  it('signUp posts the registration payload to /api/V1/auth/sign-up', async () => {
    await signUp({
      username: 'ada',
      email: 'ada@example.com',
      password: 'password123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/sign-up',
      expect.objectContaining({ method: 'POST' }),
    );
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent).toMatchObject({ username: 'ada', email: 'ada@example.com' });
  });

  it('login posts to /api/V1/auth/login', async () => {
    await login({ usernameOrEmail: 'ada', password: 'password123' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('logout posts to /api/V1/auth/logout', async () => {
    await logout();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fetchCurrentUser gets /api/V1/auth/me with credentials', async () => {
    await fetchCurrentUser();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('posts verification and resend requests', async () => {
    await verifyEmail('verification-token-that-is-long-enough');
    await resendVerification('ada@example.com');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/V1/auth/verify-email',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/auth/resend-verification',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses the password reset request and completion contracts', async () => {
    await requestPasswordReset({ email: 'ada@example.com' });
    await completePasswordReset({
      token: 'single-use-token',
      newPassword: 'AsecurePassword1',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/V1/auth/password-reset/request',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      email: 'ada@example.com',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/auth/password-reset/complete',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lists and revokes sessions through the authenticated session routes', async () => {
    await fetchSessions();
    await revokeSession('session id');
    await revokeOtherSessions();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/V1/auth/sessions',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/auth/sessions/session%20id',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/V1/auth/sessions',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
