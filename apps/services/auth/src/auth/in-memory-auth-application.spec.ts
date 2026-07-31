import { describe, expect, it } from 'vitest';

import { InMemoryAuthApplication } from './in-memory-auth-application';

describe('InMemoryAuthApplication', () => {
  it('creates an already-verified development account and session', async () => {
    const application = new InMemoryAuthApplication();
    const result = await application.signUp({
      username: 'local_user',
      email: 'local@example.com',
      password: 'development-password',
      displayName: 'Local User',
    });

    expect(result.user).toMatchObject({
      username: 'local_user',
      email: 'local@example.com',
      emailVerified: true,
      displayName: 'Local User',
    });
    await expect(application.currentUser(result.sessionToken)).resolves.toEqual(
      result.user,
    );
  });

  it('logs into a development account and can revoke its session', async () => {
    const application = new InMemoryAuthApplication();
    await application.signUp({
      username: 'local_user',
      email: 'local@example.com',
      password: 'development-password',
    });

    const result = await application.login({
      usernameOrEmail: 'local@example.com',
      password: 'development-password',
    });
    await application.logout(result.sessionToken);

    await expect(
      application.currentUser(result.sessionToken),
    ).resolves.toBeNull();
  });
});
