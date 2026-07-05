// libs/core/src/entities/user/consent.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { UserConsentEntity, UserConsentType } from './consent.entity'

describe('UserConsentEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a consent record with the supplied values', () => {
    const grantedAt = new Date('2026-06-20T12:00:00.000Z')

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.TermsOfService,
      version: '2026-06-20',
      grantedAt,
    })

    expect(consent.id).toBeTypeOf('string')
    expect(consent.userId).toBe('user-id')
    expect(consent.type).toBe(UserConsentType.TermsOfService)
    expect(consent.version).toBe('2026-06-20')
    expect(consent.grantedAt).toBe(grantedAt)
    expect(consent.revokedAt).toBeNull()
  })

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')

    const consent = new UserConsentEntity({
      id: 'consent-id',
      userId: 'user-id',
      type: UserConsentType.PrivacyPolicy,
      version: '1.0.0',
      grantedAt: null,
      revokedAt: null,
      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(consent.id).toBe('consent-id')
    expect(consent.createdAt).toBe(createdAt)
    expect(consent.updatedAt).toBe(updatedAt)
    expect(consent.deletedAt).toBeNull()
  })

  it('is not granted when it has never been granted', () => {
    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.MarketingEmails,
      grantedAt: null,
      revokedAt: null,
    })

    expect(consent.isGranted).toBe(false)
  })

  it('is granted when it has a granted timestamp and no revocation timestamp', () => {
    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.PrivacyPolicy,
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt: null,
    })

    expect(consent.isGranted).toBe(true)
  })

  it('is not granted after being revoked', () => {
    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.Analytics,
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt: new Date('2026-06-20T12:05:00.000Z'),
    })

    expect(consent.isGranted).toBe(false)
  })

  it('grants consent and clears a previous revocation', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.ProductUpdates,
      grantedAt: null,
      revokedAt: new Date('2026-06-20T12:00:00.000Z'),
    })

    consent.grant()

    expect(consent.grantedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(consent.revokedAt).toBeNull()
    expect(consent.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(consent.isGranted).toBe(true)
  })

  it('updates the policy version when granting consent', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.TermsOfService,
      version: '1.0.0',
      grantedAt: null,
      revokedAt: null,
    })

    consent.grant('2.0.0')

    expect(consent.version).toBe('2.0.0')
    expect(consent.grantedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(consent.revokedAt).toBeNull()
  })

  it('revokes consent and updates its timestamp', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.Cookies,
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt: null,
    })

    vi.setSystemTime(new Date('2026-06-20T12:15:00.000Z'))

    consent.revoke()

    expect(consent.revokedAt).toEqual(new Date('2026-06-20T12:15:00.000Z'))
    expect(consent.updatedAt).toEqual(new Date('2026-06-20T12:15:00.000Z'))
    expect(consent.isGranted).toBe(false)
  })

  it('can grant consent again after revocation', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.Analytics,
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt: null,
    })

    vi.setSystemTime(new Date('2026-06-20T12:05:00.000Z'))
    consent.revoke()

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))
    consent.grant()

    expect(consent.grantedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(consent.revokedAt).toBeNull()
    expect(consent.isGranted).toBe(true)
  })

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const consent = new UserConsentEntity({
      userId: 'user-id',
      type: UserConsentType.PrivacyPolicy,
      grantedAt: new Date('2026-06-20T12:00:00.000Z'),
      revokedAt: null,
    })

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'))

    consent.softDelete()

    expect(consent.isDeleted).toBe(true)
    expect(consent.deletedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
    expect(consent.updatedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
  })
})
