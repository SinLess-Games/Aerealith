import { UserEntity, UserLifecycleStatus } from '@aerealith-ai/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthEventPublisher } from '../contracts/auth-event-publisher.interface';
import type { AuthUserRepository } from '../contracts/auth-user-repository.interface';
import type { PasswordHasher } from '../contracts/password-hasher.interface';
import { AuthEvent } from '../enums/auth-event.enum';
import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { PasswordAuthenticationService } from './password-authentication.service';

const authenticatedAt = new Date('2026-07-27T12:00:00.000Z');

describe('PasswordAuthenticationService', () => {
  let users: AuthUserRepository;
  let hasher: PasswordHasher;
  let events: AuthEventPublisher;

  beforeEach(() => {
    users = {
      findEntityById: vi.fn(),
      findEntityByEmail: vi.fn(),
      findEntityByUsername: vi.fn(),
      setPasswordHash: vi.fn().mockResolvedValue(true),
    };
    hasher = {
      hash: vi.fn().mockResolvedValue('replacement-hash'),
      verify: vi.fn().mockResolvedValue(true),
      needsRehash: vi.fn().mockReturnValue(false),
    };
    events = { publish: vi.fn() };
  });

  it('authenticates normalized email identifiers and returns safe user data', async () => {
    vi.mocked(users.findEntityByEmail).mockResolvedValue(user());
    const service = createService(users, hasher, events);

    const result = await service.authenticate({
      identifier: '  USER@Example.COM ',
      password: 'plaintext',
    });

    expect(users.findEntityByEmail).toHaveBeenCalledWith('user@example.com');
    expect(hasher.verify).toHaveBeenCalledWith('plaintext', 'stored-hash');
    expect(result.principal).toMatchObject({
      id: 'user-1',
      username: 'aerealith',
      email: 'user@example.com',
      authenticatedAt,
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(events.publish).toHaveBeenCalledWith({
      event: AuthEvent.PasswordAuthenticationSucceeded,
      occurredAt: authenticatedAt,
      userId: 'user-1',
    });
  });

  it('uses normalized usernames and upgrades stale hashes', async () => {
    vi.mocked(users.findEntityByUsername).mockResolvedValue(user());
    const needsRehash = hasher.needsRehash;
    if (!needsRehash)
      throw new Error('Expected rehash support in test hasher.');
    vi.mocked(needsRehash).mockReturnValue(true);
    const service = createService(users, hasher, events);

    await service.authenticate({
      identifier: '  AEREALITH ',
      password: 'plaintext',
    });

    expect(users.findEntityByUsername).toHaveBeenCalledWith('aerealith');
    expect(hasher.hash).toHaveBeenCalledWith('plaintext');
    expect(users.setPasswordHash).toHaveBeenCalledWith(
      'user-1',
      'replacement-hash',
    );
  });

  it.each([
    ['unknown users', null],
    ['users without passwords', user({ passwordHash: null })],
  ])('rejects %s without exposing account state', async (_name, record) => {
    vi.mocked(users.findEntityByEmail).mockResolvedValue(record);
    const service = createService(users, hasher, events);

    await expect(
      service.authenticate({
        identifier: 'user@example.com',
        password: 'plaintext',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(events.publish).toHaveBeenCalledWith({
      event: AuthEvent.PasswordAuthenticationFailed,
      occurredAt: authenticatedAt,
      reason: AuthFailureReason.InvalidCredentials,
      userId: undefined,
    });
  });

  it.each([
    ['invalid password', user(), false],
    ['disabled account', user({ status: UserLifecycleStatus.Disabled }), true],
    [
      'unverified email',
      user({ emailVerified: false, emailVerifiedAt: null }),
      true,
    ],
    ['deleted account', user({ deletedAt: authenticatedAt }), true],
  ])('rejects %s', async (_name, record, passwordMatches) => {
    vi.mocked(users.findEntityByEmail).mockResolvedValue(record);
    vi.mocked(hasher.verify).mockResolvedValue(passwordMatches);
    const service = createService(users, hasher, events);

    await expect(
      service.authenticate({
        identifier: 'user@example.com',
        password: 'plaintext',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(events.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        event: AuthEvent.PasswordAuthenticationFailed,
        userId: 'user-1',
      }),
    );
  });

  it('can allow active users with unverified email when configured', async () => {
    vi.mocked(users.findEntityByEmail).mockResolvedValue(
      user({ emailVerified: false, emailVerifiedAt: null }),
    );
    const service = createService(users, hasher, events, {
      requireVerifiedEmail: false,
    });
    await expect(
      service.authenticate({
        identifier: 'user@example.com',
        password: 'plaintext',
      }),
    ).resolves.toBeDefined();
  });

  it('delegates password hash changes', async () => {
    const service = createService(users, hasher, events);
    await expect(service.changePassword('user-1', 'new-hash')).resolves.toBe(
      true,
    );
    expect(users.setPasswordHash).toHaveBeenCalledWith('user-1', 'new-hash');
  });
});

function createService(
  users: AuthUserRepository,
  hasher: PasswordHasher,
  events: AuthEventPublisher,
  options: { requireVerifiedEmail?: boolean } = {},
): PasswordAuthenticationService {
  return new PasswordAuthenticationService(users, hasher, events, {
    ...options,
    now: () => authenticatedAt,
  });
}

function user(
  overrides: Partial<ConstructorParameters<typeof UserEntity>[0]> = {},
) {
  return new UserEntity({
    id: 'user-1',
    username: 'aerealith',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    emailVerified: true,
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  });
}
