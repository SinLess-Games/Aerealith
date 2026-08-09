import { UserRole } from '@aerealith-ai/core';
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
      role: UserRole.User,
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

  it('clears verification and revokes existing sessions when a local email changes', async () => {
    const application = new InMemoryAuthApplication();
    const created = await application.signUp({
      username: 'local_user',
      email: 'local@example.com',
      password: 'development-password',
    });

    await expect(
      application.accountDetails(created.user.id),
    ).resolves.toMatchObject({
      user: created.user,
      avatarUrl: null,
      timezone: null,
      locale: null,
    });

    const updated = await application.updateAccount(created.user.id, {
      username: 'updated_user',
      email: 'updated@example.com',
      timezone: 'America/Denver',
      locale: 'en-US',
    });
    expect(updated).toMatchObject({
      user: {
        id: created.user.id,
        username: 'updated_user',
        email: 'updated@example.com',
        emailVerified: false,
      },
      timezone: 'America/Denver',
      locale: 'en-US',
    });
    await expect(
      application.currentUser(created.sessionToken),
    ).resolves.toBeNull();
    await expect(
      application.currentUser(
        (
          await application.login({
            usernameOrEmail: 'updated@example.com',
            password: 'development-password',
          })
        ).sessionToken,
      ),
    ).resolves.toMatchObject({ id: created.user.id });
  });

  it('provides admin-safe local entity records without session tokens', async () => {
    const application = new InMemoryAuthApplication();
    await application.signUp({
      username: 'local_user',
      email: 'local@example.com',
      password: 'development-password',
    });

    const overview = await application.adminOverview();
    const users = await application.listAdminEntities('users', 'local', 1, 25);
    const sessions = await application.listAdminEntities('sessions', '', 1, 25);

    expect(overview).toMatchObject({
      totalUsers: 1,
      verifiedUsers: 1,
      activeSessions: 1,
    });
    expect(users.records).toHaveLength(1);
    expect(sessions.records).toHaveLength(1);
    expect(sessions.records[0]).not.toHaveProperty('token');
  });
});
