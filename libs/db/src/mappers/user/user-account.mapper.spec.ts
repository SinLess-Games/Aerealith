// libs/db/src/mappers/user/user-account.mapper.spec.ts

import { UserAccountEntity } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserAccountRow } from '../../schema';
import {
  toNewUserAccountRow,
  toUserAccountContract,
  toUserAccountEntity,
} from './user-account.mapper';

function createUserAccountRow(
  overrides: Partial<UserAccountRow> = {},
): UserAccountRow {
  return {
    id: 'account_123',
    userId: 'user_123',

    provider: 'github',
    accountId: 'github_account_123',
    displayName: 'GitHub',
    managementUrl: 'https://github.com/settings/apps',
    status: 'active' as UserAccountRow['status'],
    connectedAt: new Date('2026-06-20T00:00:00.000Z'),

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user account mapper', () => {
  it('converts a database row into a user account entity', () => {
    const row = createUserAccountRow();

    const entity = toUserAccountEntity(row);

    expect(entity).toBeInstanceOf(UserAccountEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,
        provider: row.provider,
        accountId: row.accountId,
        displayName: row.displayName,
        managementUrl: row.managementUrl,
        status: row.status,
        connectedAt: row.connectedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserAccountEntity(
      createUserAccountRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user account entity into a database insert row', () => {
    const row = createUserAccountRow();
    const entity = toUserAccountEntity(row);

    const newRow = toNewUserAccountRow(entity);

    expect(newRow).toEqual({
      userId: row.userId,
      provider: row.provider,
      accountId: row.accountId,
      displayName: row.displayName,
      managementUrl: row.managementUrl,
      status: row.status,
      connectedAt: row.connectedAt,
    });
  });

  it('converts an entity into a public account contract', () => {
    const row = createUserAccountRow();
    const entity = toUserAccountEntity(row);

    const contract = toUserAccountContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,
        provider: row.provider,
        displayName: row.displayName,
        managementUrl: row.managementUrl,
        status: row.status,
        connectedAt: row.connectedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('does not expose ownership or internal account identifiers in the contract', () => {
    const entity = toUserAccountEntity(createUserAccountRow());

    const contract = toUserAccountContract(entity);

    expect(contract).not.toHaveProperty('userId');
    expect(contract).not.toHaveProperty('accountId');
    expect(contract).not.toHaveProperty('deletedAt');
  });

  it('preserves a null management URL in a database insert row', () => {
    const row = createUserAccountRow({
      managementUrl: null,
    });

    const entity = toUserAccountEntity(row);
    const newRow = toNewUserAccountRow(entity);

    expect(newRow).toEqual(
      expect.objectContaining({
        managementUrl: null,
      }),
    );
  });

  it('preserves account status when converting through the mapper', () => {
    const row = createUserAccountRow({
      status: 'suspended' as UserAccountRow['status'],
    });

    const entity = toUserAccountEntity(row);
    const contract = toUserAccountContract(entity);

    expect(entity.status).toBe('suspended');
    expect(contract.status).toBe('suspended');
  });
});
