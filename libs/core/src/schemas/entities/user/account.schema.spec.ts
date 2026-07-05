// libs/core/src/schemas/entities/user/account.schema.spec.ts

import { describe, expect, it } from 'vitest'

import {
  CreateUserAccountEntitySchema,
  UpdateUserAccountEntitySchema,
  UserAccountContractSchema,
  UserAccountDisplayNameSchema,
  UserAccountEntitySchema,
  UserAccountIdSchema,
  UserAccountManagementUrlSchema,
  UserAccountProviderIdSchema,
  UserAccountProviderSchema,
  UserAccountStatusSchema,
  UserAccountStatusValues,
} from './account.schema'

const userId = '550e8400-e29b-41d4-a716-446655440000'
const accountId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

describe('UserAccountIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = UserAccountIdSchema.safeParse(accountId)

    expect(result.success).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    const result = UserAccountIdSchema.safeParse('not-a-uuid')

    expect(result.success).toBe(false)
  })
})

describe('UserAccountProviderSchema', () => {
  it('normalizes a provider name', () => {
    const result = UserAccountProviderSchema.safeParse('  GitHub  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('github')
    }
  })

  it('rejects an empty provider name', () => {
    const result = UserAccountProviderSchema.safeParse('   ')

    expect(result.success).toBe(false)
  })

  it('rejects a provider name longer than one hundred characters', () => {
    const result = UserAccountProviderSchema.safeParse('a'.repeat(101))

    expect(result.success).toBe(false)
  })
})

describe('UserAccountProviderIdSchema', () => {
  it('trims a provider account ID', () => {
    const result = UserAccountProviderIdSchema.safeParse(
      '  github-account-id  ',
    )

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('github-account-id')
    }
  })

  it('rejects an empty provider account ID', () => {
    const result = UserAccountProviderIdSchema.safeParse('   ')

    expect(result.success).toBe(false)
  })
})

describe('UserAccountDisplayNameSchema', () => {
  it('trims a linked account display name', () => {
    const result = UserAccountDisplayNameSchema.safeParse('  Andy Pierce  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('Andy Pierce')
    }
  })

  it('rejects an empty display name', () => {
    const result = UserAccountDisplayNameSchema.safeParse('   ')

    expect(result.success).toBe(false)
  })
})

describe('UserAccountManagementUrlSchema', () => {
  it('trims and accepts a valid management URL', () => {
    const result = UserAccountManagementUrlSchema.safeParse(
      '  https://github.com/settings/profile  ',
    )

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('https://github.com/settings/profile')
    }
  })

  it('rejects an invalid management URL', () => {
    const result = UserAccountManagementUrlSchema.safeParse('not-a-url')

    expect(result.success).toBe(false)
  })
})

describe('UserAccountStatusSchema', () => {
  it('accepts every supported account status', () => {
    for (const status of UserAccountStatusValues) {
      const result = UserAccountStatusSchema.safeParse(status)

      expect(result.success).toBe(true)
    }
  })

  it('rejects an unsupported account status', () => {
    const result = UserAccountStatusSchema.safeParse('pending')

    expect(result.success).toBe(false)
  })
})

