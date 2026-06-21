// libs/db/src/mappers/user/user.mapper.spec.ts

import {
  DefaultUserRole,
  DefaultUserTier,
  UserEntity,
  UserLifecycleStatus,
} from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserRow } from '../../schema';
import {
  toNewUserRow,
  toUserContract,
  toUserEntity,
} from './user.mapper';

function createUserRow(
  overrides: Partial<UserRow> = {},
): UserRow {
  return {
    id: 'user_123',
    username: 'sinless777',
    email: 'andy@example.com',
    passwordHash: 'hashed-password',

    status: UserLifecycleStatus.Active as UserRow['status'],

    emailVerified: false,
    emailVerifiedAt: null,

    role: DefaultUserRole as UserRow['role'],
    tier: DefaultUserTier as UserRow['tier'],

    metadata: {} as UserRow['metadata'],

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user mapper', () => {
  it('converts a database row into a user entity', () => {
    const row = createUserRow();

    const entity = toUserEntity(row);

    expect(entity).toBeInstanceOf(UserEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.passwordHash,

        status: row.status,

        emailVerified: row.emailVerified,
        emailVerifiedAt: row.emailVerifiedAt,

        role: row.role,
        tier: row.tier,

        metadata: row.metadata,

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('preserves a verified email timestamp when converting to an entity', () => {
    const emailVerifiedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserEntity(
      createUserRow({
        emailVerified: true,
        emailVerifiedAt,
      }),
    );

    expect(entity.emailVerified).toBe(true);
    expect(entity.emailVerifiedAt).toBe(emailVerifiedAt);
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-22T00:00:00.000Z');

    const entity = toUserEntity(
      createUserRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user entity into a database insert row', () => {
    const row = createUserRow();
    const entity = toUserEntity(row);

    const newRow = toNewUserRow(entity);

    expect(newRow).toEqual({
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,

      status: row.status,

      emailVerified: row.emailVerified,
      emailVerifiedAt: row.emailVerifiedAt,

      role: row.role,
      tier: row.tier,

      metadata: row.metadata,
    });
  });

  it('preserves nullable verification fields in a database insert row', () => {
    const row = createUserRow({
      emailVerified: false,
      emailVerifiedAt: null,
    });

    const entity = toUserEntity(row);
    const newRow = toNewUserRow(entity);

    expect(newRow).toEqual(
      expect.objectContaining({
        emailVerified: false,
        emailVerifiedAt: null,
      }),
    );
  });

  it('converts an entity into a safe public user contract', () => {
    const row = createUserRow();
    const entity = toUserEntity(row);

    const contract = toUserContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,
        username: row.username,
        email: row.email,

        emailVerified: row.emailVerified,

        status: row.status,
        role: row.role,
        tier: row.tier,

        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('does not expose secrets or internal fields in the user contract', () => {
    const entity = toUserEntity(createUserRow());

    const contract = toUserContract(entity);

    expect(contract).not.toHaveProperty('passwordHash');
    expect(contract).not.toHaveProperty('deletedAt');
    expect(contract).not.toHaveProperty('metadata');
  });

  it('preserves user lifecycle status through every mapper boundary', () => {
    const row = createUserRow({
      status: UserLifecycleStatus.Suspended as UserRow['status'],
    });

    const entity = toUserEntity(row);
    const contract = toUserContract(entity);

    expect(entity.status).toBe(UserLifecycleStatus.Suspended);
    expect(contract.status).toBe(UserLifecycleStatus.Suspended);
  });

  it('preserves user role and tier through every mapper boundary', () => {
    const row = createUserRow({
      role: 'admin' as UserRow['role'],
      tier: 'pro' as UserRow['tier'],
    });

    const entity = toUserEntity(row);
    const contract = toUserContract(entity);

    expect(entity.role).toBe('admin');
    expect(entity.tier).toBe('pro');

    expect(contract.role).toBe('admin');
    expect(contract.tier).toBe('pro');
  });
});
