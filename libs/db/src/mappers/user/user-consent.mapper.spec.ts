// libs/db/src/mappers/user/user-consent.mapper.spec.ts

import {
  UserConsentEntity,
  UserConsentType,
} from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserConsentRow } from '../../schema';
import {
  toNewUserConsentRow,
  toUserConsentContract,
  toUserConsentEntity,
} from './user-consent.mapper';

type UserConsentTypeValue =
  (typeof UserConsentType)[keyof typeof UserConsentType];

function createUserConsentRow(
  overrides: Partial<UserConsentRow> = {},
): UserConsentRow {
  return {
    id: 'consent_123',
    userId: 'user_123',
    type: UserConsentType.PrivacyPolicy as UserConsentTypeValue,
    version: '2026-06',
    grantedAt: new Date('2026-06-20T00:00:00.000Z'),
    revokedAt: null,

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user consent mapper', () => {
  it('converts a database row into a user consent entity', () => {
    const row = createUserConsentRow();

    const entity = toUserConsentEntity(row);

    expect(entity).toBeInstanceOf(UserConsentEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,
        type: row.type,
        version: row.version,
        grantedAt: row.grantedAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('preserves a revoked consent timestamp when converting to an entity', () => {
    const revokedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserConsentEntity(
      createUserConsentRow({
        grantedAt: null,
        revokedAt,
      }),
    );

    expect(entity.grantedAt).toBeNull();
    expect(entity.revokedAt).toBe(revokedAt);
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-22T00:00:00.000Z');

    const entity = toUserConsentEntity(
      createUserConsentRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user consent entity into a database insert row', () => {
    const row = createUserConsentRow();
    const entity = toUserConsentEntity(row);

    const newRow = toNewUserConsentRow(entity);

    expect(newRow).toEqual({
      userId: row.userId,
      type: row.type,
      version: row.version,
      grantedAt: row.grantedAt,
      revokedAt: row.revokedAt,
    });
  });

  it('preserves nullable consent fields in a database insert row', () => {
    const row = createUserConsentRow({
      version: null,
      grantedAt: null,
      revokedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    const entity = toUserConsentEntity(row);
    const newRow = toNewUserConsentRow(entity);

    expect(newRow).toEqual(
      expect.objectContaining({
        version: null,
        grantedAt: null,
        revokedAt: row.revokedAt,
      }),
    );
  });

  it('converts an entity into a public user consent contract', () => {
    const row = createUserConsentRow();
    const entity = toUserConsentEntity(row);

    const contract = toUserConsentContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,
        type: row.type,
        version: row.version,
        grantedAt: row.grantedAt?.toISOString() ?? null,
        revokedAt: null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('returns null consent timestamps in the contract when they are absent', () => {
    const entity = toUserConsentEntity(
      createUserConsentRow({
        grantedAt: null,
        revokedAt: null,
      }),
    );

    const contract = toUserConsentContract(entity);

    expect(contract.grantedAt).toBeNull();
    expect(contract.revokedAt).toBeNull();
  });

  it('does not expose the soft-deletion timestamp in the contract', () => {
    const entity = toUserConsentEntity(
      createUserConsentRow({
        deletedAt: new Date('2026-06-22T00:00:00.000Z'),
      }),
    );

    const contract = toUserConsentContract(entity);

    expect(contract).not.toHaveProperty('deletedAt');
  });

  it('preserves the consent type through every mapper boundary', () => {
    const row = createUserConsentRow({
      type: UserConsentType.MarketingEmails as UserConsentTypeValue,
    });

    const entity = toUserConsentEntity(row);
    const contract = toUserConsentContract(entity);

    expect(entity.type).toBe(UserConsentType.MarketingEmails);
    expect(contract.type).toBe(UserConsentType.MarketingEmails);
  });
});
