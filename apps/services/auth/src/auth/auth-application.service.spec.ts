import { ProfileStatus, UserRole } from '@aerealith-ai/core';
import type { DatabaseClient } from '@aerealith-ai/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthApplicationError,
  AuthApplicationService,
} from './auth-application.service';

const now = new Date('2026-08-20T12:00:00.000Z');
const user = {
  id: 'user-1',
  username: 'ada',
  email: 'ada@example.com',
  emailVerified: false,
  role: UserRole.User,
  status: 'active',
  tier: 'free',
  displayName: 'Ada',
  passwordHash: 'password-hash',
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const authUser = {
  id: user.id,
  username: user.username,
  email: user.email,
  emailVerified: user.emailVerified,
  role: user.role,
  displayName: user.displayName,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
const profile = {
  id: 'profile-1',
  userId: user.id,
  handle: user.username,
  displayName: user.displayName,
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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

function createHarness() {
  const database = {
    transaction: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  };
  const emailSender = { send: vi.fn() };
  const passwordResetSender = { send: vi.fn() };
  const events = { publish: vi.fn() };
  const application = new AuthApplicationService(
    database as unknown as DatabaseClient,
    {
      emailSender,
      passwordResetSender,
      events,
      frontendUrl: 'https://aerealith.test',
      now: () => now,
    },
  );
  const users = {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    findEntityByEmail: vi.fn(),
    findAuthenticationEligibleById: vi.fn(),
    markEmailVerified: vi.fn(),
    create: vi.fn(),
  };
  const sessions = {
    create: vi.fn(),
    findUserIdByToken: vi.fn(),
    findByToken: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
    listHistoryForUser: vi.fn(),
    listForUser: vi.fn(),
  };
  const verification = {
    findActiveByHash: vi.fn(),
    consume: vi.fn(),
    consumeAllForUser: vi.fn(),
    create: vi.fn(),
  };
  const passwordReset = {
    consumeAllForUser: vi.fn(),
    create: vi.fn(),
  };
  const profiles = {
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const passwords = { hash: vi.fn(), verify: vi.fn() };
  const passwordAuthentication = { authenticate: vi.fn() };

  Object.assign(application as unknown as Record<string, unknown>, {
    users,
    sessions,
    verification,
    passwordReset,
    profiles,
    passwords,
    passwordAuthentication,
  });

  return {
    application,
    database,
    emailSender,
    passwordResetSender,
    events,
    users,
    sessions,
    verification,
    passwordReset,
    profiles,
    passwords,
    passwordAuthentication,
  };
}

describe('AuthApplicationService', () => {
  let harness: ReturnType<typeof createHarness>;

  beforeEach(() => {
    harness = createHarness();
  });

  it('registers an account and translates database identity conflicts', async () => {
    harness.users.findByEmail.mockResolvedValue(null);
    harness.users.findByUsername.mockResolvedValue(null);
    harness.passwords.hash.mockResolvedValue('hashed-password');
    harness.database.transaction.mockResolvedValue(user);
    harness.sessions.create.mockResolvedValue({ token: 'session-token' });

    await expect(
      harness.application.signUp({
        username: user.username,
        email: user.email,
        password: 'SecurePassword1',
        displayName: user.displayName,
      }),
    ).resolves.toEqual({ user: authUser, sessionToken: 'session-token' });
    expect(harness.verification.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
    );
    expect(harness.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        email: user.email,
        displayName: user.displayName,
        expiresInHours: 24,
      }),
    );

    harness.users.findByEmail.mockResolvedValue(user);
    await expect(
      harness.application.signUp({
        username: user.username,
        email: user.email,
        password: 'SecurePassword1',
      }),
    ).rejects.toMatchObject({ code: 'REGISTRATION_CONFLICT', status: 409 });

    harness.users.findByEmail.mockResolvedValue(null);
    harness.database.transaction.mockRejectedValue({ code: '23505' });
    await expect(
      harness.application.signUp({
        username: user.username,
        email: user.email,
        password: 'SecurePassword1',
      }),
    ).rejects.toMatchObject({ code: 'REGISTRATION_CONFLICT' });

    const persistenceFailure = new Error('database unavailable');
    harness.database.transaction.mockRejectedValue(persistenceFailure);
    await expect(
      harness.application.signUp({
        username: user.username,
        email: user.email,
        password: 'SecurePassword1',
      }),
    ).rejects.toBe(persistenceFailure);
  });

  it('authenticates users and handles absent, valid, and revoked sessions', async () => {
    harness.passwordAuthentication.authenticate.mockResolvedValue({ user });
    harness.sessions.create.mockResolvedValue({ token: 'login-token' });
    await expect(
      harness.application.login({
        usernameOrEmail: user.email,
        password: 'SecurePassword1',
      }),
    ).resolves.toEqual({ user: authUser, sessionToken: 'login-token' });

    await expect(
      harness.application.currentUser(undefined),
    ).resolves.toBeNull();
    harness.sessions.findUserIdByToken.mockResolvedValueOnce(null);
    await expect(
      harness.application.currentUser('missing'),
    ).resolves.toBeNull();
    harness.sessions.findUserIdByToken.mockResolvedValueOnce(user.id);
    harness.users.findAuthenticationEligibleById.mockResolvedValueOnce(user);
    await expect(harness.application.currentUser('valid')).resolves.toEqual(
      authUser,
    );
    harness.sessions.findUserIdByToken.mockResolvedValueOnce(user.id);
    harness.users.findAuthenticationEligibleById.mockResolvedValueOnce(null);
    await expect(
      harness.application.currentUser('ineligible'),
    ).resolves.toBeNull();

    await harness.application.logout(undefined);
    harness.sessions.findByToken.mockResolvedValueOnce(null);
    await harness.application.logout('missing');
    harness.sessions.findByToken.mockResolvedValueOnce({ id: 'session-1' });
    await harness.application.logout('valid');
    expect(harness.sessions.revoke).toHaveBeenCalledWith('session-1');
  });

  it('verifies email tokens and keeps resend behavior enumeration-safe', async () => {
    harness.verification.findActiveByHash.mockResolvedValueOnce(null);
    await expect(
      harness.application.verifyEmail('invalid'),
    ).rejects.toMatchObject({ code: 'INVALID_VERIFICATION_TOKEN' });

    harness.verification.findActiveByHash.mockResolvedValue({
      id: 'verification-1',
      userId: user.id,
    });
    harness.users.markEmailVerified.mockResolvedValue({
      ...user,
      emailVerified: true,
    });
    harness.verification.consume.mockResolvedValueOnce(false);
    await expect(harness.application.verifyEmail('used')).rejects.toMatchObject(
      {
        code: 'INVALID_VERIFICATION_TOKEN',
      },
    );

    harness.users.markEmailVerified.mockResolvedValueOnce(null);
    await expect(
      harness.application.verifyEmail('missing-user'),
    ).rejects.toMatchObject({ code: 'INVALID_VERIFICATION_TOKEN' });

    harness.verification.consume.mockResolvedValueOnce(true);
    await expect(
      harness.application.verifyEmail('valid'),
    ).resolves.toMatchObject({ id: user.id, emailVerified: true });
    expect(harness.verification.consumeAllForUser).toHaveBeenCalledWith(
      user.id,
      now,
    );

    harness.users.findByEmail.mockResolvedValueOnce(null);
    await harness.application.resendVerification('unknown@example.com');
    harness.users.findByEmail.mockResolvedValueOnce({
      ...user,
      emailVerified: true,
    });
    await harness.application.resendVerification(user.email);
    harness.users.findByEmail.mockResolvedValueOnce(user);
    await harness.application.resendVerification(user.email);
    expect(harness.emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('requests and completes password resets without revealing account state', async () => {
    harness.users.findEntityByEmail.mockResolvedValueOnce(null);
    await harness.application.requestPasswordReset('unknown@example.com');
    harness.users.findEntityByEmail.mockResolvedValueOnce({
      ...user,
      passwordHash: null,
    });
    await harness.application.requestPasswordReset(user.email);
    expect(harness.passwordReset.create).not.toHaveBeenCalled();

    harness.users.findEntityByEmail.mockResolvedValueOnce(user);
    await harness.application.requestPasswordReset(user.email);
    expect(harness.passwordReset.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
    );
    expect(harness.passwordResetSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email, expiresInHours: 1 }),
    );
    expect(harness.events.publish).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.password.reset_requested' }),
    );

    harness.passwords.hash.mockResolvedValue('new-hash');
    harness.database.transaction.mockResolvedValueOnce(null);
    await expect(
      harness.application.completePasswordReset('invalid', 'NewPassword123'),
    ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });

    harness.database.transaction.mockResolvedValueOnce(user.id);
    harness.sessions.revokeAllForUser.mockResolvedValue(2);
    await harness.application.completePasswordReset('valid', 'NewPassword123');
    expect(harness.sessions.revokeAllForUser).toHaveBeenCalledWith(user.id);
    expect(harness.events.publish).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.password.reset_completed' }),
    );

    const transaction = {
      update: vi
        .fn()
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ userId: user.id }]),
            }),
          }),
        })
        .mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
    };
    harness.database.transaction.mockImplementationOnce(
      async (operation: (client: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    );
    await harness.application.completePasswordReset(
      'transactional',
      'NewPassword123',
    );
    expect(transaction.update).toHaveBeenCalledTimes(3);
  });

  it('classifies session history and only revokes sessions owned by the user', async () => {
    harness.sessions.findByToken.mockResolvedValue({ id: 'current' });
    harness.sessions.findUserIdByToken.mockResolvedValue(user.id);
    harness.sessions.listHistoryForUser.mockResolvedValue([
      {
        id: 'current',
        deviceName: 'Laptop',
        userAgent: 'Browser',
        ipAddress: '127.0.0.1',
        createdAt: '2026-08-19T12:00:00.000Z',
        lastSeenAt: null,
        expiresAt: '2026-08-21T12:00:00.000Z',
        revokedAt: null,
      },
      {
        id: 'expired',
        deviceName: null,
        userAgent: null,
        ipAddress: null,
        createdAt: '2026-08-18T12:00:00.000Z',
        lastSeenAt: '2026-08-19T00:00:00.000Z',
        expiresAt: '2026-08-20T11:00:00.000Z',
        revokedAt: null,
      },
      {
        id: 'revoked',
        deviceName: null,
        userAgent: null,
        ipAddress: null,
        createdAt: '2026-08-17T12:00:00.000Z',
        lastSeenAt: null,
        expiresAt: '2026-08-22T12:00:00.000Z',
        revokedAt: '2026-08-19T12:00:00.000Z',
      },
    ]);
    await expect(harness.application.listSessions('token')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'current',
          current: true,
          status: 'active',
        }),
        expect.objectContaining({ id: 'expired', status: 'expired' }),
        expect.objectContaining({ id: 'revoked', status: 'revoked' }),
      ]),
    );

    harness.sessions.listForUser.mockResolvedValue([{ id: 'owned' }]);
    harness.sessions.revoke.mockResolvedValue(true);
    await expect(
      harness.application.revokeSession('token', 'owned'),
    ).resolves.toBe(true);
    await expect(
      harness.application.revokeSession('token', 'other'),
    ).resolves.toBe(false);
    harness.sessions.revokeAllForUser.mockResolvedValue(3);
    await expect(
      harness.application.revokeOtherSessions('token'),
    ).resolves.toBe(3);

    harness.sessions.findByToken.mockResolvedValue(null);
    await expect(harness.application.listSessions('missing')).resolves.toEqual(
      [],
    );
    await expect(
      harness.application.revokeOtherSessions('missing'),
    ).resolves.toBe(0);
    harness.sessions.findByToken.mockResolvedValueOnce({ id: 'orphaned' });
    harness.sessions.findUserIdByToken.mockResolvedValueOnce(null);
    await expect(harness.application.listSessions('orphaned')).resolves.toEqual(
      [],
    );
    harness.sessions.findUserIdByToken.mockResolvedValueOnce(null);
    await expect(
      harness.application.revokeSession('missing', 'session-1'),
    ).resolves.toBe(false);
  });

  it('creates profiles safely across normal and concurrent paths', async () => {
    harness.profiles.findByUserId.mockResolvedValueOnce(profile);
    await expect(harness.application.profileDetails(user.id)).resolves.toBe(
      profile,
    );

    harness.profiles.findByUserId.mockResolvedValueOnce(null);
    harness.users.findById.mockResolvedValueOnce(null);
    await expect(
      harness.application.profileDetails('missing'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    harness.profiles.findByUserId.mockResolvedValueOnce(null);
    harness.users.findById.mockResolvedValueOnce(user);
    harness.profiles.create.mockResolvedValueOnce(profile);
    await expect(harness.application.profileDetails(user.id)).resolves.toBe(
      profile,
    );

    harness.profiles.findByUserId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);
    harness.users.findById.mockResolvedValueOnce(user);
    harness.profiles.create.mockRejectedValueOnce({ code: '23505' });
    await expect(harness.application.profileDetails(user.id)).resolves.toBe(
      profile,
    );

    harness.profiles.findByUserId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    harness.users.findById.mockResolvedValueOnce(user);
    harness.profiles.create
      .mockRejectedValueOnce({ code: '23505' })
      .mockResolvedValueOnce({ ...profile, handle: 'user_user1' });
    await expect(harness.application.profileDetails(user.id)).resolves.toEqual(
      expect.objectContaining({ handle: 'user_user1' }),
    );

    vi.spyOn(harness.application, 'profileDetails').mockResolvedValue(profile);
    harness.profiles.update.mockResolvedValueOnce({
      ...profile,
      bio: 'Updated',
    });
    await expect(
      harness.application.updateProfile(user.id, { bio: 'Updated' }),
    ).resolves.toMatchObject({ bio: 'Updated' });
    harness.profiles.update.mockResolvedValueOnce(null);
    await expect(
      harness.application.updateProfile(user.id, { bio: 'Missing' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    harness.profiles.update.mockRejectedValueOnce({ code: '23505' });
    await expect(
      harness.application.updateProfile(user.id, { handle: 'duplicate' }),
    ).rejects.toMatchObject({ code: 'PROFILE_HANDLE_CONFLICT' });
  });

  it('builds administrator metrics and account details from persistence data', async () => {
    const countQuery = (value: number) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value }]),
      }),
    });
    harness.database.select
      .mockReturnValueOnce(countQuery(10))
      .mockReturnValueOnce(countQuery(8))
      .mockReturnValueOnce(countQuery(4))
      .mockReturnValueOnce(countQuery(3))
      .mockReturnValueOnce(countQuery(1));
    await expect(harness.application.adminOverview()).resolves.toEqual({
      totalUsers: 10,
      verifiedUsers: 8,
      activeSessions: 4,
      newUsersLast7Days: 3,
      superAdmins: 1,
      generatedAt: now.toISOString(),
    });

    harness.database.select.mockReset();
    for (let index = 0; index < 5; index += 1) {
      harness.database.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });
    }
    await expect(harness.application.adminOverview()).resolves.toMatchObject({
      totalUsers: 0,
      verifiedUsers: 0,
      activeSessions: 0,
      newUsersLast7Days: 0,
      superAdmins: 0,
    });

    const limitedQuery = (rows: readonly Record<string, unknown>[]) => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows),
        }),
      }),
    });
    harness.database.select.mockReset();
    harness.users.findById.mockResolvedValue(user);
    harness.database.select
      .mockReturnValueOnce(
        limitedQuery([{ avatarUrl: 'data:image/png;base64,a' }]),
      )
      .mockReturnValueOnce(
        limitedQuery([{ timezone: 'UTC', locale: 'en-US' }]),
      );
    await expect(harness.application.accountDetails(user.id)).resolves.toEqual({
      user: authUser,
      avatarUrl: 'data:image/png;base64,a',
      timezone: 'UTC',
      locale: 'en-US',
    });

    harness.users.findById.mockResolvedValueOnce(null);
    harness.database.select
      .mockReturnValueOnce(limitedQuery([]))
      .mockReturnValueOnce(limitedQuery([]));
    await expect(
      harness.application.accountDetails('missing'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('normalizes account updates and re-verifies replacement email identities', async () => {
    harness.users.findById.mockResolvedValue(user);
    harness.users.findByUsername.mockResolvedValue(null);
    harness.users.findByEmail.mockResolvedValue(null);
    harness.database.transaction.mockResolvedValue(undefined);
    vi.spyOn(harness.application, 'accountDetails').mockResolvedValue({
      user: authUser,
      avatarUrl: null,
      timezone: 'UTC',
      locale: 'en-US',
    });
    vi.spyOn(harness.application, 'profileDetails').mockResolvedValue(profile);

    await expect(
      harness.application.updateAccount(user.id, {
        username: ' ADA ',
        email: user.email,
        timezone: 'UTC',
        locale: 'en-US',
      }),
    ).resolves.toMatchObject({ timezone: 'UTC' });

    const transaction = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    harness.database.transaction.mockImplementationOnce(
      async (operation: (client: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    );
    await harness.application.updateAccount(user.id, {
      username: ' ADA ',
      email: 'new@example.com',
      avatarUrl: 'data:image/png;base64,a',
      timezone: 'UTC',
      locale: 'en-US',
    });
    expect(harness.sessions.revokeAllForUser).toHaveBeenCalledWith(user.id);
    expect(harness.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: user.email }),
    );
    expect(transaction.update).toHaveBeenCalledTimes(2);
    expect(transaction.insert).toHaveBeenCalledOnce();

    harness.users.findByUsername.mockResolvedValueOnce({
      ...user,
      id: 'other-user',
    });
    await expect(
      harness.application.updateAccount(user.id, {
        username: 'other',
        email: user.email,
        timezone: null,
        locale: null,
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_IDENTITY_CONFLICT' });

    harness.users.findById.mockResolvedValueOnce(null);
    await expect(
      harness.application.updateAccount('missing', {
        username: 'missing',
        email: 'missing@example.com',
        timezone: null,
        locale: null,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('lists and creates generic database entities with normalized safe records', async () => {
    const rowsQuery: Record<string, ReturnType<typeof vi.fn>> = {};
    rowsQuery['orderBy'] = vi.fn(() => rowsQuery);
    rowsQuery['limit'] = vi.fn(() => ({
      offset: vi.fn().mockResolvedValue([
        {
          id: user.id,
          username: user.username,
          email: user.email,
          metadata: { visits: 2n },
          createdAt: now,
        },
      ]),
    }));
    harness.database.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            $dynamic: vi.fn(() => rowsQuery),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });
    await expect(
      harness.application.listAdminEntities('users', 'ada', 1, 25),
    ).resolves.toMatchObject({
      entity: 'users',
      total: 1,
      records: [
        expect.objectContaining({
          id: user.id,
          passwordHash: '[REDACTED]',
          metadata: { visits: '2' },
          createdAt: now.toISOString(),
        }),
      ],
    });

    harness.database.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([
            { id: 'wait-1', email: 'person@example.com', role: 'Engineer' },
          ]),
      }),
    });
    await expect(
      harness.application.createAdminEntity('waitlist_entries', {
        email: ' PERSON@example.com ',
        role: 'Engineer',
      }),
    ).resolves.toMatchObject({
      id: 'wait-1',
      email: 'person@example.com',
      role: 'Engineer',
    });
    await expect(
      harness.application.createAdminEntity('waitlist_entries', {}),
    ).rejects.toMatchObject({ code: 'INVALID_ENTITY_VALUES' });

    harness.database.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue({ code: '23505' }),
      }),
    });
    await expect(
      harness.application.createAdminEntity('waitlist_entries', {
        email: 'duplicate@example.com',
      }),
    ).rejects.toMatchObject({ code: 'ENTITY_ALREADY_EXISTS' });
  });

  it('updates and deletes session entities while preserving protected users', async () => {
    const updateResult = (rows: readonly Record<string, unknown>[]) => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(rows),
        }),
      }),
    });
    harness.database.update.mockReturnValueOnce(
      updateResult([
        {
          id: 'session-1',
          userId: user.id,
          deviceName: 'Laptop',
          userAgent: null,
          ipAddress: null,
          lastSeenAt: now,
          expiresAt: now,
          revokedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    );
    await expect(
      harness.application.updateAdminEntity('sessions', 'session-1', {
        deviceName: 'Laptop',
        revokedAt: now,
        ignored: true,
      }),
    ).resolves.toMatchObject({ id: 'session-1', deviceName: 'Laptop' });

    harness.users.findById.mockResolvedValueOnce(null);
    await expect(
      harness.application.updateAdminEntity('users', 'missing', {}),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const ownerQuery = (rows: readonly Record<string, unknown>[]) => ({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(rows),
          }),
        }),
      }),
    });
    harness.users.findById.mockResolvedValueOnce(user);
    harness.database.select.mockReturnValueOnce(ownerQuery([]));
    harness.database.update.mockReturnValueOnce(
      updateResult([
        {
          id: user.id,
          username: 'updated',
          email: user.email,
          status: user.status,
          emailVerified: user.emailVerified,
          role: user.role,
          tier: user.tier,
          metadata: {},
          createdAt: now,
          updatedAt: now,
        },
      ]),
    );
    await expect(
      harness.application.updateAdminEntity('users', user.id, {
        username: 'updated',
        ignored: true,
      }),
    ).resolves.toMatchObject({ id: user.id, username: 'updated' });

    harness.users.findById.mockResolvedValueOnce(user);
    harness.database.select.mockReturnValueOnce(
      ownerQuery([{ userId: user.id }]),
    );
    await expect(
      harness.application.updateAdminEntity('users', user.id, {}),
    ).rejects.toMatchObject({ code: 'PROTECTED_OWNER_FORBIDDEN' });

    harness.users.findById.mockResolvedValueOnce(user);
    harness.database.select.mockReturnValueOnce(ownerQuery([]));
    harness.database.update.mockReturnValueOnce(
      updateResult([{ id: user.id }]),
    );
    await expect(
      harness.application.deleteAdminEntity('users', user.id, 'admin-2'),
    ).resolves.toBeUndefined();
    harness.users.findById.mockResolvedValueOnce(null);
    await expect(
      harness.application.deleteAdminEntity('users', 'missing', user.id),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    harness.database.update.mockReturnValueOnce(
      updateResult([{ id: 'session-1' }]),
    );
    await expect(
      harness.application.deleteAdminEntity('sessions', 'session-1', user.id),
    ).resolves.toBeUndefined();
    harness.database.update.mockReturnValueOnce(updateResult([]));
    await expect(
      harness.application.deleteAdminEntity('sessions', 'missing', user.id),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    harness.database.update.mockReturnValueOnce(updateResult([]));
    await expect(
      harness.application.updateAdminEntity('sessions', 'missing', {}),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('validates generic administration requests and protects account deletion', async () => {
    await expect(
      harness.application.createAdminEntity('users', {}),
    ).rejects.toMatchObject({ code: 'INVALID_ENTITY_VALUES', status: 422 });

    harness.users.findByUsername.mockResolvedValue(user);
    harness.users.findByEmail.mockResolvedValue(null);
    await expect(
      harness.application.createAdminEntity('users', {
        username: user.username,
        email: user.email,
        password: 'SecurePassword1',
      }),
    ).rejects.toMatchObject({ code: 'USER_ALREADY_EXISTS' });

    harness.users.findByUsername.mockResolvedValue(null);
    harness.users.findByEmail.mockResolvedValue(null);
    harness.passwords.hash.mockResolvedValue('hash');
    harness.users.create.mockResolvedValue({ ...user, emailVerified: true });
    await expect(
      harness.application.createAdminEntity('users', {
        username: ' Ada ',
        email: ' ADA@example.com ',
        password: 'SecurePassword1',
        displayName: ' Ada Lovelace ',
      }),
    ).resolves.toMatchObject({ id: user.id, emailVerified: true });

    harness.users.create.mockResolvedValueOnce({
      ...user,
      id: 'user-2',
      username: 'grace',
      email: 'grace@example.com',
      emailVerified: false,
    });
    await expect(
      harness.application.createAdminEntity('users', {
        username: 'grace',
        email: 'grace@example.com',
        password: 'SecurePassword1',
      }),
    ).resolves.toMatchObject({ id: 'user-2', emailVerified: false });
    expect(harness.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'grace@example.com' }),
    );

    harness.users.create.mockRejectedValueOnce({ code: '23505' });
    await expect(
      harness.application.createAdminEntity('users', {
        username: 'duplicate',
        email: 'duplicate@example.com',
        password: 'SecurePassword1',
      }),
    ).rejects.toMatchObject({ code: 'USER_ALREADY_EXISTS' });

    await expect(
      harness.application.listAdminEntities('missing', '', 1, 25),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_ENTITY_TYPE' });
    await expect(
      harness.application.updateAdminEntity('organizations', 'id', {}),
    ).rejects.toMatchObject({ code: 'ENTITY_UPDATE_UNSUPPORTED' });
    await expect(
      harness.application.deleteAdminEntity('users', user.id, user.id),
    ).rejects.toMatchObject({ code: 'SELF_DELETE_FORBIDDEN' });
    await expect(
      harness.application.deleteAdminEntity('roles', 'role-1', user.id),
    ).rejects.toMatchObject({ code: 'ENTITY_DELETE_UNSUPPORTED' });
    await expect(harness.application.adminEntityCatalog()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'users' })]),
    );
  });

  it('exposes stable application error metadata', () => {
    const error = new AuthApplicationError('TEST_ERROR', 'Test failure', 418);
    expect(error).toMatchObject({
      name: 'AuthApplicationError',
      code: 'TEST_ERROR',
      message: 'Test failure',
      status: 418,
    });
  });
});
