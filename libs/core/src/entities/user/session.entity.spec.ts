// libs/core/src/entities/user/session.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { Country } from '../../enumns'
import { UserSessionEntity } from './session.entity'

describe('UserSessionEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a session with safe defaults', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const expiresAt = new Date('2026-06-21T12:00:00.000Z')

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt,
    })

    expect(session.id).toBeTypeOf('string')
    expect(session.userId).toBe('user-id')
    expect(session.tokenHash).toBe('hashed-session-token')

    expect(session.deviceName).toBeNull()
    expect(session.userAgent).toBeNull()
    expect(session.ipAddress).toBeNull()
    expect(session.geoIp).toBeNull()

    expect(session.lastSeenAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))

    expect(session.expiresAt).toBe(expiresAt)
    expect(session.revokedAt).toBeNull()
  })

  it('preserves supplied base entity and session values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')
    const expiresAt = new Date('2026-06-21T12:00:00.000Z')
    const lastSeenAt = new Date('2026-06-20T12:15:00.000Z')

    const session = new UserSessionEntity({
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt,
      deviceName: 'Firefox on Ubuntu',
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.0.10',
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
      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(session.id).toBe('session-id')
    expect(session.createdAt).toBe(createdAt)
    expect(session.updatedAt).toBe(updatedAt)
    expect(session.deletedAt).toBeNull()

    expect(session.deviceName).toBe('Firefox on Ubuntu')
    expect(session.userAgent).toBe('Mozilla/5.0')
    expect(session.ipAddress).toBe('192.168.0.10')

    expect(session.geoIp).toEqual({
      country: Country.UnitedStates,
      region: 'Idaho',
      city: 'Twin Falls',
      timezone: 'America/Boise',
      latitude: 42.5558,
      longitude: -114.47,
    })

    expect(session.lastSeenAt).toBe(lastSeenAt)
  })

  it('is active when it is not revoked or expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    })

    expect(session.isRevoked).toBe(false)
    expect(session.isExpired()).toBe(false)
    expect(session.isActive).toBe(true)
  })

  it('reports an expired session correctly', () => {
    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-20T11:59:59.999Z'),
    })

    expect(session.isExpired(new Date('2026-06-20T12:00:00.000Z'))).toBe(true)
  })

  it('reports a revoked session correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      revokedAt: new Date('2026-06-20T12:00:00.000Z'),
    })

    expect(session.isRevoked).toBe(true)
    expect(session.isActive).toBe(false)
  })

  it('records session activity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    })

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    session.recordActivity({
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64)',
      ipAddress: '203.0.113.10',
      geoIp: {
        country: Country.UnitedStates,
        region: 'Idaho',
        city: 'Twin Falls',
        timezone: 'America/Boise',
      },
    })

    expect(session.userAgent).toBe('Mozilla/5.0 (X11; Ubuntu; Linux x86_64)')
    expect(session.ipAddress).toBe('203.0.113.10')

    expect(session.geoIp).toEqual({
      country: Country.UnitedStates,
      region: 'Idaho',
      city: 'Twin Falls',
      timezone: 'America/Boise',
    })

    expect(session.lastSeenAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))

    expect(session.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })

  it('does not overwrite existing activity details when they are omitted', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
      userAgent: 'Original user agent',
      ipAddress: '192.168.0.10',
      geoIp: {
        country: Country.UnitedStates,
        city: 'Twin Falls',
      },
    })

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    session.recordActivity()

    expect(session.userAgent).toBe('Original user agent')
    expect(session.ipAddress).toBe('192.168.0.10')

    expect(session.geoIp).toEqual({
      country: Country.UnitedStates,
      city: 'Twin Falls',
    })

    expect(session.lastSeenAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })

  it('revokes a session and updates its timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    })

    vi.setSystemTime(new Date('2026-06-20T12:15:00.000Z'))

    session.revoke()

    expect(session.isRevoked).toBe(true)
    expect(session.isActive).toBe(false)

    expect(session.revokedAt).toEqual(new Date('2026-06-20T12:15:00.000Z'))

    expect(session.updatedAt).toEqual(new Date('2026-06-20T12:15:00.000Z'))
  })

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const session = new UserSessionEntity({
      userId: 'user-id',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-06-21T12:00:00.000Z'),
    })

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'))

    session.softDelete()

    expect(session.isDeleted).toBe(true)

    expect(session.deletedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))

    expect(session.updatedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
  })
})
