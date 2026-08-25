import { CryptoTokenGenerator } from './crypto-token-generator';
import { InMemoryAuthApplication } from './in-memory-auth-application';
import { afterEach, describe, expect, it, vi } from 'vitest';

const password = 'SecurePassword1';
const replacementPassword = 'ReplacementPassword1';

function tokens(...values: string[]) {
  const generate = vi.spyOn(CryptoTokenGenerator.prototype, 'generate');
  generate.mockImplementation(async () => {
    const token = values.shift();
    if (!token) throw new Error('Test token sequence exhausted.');
    return { token, digest: `digest:${token}` };
  });
  vi.spyOn(CryptoTokenGenerator.prototype, 'digest').mockImplementation(
    async (token) => `digest:${token}`,
  );
}

async function registeredApplication(now: () => Date) {
  const application = new InMemoryAuthApplication(now);
  const result = await application.signUp({
    username: 'ada',
    email: 'ada@example.com',
    password,
  });
  return { application, sessionToken: result.sessionToken };
}

describe('InMemoryAuthApplication reset and session security', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects invalid and reused reset tokens, changes the password once, and revokes existing sessions', async () => {
    tokens('initial-session', 'reset-token', 'replacement-session');
    const { application, sessionToken } = await registeredApplication(
      () => new Date('2026-01-01T00:00:00.000Z'),
    );
    await application.requestPasswordReset('ada@example.com');

    await application.completePasswordReset('reset-token', replacementPassword);

    await expect(
      application.completePasswordReset('reset-token', replacementPassword),
    ).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
      status: 400,
    });
    await expect(
      application.completePasswordReset('unknown-token', replacementPassword),
    ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
    await expect(
      application.login({ usernameOrEmail: 'ada@example.com', password }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(
      application.login({
        usernameOrEmail: 'ada@example.com',
        password: replacementPassword,
      }),
    ).resolves.toMatchObject({ sessionToken: 'replacement-session' });
    await expect(application.currentUser(sessionToken)).resolves.toBeNull();
  });

  it('rejects reset tokens at their exact expiry boundary', async () => {
    tokens('initial-session', 'reset-token');
    let now = new Date('2026-01-01T00:00:00.000Z');
    const { application } = await registeredApplication(() => now);
    await application.requestPasswordReset('ada@example.com');
    now = new Date('2026-01-01T01:00:00.000Z');

    await expect(
      application.completePasswordReset('reset-token', replacementPassword),
    ).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
      status: 400,
    });
  });

  it('rejects an expired and a revoked session as an authenticated identity', async () => {
    tokens('session-token');
    let now = new Date('2026-01-01T00:00:00.000Z');
    const { application, sessionToken } = await registeredApplication(
      () => now,
    );

    await application.logout(sessionToken);
    await expect(application.currentUser(sessionToken)).resolves.toBeNull();

    tokens('expiring-session');
    const { application: expiringApplication, sessionToken: expiringToken } =
      await registeredApplication(() => now);
    now = new Date('2026-01-31T00:00:00.000Z');
    await expect(
      expiringApplication.currentUser(expiringToken),
    ).resolves.toBeNull();
  });
});