describe('CreateUserAccountEntitySchema', () => {
  it('accepts and normalizes valid linked account input', () => {
    const result = CreateUserAccountEntitySchema.safeParse({
      userId,
      provider: '  GitHub  ',
      accountId: '  github-account-id  ',
      displayName: '  Andy Pierce  ',
      managementUrl: '  https://github.com/settings/profile  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        provider: 'github',
        accountId: 'github-account-id',
        displayName: 'Andy Pierce',
        managementUrl: 'https://github.com/settings/profile',
      })
    }
  })

  it('accepts optional account fields', () => {
    const connectedAt = new Date('2026-06-20T12:00:00.000Z')

    const result = CreateUserAccountEntitySchema.safeParse({
      userId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'suspended',
      connectedAt,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.managementUrl).toBeNull()
      expect(result.data.status).toBe('suspended')
      expect(result.data.connectedAt).toEqual(connectedAt)
    }
  })

  it('rejects an invalid user ID', () => {
    const result = CreateUserAccountEntitySchema.safeParse({
      userId: 'invalid-user-id',
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid account status', () => {
    const result = CreateUserAccountEntitySchema.safeParse({
      userId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      status: 'pending',
    })

    expect(result.success).toBe(false)
  })
})

describe('UpdateUserAccountEntitySchema', () => {
  it('accepts a display-name update', () => {
    const result = UpdateUserAccountEntitySchema.safeParse({
      displayName: '  Andy Pierce  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        displayName: 'Andy Pierce',
      })
    }
  })

  it('accepts clearing the management URL', () => {
    const result = UpdateUserAccountEntitySchema.safeParse({
      managementUrl: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.managementUrl).toBeNull()
    }
  })

  it('accepts an account-status update', () => {
    const result = UpdateUserAccountEntitySchema.safeParse({
      status: 'revoked',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.status).toBe('revoked')
    }
  })

  it('rejects an invalid management URL', () => {
    const result = UpdateUserAccountEntitySchema.safeParse({
      managementUrl: 'not-a-url',
    })

    expect(result.success).toBe(false)
  })
})

describe('UserAccountEntitySchema', () => {
  it('accepts a valid internal linked account entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:10:00.000Z')
    const connectedAt = new Date('2026-06-20T12:05:00.000Z')

    const result = UserAccountEntitySchema.safeParse({
      id: accountId,
      userId,
      provider: '  GitHub  ',
      accountId: '  github-account-id  ',
      displayName: '  Andy Pierce  ',
      managementUrl: '  https://github.com/settings/profile  ',
      status: 'active',
      connectedAt,
      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.provider).toBe('github')
      expect(result.data.accountId).toBe('github-account-id')
      expect(result.data.displayName).toBe('Andy Pierce')
      expect(result.data.managementUrl).toBe(
        'https://github.com/settings/profile',
      )
      expect(result.data.connectedAt).toEqual(connectedAt)
      expect(result.data.deletedAt).toBeNull()
    }
  })

  it('accepts a soft-deleted linked account entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z')

    const result = UserAccountEntitySchema.safeParse({
      id: accountId,
      userId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'revoked',
      connectedAt: new Date('2026-06-20T12:00:00.000Z'),
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    })

    expect(result.success).toBe(true)
  })

  it('rejects an entity with an invalid account ID', () => {
    const result = UserAccountEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'active',
      connectedAt: new Date('2026-06-20T12:00:00.000Z'),
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an entity missing required timestamps', () => {
    const result = UserAccountEntitySchema.safeParse({
      id: accountId,
      userId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'active',
    })

    expect(result.success).toBe(false)
  })
})

describe('UserAccountContractSchema', () => {
  it('accepts a valid linked-account contract', () => {
    const result = UserAccountContractSchema.safeParse({
      id: accountId,
      provider: '  GitHub  ',
      displayName: '  Andy Pierce  ',
      managementUrl: '  https://github.com/settings/profile  ',
      status: 'active',
      connectedAt: '2026-06-20T12:05:00.000Z',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        id: accountId,
        provider: 'github',
        displayName: 'Andy Pierce',
        managementUrl: 'https://github.com/settings/profile',
        status: 'active',
        connectedAt: '2026-06-20T12:05:00.000Z',
        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      })
    }
  })

  it('accepts a null management URL in the contract', () => {
    const result = UserAccountContractSchema.safeParse({
      id: accountId,
      provider: 'github',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'active',
      connectedAt: '2026-06-20T12:05:00.000Z',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('does not expose the provider account ID', () => {
    const result = UserAccountContractSchema.safeParse({
      id: accountId,
      provider: 'github',
      accountId: 'github-account-id',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'active',
      connectedAt: '2026-06-20T12:05:00.000Z',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).not.toHaveProperty('accountId')
    }
  })

  it('rejects an invalid serialized timestamp', () => {
    const result = UserAccountContractSchema.safeParse({
      id: accountId,
      provider: 'github',
      displayName: 'Andy Pierce',
      managementUrl: null,
      status: 'active',
      connectedAt: 'not-a-timestamp',
      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})
