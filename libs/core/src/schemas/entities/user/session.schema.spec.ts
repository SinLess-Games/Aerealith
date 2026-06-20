// libs/core/src/schemas/entities/user/session.schema.spec.ts

import { describe, expect, it } from 'vitest';

import { Country } from '../../../enumns';
import {
  CreateUserSessionEntitySchema,
  PublicUserSessionGeoIpSchema,
  RecordUserSessionActivitySchema,
  UpdateUserSessionEntitySchema,
  UserSessionContractSchema,
  UserSessionDeviceNameSchema,
  UserSessionEntitySchema,
  UserSessionGeoIpSchema,
  UserSessionIdSchema,
  UserSessionIpAddressSchema,
  UserSessionTokenHashSchema,
  UserSessionUserAgentSchema,
  UserSessionUserIdSchema,
} from './session.schema';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('user session field schemas', () => {
  it('accepts valid session and user IDs', () => {
    expect(UserSessionIdSchema.safeParse(sessionId).success).toBe(true);
    expect(UserSessionUserIdSchema.safeParse(userId).success).toBe(true);
  });

  it('rejects invalid session and user IDs', () => {
    expect(UserSessionIdSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(UserSessionUserIdSchema.safeParse('not-a-uuid').success).toBe(
      false,
    );
  });

  it('accepts a valid token hash', () => {
    const result = UserSessionTokenHashSchema.safeParse(
      'hashed-session-token',
    );

    expect(result.success).toBe(true);
  });

  it('rejects an empty token hash', () => {
    const result = UserSessionTokenHashSchema.safeParse('');

    expect(result.success).toBe(false);
  });

  it('trims a valid device name', () => {
    const result = UserSessionDeviceNameSchema.safeParse(
      '  Firefox on Ubuntu  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('Firefox on Ubuntu');
    }
  });

  it('rejects an empty device name', () => {
    const result = UserSessionDeviceNameSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('trims a valid user agent', () => {
    const result = UserSessionUserAgentSchema.safeParse(
      '  Mozilla/5.0  ',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe('Mozilla/5.0');
    }
  });

  it('rejects an empty user agent', () => {
    const result = UserSessionUserAgentSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('accepts a valid IP address string', () => {
    const result = UserSessionIpAddressSchema.safeParse('203.0.113.10');

    expect(result.success).toBe(true);
  });

  it('rejects an empty IP address string', () => {
    const result = UserSessionIpAddressSchema.safeParse('   ');

    expect(result.success).toBe(false);
  });

  it('rejects an IP address string longer than forty-five characters', () => {
    const result = UserSessionIpAddressSchema.safeParse('1'.repeat(46));

    expect(result.success).toBe(false);
  });
});

describe('UserSessionGeoIpSchema', () => {
  it('accepts full internal GeoIP data', () => {
    const result = UserSessionGeoIpSchema.safeParse({
      country: Country.UnitedStates,
      region: 'Idaho',
      city: 'Twin Falls',
      timezone: 'America/Boise',
      latitude: 42.5558,
      longitude: -114.47,
    });

    expect(result.success).toBe(true);
  });

  it('accepts partial GeoIP data', () => {
    const result = UserSessionGeoIpSchema.safeParse({
      country: Country.UnitedStates,
      city: 'Twin Falls',
    });

    expect(result.success).toBe(true);
  });

  it('rejects latitude outside the valid range', () => {
    const result = UserSessionGeoIpSchema.safeParse({
      latitude: 91,
    });

    expect(result.success).toBe(false);
  });

  it('rejects longitude outside the valid range', () => {
    const result = UserSessionGeoIpSchema.safeParse({
      longitude: -181,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported country value', () => {
    const result = UserSessionGeoIpSchema.safeParse({
      country: 'not-a-country',
    });

    expect(result.success).toBe(false);
  });
});

describe('PublicUserSessionGeoIpSchema', () => {
  it('removes precise GeoIP coordinates from public data', () => {
    const result = PublicUserSessionGeoIpSchema.safeParse({
      country: Country.UnitedStates,
      region: 'Idaho',
      city: 'Twin Falls',
      timezone: 'America/Boise',
      latitude: 42.5558,
      longitude: -114.47,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
      });

      expect(result.data).not.toHaveProperty('latitude');
      expect(result.data).not.toHaveProperty('longitude');
    }
  });
});

describe('CreateUserSessionEntitySchema', () => {
  it('accepts the minimum valid session creation input', () => {
    const expiresAt = new Date('2026-06-21T12:00:00.000Z');

    const result = CreateUserSessionEntitySchema.safeParse({
      userId,
      tokenHash: 'hashed-session-token',
      expiresAt,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        tokenHash: 'hashed-session-token',
        expiresAt,
      });
    }
  });

  it('accepts complete session creation input', () => {
    const expiresAt = new Date('2026-06-21T12:00:00.000Z');
    const lastSeenAt = new Date('2026-06-20T12:00:00.000Z');

    const result = CreateUserSessionEntitySchema.safeParse({
      userId,
      tokenHash: 'hashed-session-token',
      expiresAt,
      deviceName: '  Firefox on Ubuntu  ',
      userAgent: '  Mozilla/5.0  ',
      ipAddress: '  203.0.113.10  ',
      geoIp: {
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
        latitude: 42.5558,
        longitude: -114.47,
      },
      lastSeenAt,
      revokedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.deviceName).toBe('Firefox on Ubuntu');
      expect(result.data.userAgent).toBe('Mozilla/5.0');
      expect(result.data.ipAddress).toBe('203.0.113.10');
      expect(result.data.geoIp).toEqual({
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
        latitude: 42.5558,
        longitude: -114.47,
      });
      expect(result.data.lastSeenAt).toEqual(lastSeenAt);
      expect(result.data.revokedAt).toBeNull();
    }
  });

  it('accepts nullable optional session fields', () => {
    const result = CreateUserSessionEntitySchema.safeParse({
      userId,
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,
      lastSeenAt: null,
      revokedAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects session creation without a token hash', () => {
    const result = CreateUserSessionEntitySchema.safeParse({
      userId,
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    });

    expect(result.success).toBe(false);
  });

  it('rejects session creation without an expiry date', () => {
    const result = CreateUserSessionEntitySchema.safeParse({
      userId,
      tokenHash: 'hashed-session-token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects session creation with an invalid user ID', () => {
    const result = CreateUserSessionEntitySchema.safeParse({
      userId: 'not-a-uuid',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    });

    expect(result.success).toBe(false);
  });
});

describe('UpdateUserSessionEntitySchema', () => {
  it('accepts a partial session update', () => {
    const expiresAt = new Date('2026-06-22T12:00:00.000Z');

    const result = UpdateUserSessionEntitySchema.safeParse({
      deviceName: '  Firefox on Ubuntu  ',
      expiresAt,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        deviceName: 'Firefox on Ubuntu',
        expiresAt,
      });
    }
  });

  it('accepts clearing nullable session fields', () => {
    const result = UpdateUserSessionEntitySchema.safeParse({
      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,
      lastSeenAt: null,
      revokedAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty session update', () => {
    const result = UpdateUserSessionEntitySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects invalid GeoIP updates', () => {
    const result = UpdateUserSessionEntitySchema.safeParse({
      geoIp: {
        latitude: 100,
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('RecordUserSessionActivitySchema', () => {
  it('accepts valid activity details', () => {
    const result = RecordUserSessionActivitySchema.safeParse({
      userAgent: '  Mozilla/5.0  ',
      ipAddress: '  203.0.113.10  ',
      geoIp: {
        country: Country.UnitedStates,
        city: 'Twin Falls',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        userAgent: 'Mozilla/5.0',
        ipAddress: '203.0.113.10',
        geoIp: {
          country: Country.UnitedStates,
          city: 'Twin Falls',
        },
      });
    }
  });

  it('accepts an empty activity update', () => {
    const result = RecordUserSessionActivitySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts explicitly cleared activity values', () => {
    const result = RecordUserSessionActivitySchema.safeParse({
      userAgent: null,
      ipAddress: null,
      geoIp: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid activity data', () => {
    const result = RecordUserSessionActivitySchema.safeParse({
      ipAddress: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('UserSessionEntitySchema', () => {
  it('accepts a complete internal user session entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const updatedAt = new Date('2026-06-20T12:10:00.000Z');
    const expiresAt = new Date('2026-06-21T12:00:00.000Z');
    const lastSeenAt = new Date('2026-06-20T12:05:00.000Z');

    const result = UserSessionEntitySchema.safeParse({
      id: sessionId,
      userId,
      tokenHash: 'hashed-session-token',

      deviceName: '  Firefox on Ubuntu  ',
      userAgent: '  Mozilla/5.0  ',
      ipAddress: '  203.0.113.10  ',
      geoIp: {
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
        latitude: 42.5558,
        longitude: -114.47,
      },

      lastSeenAt,
      expiresAt,
      revokedAt: null,

      createdAt,
      updatedAt,
      deletedAt: null,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe(sessionId);
      expect(result.data.userId).toBe(userId);
      expect(result.data.tokenHash).toBe('hashed-session-token');
      expect(result.data.deviceName).toBe('Firefox on Ubuntu');
      expect(result.data.userAgent).toBe('Mozilla/5.0');
      expect(result.data.ipAddress).toBe('203.0.113.10');
      expect(result.data.lastSeenAt).toEqual(lastSeenAt);
      expect(result.data.expiresAt).toEqual(expiresAt);
      expect(result.data.revokedAt).toBeNull();
      expect(result.data.createdAt).toEqual(createdAt);
      expect(result.data.updatedAt).toEqual(updatedAt);
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('accepts a revoked and soft-deleted session entity', () => {
    const deletedAt = new Date('2026-06-20T12:30:00.000Z');

    const result = UserSessionEntitySchema.safeParse({
      id: sessionId,
      userId,
      tokenHash: 'hashed-session-token',

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,

      lastSeenAt: null,
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      revokedAt: new Date('2026-06-20T12:20:00.000Z'),

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an entity with an invalid session ID', () => {
    const result = UserSessionEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,
      tokenHash: 'hashed-session-token',

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,

      lastSeenAt: null,
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      revokedAt: null,

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });

  it('rejects an entity missing required timestamps', () => {
    const result = UserSessionEntitySchema.safeParse({
      id: sessionId,
      userId,
      tokenHash: 'hashed-session-token',

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,

      lastSeenAt: null,
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      revokedAt: null,
      deletedAt: null,
    });

    expect(result.success).toBe(false);
  });
});

describe('UserSessionContractSchema', () => {
  it('accepts a safe serialized user session contract', () => {
    const result = UserSessionContractSchema.safeParse({
      id: sessionId,
      userId,
      tokenHash: 'hashed-session-token',

      deviceName: '  Firefox on Ubuntu  ',
      userAgent: '  Mozilla/5.0  ',
      ipAddress: '  203.0.113.10  ',
      geoIp: {
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
        latitude: 42.5558,
        longitude: -114.47,
      },

      lastSeenAt: '2026-06-20T12:05:00.000Z',
      expiresAt: '2026-06-21T12:00:00.000Z',
      revokedAt: null,

      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        id: sessionId,
        userId,

        deviceName: 'Firefox on Ubuntu',
        userAgent: 'Mozilla/5.0',
        ipAddress: '203.0.113.10',
        geoIp: {
          country: Country.UnitedStates,
          region: 'Idaho',
          city: 'Twin Falls',
          timezone: 'America/Boise',
        },

        lastSeenAt: '2026-06-20T12:05:00.000Z',
        expiresAt: '2026-06-21T12:00:00.000Z',
        revokedAt: null,

        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      });

      expect(result.data).not.toHaveProperty('tokenHash');
      expect(result.data.geoIp).not.toHaveProperty('latitude');
      expect(result.data.geoIp).not.toHaveProperty('longitude');
    }
  });

  it('accepts a contract with nullable optional session details', () => {
    const result = UserSessionContractSchema.safeParse({
      id: sessionId,
      userId,

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,

      lastSeenAt: null,
      expiresAt: '2026-06-21T12:00:00.000Z',
      revokedAt: null,

      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a contract with an invalid serialized expiry date', () => {
    const result = UserSessionContractSchema.safeParse({
      id: sessionId,
      userId,

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: null,

      lastSeenAt: null,
      expiresAt: 'not-a-timestamp',
      revokedAt: null,

      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a contract with invalid public GeoIP data', () => {
    const result = UserSessionContractSchema.safeParse({
      id: sessionId,
      userId,

      deviceName: null,
      userAgent: null,
      ipAddress: null,
      geoIp: {
        country: 'not-a-country',
      },

      lastSeenAt: null,
      expiresAt: '2026-06-21T12:00:00.000Z',
      revokedAt: null,

      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
