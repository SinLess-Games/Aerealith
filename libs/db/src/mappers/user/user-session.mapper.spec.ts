// libs/db/src/mappers/user/user-session.mapper.spec.ts

import { UserSessionEntity } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import type { UserSessionRow } from '../../schema';
import {
  toNewUserSessionRow,
  toPublicUserSessionGeoIp,
  toUserSessionContract,
  toUserSessionEntity,
} from './user-session.mapper';

function createUserSessionRow(
  overrides: Partial<UserSessionRow> = {},
): UserSessionRow {
  return {
    id: 'session_123',
    userId: 'user_123',
    tokenHash: 'hashed-session-token',

    deviceName: 'Firefox on Ubuntu',
    userAgent: 'Mozilla/5.0',
    ipAddress: '192.168.0.10',
    geoIp: {
      country: 'US',
      region: 'Idaho',
      city: 'Twin Falls',
      latitude: 42.5558,
      longitude: -114.4701,
    } as UserSessionRow['geoIp'],

    lastSeenAt: new Date('2026-06-20T00:00:00.000Z'),
    expiresAt: new Date('2026-06-27T00:00:00.000Z'),
    revokedAt: null,

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  };
}

describe('user session mapper', () => {
  it('converts a database row into a user session entity', () => {
    const row = createUserSessionRow();

    const entity = toUserSessionEntity(row);

    expect(entity).toBeInstanceOf(UserSessionEntity);

    expect(entity).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,
        tokenHash: row.tokenHash,

        deviceName: row.deviceName,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        geoIp: row.geoIp,

        lastSeenAt: row.lastSeenAt,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('preserves nullable session fields and defaults missing activity to creation time', () => {
    const row = createUserSessionRow({
      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,
      lastSeenAt: undefined,
      revokedAt: null,
    });

    const entity = toUserSessionEntity(row);

    expect(entity.deviceName).toBeNull();
    expect(entity.userAgent).toBeNull();
    expect(entity.ipAddress).toBeNull();
    expect(entity.geoIp).toBeNull();
    expect(entity.lastSeenAt).toEqual(row.createdAt);
    expect(entity.revokedAt).toBeNull();
  });

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserSessionEntity(
      createUserSessionRow({
        deletedAt,
      }),
    );

    expect(entity.deletedAt).toBe(deletedAt);
  });

  it('converts a user session entity into a database insert row', () => {
    const row = createUserSessionRow();
    const entity = toUserSessionEntity(row);

    const newRow = toNewUserSessionRow(entity);

    expect(newRow).toEqual(
      expect.objectContaining({
        id: row.id,
        userId: row.userId,
        tokenHash: row.tokenHash,

        deviceName: row.deviceName,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        geoIp: row.geoIp,

        lastSeenAt: row.lastSeenAt,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    );
  });

  it('uses the creation timestamp for an insert row when activity is missing', () => {
    const row = createUserSessionRow({
      lastSeenAt: undefined,
    });

    const entity = toUserSessionEntity(row);
    const newRow = toNewUserSessionRow(entity);

    expect(entity.lastSeenAt).toEqual(row.createdAt);
    expect(newRow.lastSeenAt).toEqual(row.createdAt);
  });

  it('removes exact GeoIP coordinates from public session location data', () => {
    const row = createUserSessionRow();

    const publicGeoIp = toPublicUserSessionGeoIp(row.geoIp);

    expect(publicGeoIp).toEqual({
      country: 'US',
      region: 'Idaho',
      city: 'Twin Falls',
    });

    expect(publicGeoIp).not.toHaveProperty('latitude');
    expect(publicGeoIp).not.toHaveProperty('longitude');
  });

  it('returns null public GeoIP data when session GeoIP data is absent', () => {
    expect(toPublicUserSessionGeoIp(null)).toBeNull();
  });

  it('converts an entity into a safe public user session contract', () => {
    const row = createUserSessionRow();
    const entity = toUserSessionEntity(row);

    const contract = toUserSessionContract(entity);

    expect(contract).toEqual(
      expect.objectContaining({
        id: row.id,

        deviceName: row.deviceName,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        geoIp: {
          country: 'US',
          region: 'Idaho',
          city: 'Twin Falls',
        },

        lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
        expiresAt: row.expiresAt.toISOString(),
        revokedAt: null,

        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  });

  it('does not expose private session fields in the contract', () => {
    const entity = toUserSessionEntity(createUserSessionRow());

    const contract = toUserSessionContract(entity);

    expect(contract).not.toHaveProperty('userId');
    expect(contract).not.toHaveProperty('tokenHash');
    expect(contract).not.toHaveProperty('deletedAt');
    expect(contract.geoIp).not.toHaveProperty('latitude');
    expect(contract.geoIp).not.toHaveProperty('longitude');
  });

  it('preserves revoked session state in the contract', () => {
    const revokedAt = new Date('2026-06-21T00:00:00.000Z');

    const entity = toUserSessionEntity(
      createUserSessionRow({
        revokedAt,
      }),
    );

    const contract = toUserSessionContract(entity);

    expect(entity.revokedAt).toBe(revokedAt);
    expect(contract.revokedAt).toBe(revokedAt.toISOString());
  });
});
