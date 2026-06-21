// libs/db/src/schema/user/user-settings.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { userSettingsTable } from './user-settings.table';

describe('userSettingsTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userSettingsTable)).toBe('user_settings');
  });

  it('defines the required columns', () => {
    const columns = getTableColumns(userSettingsTable);

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'metadata',
      'accessibility',
      'appearance',
      'communication',
      'notifications',
      'privacy',
      'security',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);
  });

  it('requires a user ID', () => {
    const { userId } = getTableColumns(userSettingsTable);

    expect(userId.notNull).toBe(true);
    expect(userId.hasDefault).toBe(false);
  });

  it('requires settings groups with database defaults', () => {
    const {
      metadata,
      accessibility,
      appearance,
      communication,
      notifications,
      privacy,
      security,
    } = getTableColumns(userSettingsTable);

    expect(metadata.notNull).toBe(true);
    expect(metadata.hasDefault).toBe(true);

    expect(accessibility.notNull).toBe(true);
    expect(accessibility.hasDefault).toBe(true);

    expect(appearance.notNull).toBe(true);
    expect(appearance.hasDefault).toBe(true);

    expect(communication.notNull).toBe(true);
    expect(communication.hasDefault).toBe(true);

    expect(notifications.notNull).toBe(true);
    expect(notifications.hasDefault).toBe(true);

    expect(privacy.notNull).toBe(true);
    expect(privacy.hasDefault).toBe(true);

    expect(security.notNull).toBe(true);
    expect(security.hasDefault).toBe(true);
  });

  it('generates IDs and record timestamps by default', () => {
    const { id, createdAt, updatedAt } = getTableColumns(userSettingsTable);

    expect(id.notNull).toBe(true);
    expect(id.hasDefault).toBe(true);

    expect(createdAt.notNull).toBe(true);
    expect(createdAt.hasDefault).toBe(true);

    expect(updatedAt.notNull).toBe(true);
    expect(updatedAt.hasDefault).toBe(true);
  });

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userSettingsTable);

    expect(deletedAt.notNull).toBe(false);
  });
});
