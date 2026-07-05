// libs/core/src/entities/user/settings.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { UserSettingsEntity } from './settings.entity'

describe('UserSettingsEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates settings with safe defaults', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
    })

    expect(settings.id).toBeTypeOf('string')
    expect(settings.userId).toBe('user-id')

    expect(settings.metadata).toEqual({
      schemaVersion: 1,
    })

    expect(settings.accessibility).toEqual({
      reduceMotion: false,
      highContrast: false,
      textScale: 1,
    })

    expect(settings.appearance).toEqual({
      theme: 'system',
      compactMode: false,
    })

    expect(settings.communication).toEqual({
      progressUpdates: true,
      quietMode: false,
    })

    expect(settings.notifications).toEqual({
      email: true,
      push: false,
      productUpdates: true,
      securityAlerts: true,
    })

    expect(settings.privacy).toEqual({
      analytics: false,
      personalization: true,
    })

    expect(settings.security).toEqual({
      mfaEnabled: false,
    })
  })

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')

    const settings = new UserSettingsEntity({
      id: 'settings-id',
      userId: 'user-id',
      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(settings.id).toBe('settings-id')
    expect(settings.createdAt).toBe(createdAt)
    expect(settings.updatedAt).toBe(updatedAt)
    expect(settings.deletedAt).toBeNull()
  })

  it('merges supplied values with defaults during creation', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
      accessibility: {
        reduceMotion: true,
      },
      appearance: {
        theme: 'dark',
      },
      notifications: {
        push: true,
      },
      privacy: {
        analytics: true,
      },
    })

    expect(settings.accessibility).toEqual({
      reduceMotion: true,
      highContrast: false,
      textScale: 1,
    })

    expect(settings.appearance).toEqual({
      theme: 'dark',
      compactMode: false,
    })

    expect(settings.notifications).toEqual({
      email: true,
      push: true,
      productUpdates: true,
      securityAlerts: true,
    })

    expect(settings.privacy).toEqual({
      analytics: true,
      personalization: true,
    })
  })

  it('updates only the supplied accessibility settings', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
      accessibility: {
        reduceMotion: true,
      },
    })

    settings.update({
      accessibility: {
        highContrast: true,
      },
    })

    expect(settings.accessibility).toEqual({
      reduceMotion: true,
      highContrast: true,
      textScale: 1,
    })
  })

  it('updates only the supplied appearance settings', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
      appearance: {
        theme: 'system',
      },
    })

    settings.update({
      appearance: {
        theme: 'light',
      },
    })

    expect(settings.appearance).toEqual({
      theme: 'light',
      compactMode: false,
    })
  })

  it('updates only the supplied notification settings', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
      notifications: {
        push: false,
      },
    })

    settings.update({
      notifications: {
        push: true,
        productUpdates: false,
      },
    })

    expect(settings.notifications).toEqual({
      email: true,
      push: true,
      productUpdates: false,
      securityAlerts: true,
    })
  })

  it('does not overwrite untouched setting groups', () => {
    const settings = new UserSettingsEntity({
      userId: 'user-id',
      appearance: {
        theme: 'dark',
      },
      privacy: {
        analytics: true,
      },
      security: {
        mfaEnabled: true,
      },
    })

    settings.update({
      communication: {
        quietMode: true,
      },
    })

    expect(settings.appearance).toEqual({
      theme: 'dark',
      compactMode: false,
    })

    expect(settings.privacy).toEqual({
      analytics: true,
      personalization: true,
    })

    expect(settings.security).toEqual({
      mfaEnabled: true,
    })

    expect(settings.communication).toEqual({
      progressUpdates: true,
      quietMode: true,
    })
  })

  it('updates updatedAt when settings change', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const settings = new UserSettingsEntity({
      userId: 'user-id',
    })

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    settings.update({
      appearance: {
        theme: 'dark',
      },
    })

    expect(settings.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const settings = new UserSettingsEntity({
      userId: 'user-id',
    })

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'))

    settings.softDelete()

    expect(settings.isDeleted).toBe(true)
    expect(settings.deletedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
    expect(settings.updatedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
  })
})
