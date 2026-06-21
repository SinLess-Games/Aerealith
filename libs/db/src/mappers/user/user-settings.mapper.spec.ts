// libs/db/src/mappers/user/user-settings.mapper.spec.ts

import { UserSettingsEntity } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserSettingsRow } from '../../schema';
import {
  toNewUserSettingsRow,
  toUserSettingsContract,
  toUserSettingsEntity,
} from './user-settings.mapper';

const defaultMetadata = {
  schemaVersion: 1,
} as UserSettingsRow['metadata'];

function createUserSettingsRow(
  overrides: Partial<UserSettingsRow> = {},
): UserSettingsRow {
  return {
    id: 'settings_123',
    userId: 'user_123',

    metadata: {} as UserSettingsRow['metadata'],

    accessibility: {
      highContrast: false,
      reduceMotion: false,
      textScale: 1,
    } as UserSettingsRow['accessibility'],

    appearance: {
      compactMode: false,
      theme: 'system',
    } as UserSettingsRow['appearance'],

    communication: {
      progressUpdates: true,
      quietMode: false,
    } as UserSettingsRow['communication'],

    notifications: {
      email: true,
      productUpdates: true,
      push: false,
      securityAlerts: true,
    } as UserSettingsRow['notifications'],

    privacy: {
      analytics: false,
      personalization: true,
    } as UserSettingsRow['privacy'],

    security: {
      mfaEnabled: false,
    } as UserSettingsRow['security'],

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user settings mapper', () => {
  it('converts a database row into a user settings entity', () => {
    const row = createUserSettingsRow();

    const entity = toUserSettingsEntity(row);

    expect(entity).toBeInstanceOf(UserSettingsEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,

        metadata: defaultMetadata,
        accessibility: row.accessibility,
        appearance: row.appearance,
        communication: row.communication,
        notifications: row.notifications,
        privacy: row.privacy,
        security: row.security,

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('applies the default metadata when stored metadata is empty', () => {
    const entity = toUserSettingsEntity(
      createUserSettingsRow({
        metadata: {} as UserSettingsRow['metadata'],
      }),
    );

    expect(entity.metadata).toEqual(defaultMetadata);
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserSettingsEntity(
      createUserSettingsRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user settings entity into a database insert row', () => {
    const row = createUserSettingsRow();
    const entity = toUserSettingsEntity(row);

    const newRow = toNewUserSettingsRow(entity);

    expect(newRow).toEqual({
      userId: row.userId,

      metadata: defaultMetadata,
      accessibility: row.accessibility,
      appearance: row.appearance,
      communication: row.communication,
      notifications: row.notifications,
      privacy: row.privacy,
      security: row.security,
    });
  });

  it('converts an entity into a user settings contract', () => {
    const row = createUserSettingsRow();
    const entity = toUserSettingsEntity(row);

    const contract = toUserSettingsContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,

        metadata: defaultMetadata,
        accessibility: row.accessibility,
        appearance: row.appearance,
        communication: row.communication,
        notifications: row.notifications,
        privacy: row.privacy,
        security: row.security,

        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('does not expose the soft-deletion timestamp in the contract', () => {
    const entity = toUserSettingsEntity(
      createUserSettingsRow({
        deletedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
    );

    const contract = toUserSettingsContract(entity);

    expect(contract).not.toHaveProperty('deletedAt');
  });

  it('preserves accessibility settings through every mapper boundary', () => {
    const accessibility = {
      highContrast: true,
      reduceMotion: true,
      textScale: 1.25,
    } as UserSettingsRow['accessibility'];

    const row = createUserSettingsRow({
      accessibility,
    });

    const entity = toUserSettingsEntity(row);
    const contract = toUserSettingsContract(entity);

    expect(entity.accessibility).toEqual(accessibility);
    expect(contract.accessibility).toEqual(accessibility);
  });

  it('preserves appearance settings through every mapper boundary', () => {
    const appearance = {
      compactMode: true,
      theme: 'dark',
    } as UserSettingsRow['appearance'];

    const row = createUserSettingsRow({
      appearance,
    });

    const entity = toUserSettingsEntity(row);
    const contract = toUserSettingsContract(entity);

    expect(entity.appearance).toEqual(appearance);
    expect(contract.appearance).toEqual(appearance);
  });

  it('preserves communication and notification settings through every mapper boundary', () => {
    const communication = {
      progressUpdates: false,
      quietMode: true,
    } as UserSettingsRow['communication'];

    const notifications = {
      email: false,
      productUpdates: false,
      push: true,
      securityAlerts: true,
    } as UserSettingsRow['notifications'];

    const row = createUserSettingsRow({
      communication,
      notifications,
    });

    const entity = toUserSettingsEntity(row);
    const contract = toUserSettingsContract(entity);

    expect(entity.communication).toEqual(communication);
    expect(entity.notifications).toEqual(notifications);

    expect(contract.communication).toEqual(communication);
    expect(contract.notifications).toEqual(notifications);
  });

  it('preserves privacy and security settings through every mapper boundary', () => {
    const privacy = {
      analytics: true,
      personalization: false,
    } as UserSettingsRow['privacy'];

    const security = {
      mfaEnabled: true,
    } as UserSettingsRow['security'];

    const row = createUserSettingsRow({
      privacy,
      security,
    });

    const entity = toUserSettingsEntity(row);
    const contract = toUserSettingsContract(entity);

    expect(entity.privacy).toEqual(privacy);
    expect(entity.security).toEqual(security);

    expect(contract.privacy).toEqual(privacy);
    expect(contract.security).toEqual(security);
  });
});
