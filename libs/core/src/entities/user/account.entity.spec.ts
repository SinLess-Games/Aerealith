// libs/core/src/entities/user/account.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { UserAccountEntity } from './account.entity'

describe('UserAccountEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a linked account with safe defaults', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    expect(account.id).toBeTypeOf('string')
    expect(account.userId).toBe('user-id')
    expect(account.provider).toBe('github')
    expect(account.accountId).toBe('github-account-id')
    expect(account.displayName).toBe('Andy')
    expect(account.managementUrl).toBeNull()
    expect(account.status).toBe('active')
    expect(account.connectedAt).toBeInstanceOf(Date)
  })

  it('preserves supplied base entity values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')
    const connectedAt = new Date('2026-06-20T12:15:00.000Z')

    const account = new UserAccountEntity({
      id: 'account-id',
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
      createdAt,
      updatedAt,
      deletedAt: null,
      connectedAt,
    })

    expect(account.id).toBe('account-id')
    expect(account.createdAt).toBe(createdAt)
    expect(account.updatedAt).toBe(updatedAt)
    expect(account.deletedAt).toBeNull()
    expect(account.connectedAt).toBe(connectedAt)
  })

  it('normalizes provider names and account fields', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: '  GitHub  ',
      accountId: '  github-account-id  ',
      displayName: '  Andy Pierce  ',
      managementUrl: '  https://github.com/settings/profile  ',
    })

    expect(account.provider).toBe('github')
    expect(account.accountId).toBe('github-account-id')
    expect(account.displayName).toBe('Andy Pierce')
    expect(account.managementUrl).toBe('https://github.com/settings/profile')
  })

  it('uses null for an empty management URL', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
      managementUrl: '   ',
    })

    expect(account.managementUrl).toBeNull()
  })

  it('sets connectedAt when it is not supplied', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    expect(account.connectedAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))
  })

  it('activates an account', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
      status: 'suspended',
    })

    account.activate()

    expect(account.status).toBe('active')
  })

  it('revokes an account', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    account.revoke()

    expect(account.status).toBe('revoked')
  })

  it('suspends an account', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    account.suspend()

    expect(account.status).toBe('suspended')
  })

  it('expires an account', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    account.expire()

    expect(account.status).toBe('expired')
  })

  it('updates updatedAt when the account status changes', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    vi.setSystemTime(new Date('2026-06-20T12:05:00.000Z'))

    account.suspend()

    expect(account.updatedAt).toEqual(new Date('2026-06-20T12:05:00.000Z'))
  })

  it('updates and normalizes the display name', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    account.updateDisplayName('  Andy Pierce  ')

    expect(account.displayName).toBe('Andy Pierce')
  })

  it('updates the management URL', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    account.updateManagementUrl('  https://github.com/settings/profile  ')

    expect(account.managementUrl).toBe('https://github.com/settings/profile')
  })

  it('clears the management URL when null is provided', () => {
    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
      managementUrl: 'https://github.com/settings/profile',
    })

    account.updateManagementUrl(null)

    expect(account.managementUrl).toBeNull()
  })

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const account = new UserAccountEntity({
      userId: 'user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy',
    })

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    account.softDelete()

    expect(account.isDeleted).toBe(true)
    expect(account.deletedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(account.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })
})
