// libs/core/src/entities/user/user.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DefaultUserRole,
  DefaultUserTier,
  UserRole,
  UserTier,
} from '../../enumns';
import {
  UserEntity,
  UserLifecycleStatus,
} from './user.entity';

describe('UserEntity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a user with safe defaults', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    expect(user.id).toBeTypeOf('string');
    expect(user.username).toBe('andy');
    expect(user.email).toBe('andy@example.com');
    expect(user.passwordHash).toBe('hashed-password');

    expect(user.status).toBe(UserLifecycleStatus.Active);
    expect(user.emailVerified).toBe(false);
    expect(user.emailVerifiedAt).toBeNull();

    expect(user.role).toBe(DefaultUserRole);
    expect(user.tier).toBe(DefaultUserTier);
    expect(user.metadata).toEqual({});
  });

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:30:00.000Z');

    const user = new UserEntity({
      id: 'user-id',
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(user.id).toBe('user-id');
    expect(user.createdAt).toBe(createdAt);
    expect(user.updatedAt).toBe(updatedAt);
    expect(user.deletedAt).toBeNull();
  });

  it('normalizes usernames and email addresses', () => {
    const user = new UserEntity({
      username: '  Andy_Pierce  ',
      email: '  Andy@Example.COM  ',
      passwordHash: 'hashed-password',
    });

    expect(user.username).toBe('andy_pierce');
    expect(user.email).toBe('andy@example.com');
  });

  it('uses supplied role, tier, status, and metadata', () => {
    const metadata = {
      source: 'waitlist',
      invitedBy: 'admin-id',
    };

    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      status: UserLifecycleStatus.Suspended,
      role: UserRole.Admin,
      tier: UserTier.Pro,
      metadata,
    });

    expect(user.status).toBe(UserLifecycleStatus.Suspended);
    expect(user.role).toBe(UserRole.Admin);
    expect(user.tier).toBe(UserTier.Pro);
    expect(user.metadata).toEqual(metadata);
  });

  it('starts active when the lifecycle status is active', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    expect(user.isActive).toBe(true);
  });

  it('is not active when disabled', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      status: UserLifecycleStatus.Disabled,
    });

    expect(user.isActive).toBe(false);
  });

  it('is not active when suspended', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      status: UserLifecycleStatus.Suspended,
    });

    expect(user.isActive).toBe(false);
  });

  it('starts with an unverified email address', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    expect(user.emailVerified).toBe(false);
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.hasVerifiedEmail).toBe(false);
  });

  it('verifies the user email address', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'));

    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.verifyEmail();

    expect(user.emailVerified).toBe(true);
    expect(user.emailVerifiedAt).toEqual(
      new Date('2026-06-20T12:10:00.000Z'),
    );
    expect(user.updatedAt).toEqual(
      new Date('2026-06-20T12:10:00.000Z'),
    );
    expect(user.hasVerifiedEmail).toBe(true);
  });

  it('marks a verified email address as unverified', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-06-20T12:00:00.000Z'),
    });

    user.markEmailUnverified();

    expect(user.emailVerified).toBe(false);
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.hasVerifiedEmail).toBe(false);
  });

  it('updates supplied user fields without overwriting untouched fields', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'original-password-hash',
      metadata: {
        source: 'waitlist',
      },
    });

    user.update({
      username: '  Andy_Pierce  ',
      metadata: {
        source: 'manual',
        migrated: true,
      },
    });

    expect(user.username).toBe('andy_pierce');
    expect(user.metadata).toEqual({
      source: 'manual',
      migrated: true,
    });

    expect(user.email).toBe('andy@example.com');
    expect(user.passwordHash).toBe('original-password-hash');
  });

  it('updates and normalizes the email address', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.update({
      email: '  Updated@Example.COM  ',
    });

    expect(user.email).toBe('updated@example.com');
  });

  it('updates the password hash only through setPasswordHash', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'old-password-hash',
    });

    user.setPasswordHash('new-password-hash');

    expect(user.passwordHash).toBe('new-password-hash');
  });

  it('activates a disabled user', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
      status: UserLifecycleStatus.Disabled,
    });

    user.activate();

    expect(user.status).toBe(UserLifecycleStatus.Active);
    expect(user.isActive).toBe(true);
  });

  it('disables an active user', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.disable();

    expect(user.status).toBe(UserLifecycleStatus.Disabled);
    expect(user.isActive).toBe(false);
  });

  it('suspends an active user', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.suspend();

    expect(user.status).toBe(UserLifecycleStatus.Suspended);
    expect(user.isActive).toBe(false);
  });

  it('changes the user role', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.setRole(UserRole.Admin);

    expect(user.role).toBe(UserRole.Admin);
  });

  it('changes the user tier', () => {
    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    user.setTier(UserTier.Pro);

    expect(user.tier).toBe(UserTier.Pro);
  });

  it('updates updatedAt when the user changes', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'));

    user.setRole(UserRole.Admin);

    expect(user.updatedAt).toEqual(
      new Date('2026-06-20T12:10:00.000Z'),
    );
  });

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));

    const user = new UserEntity({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password',
    });

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'));

    user.softDelete();

    expect(user.isDeleted).toBe(true);
    expect(user.deletedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
    expect(user.updatedAt).toEqual(
      new Date('2026-06-20T12:20:00.000Z'),
    );
  });
});
