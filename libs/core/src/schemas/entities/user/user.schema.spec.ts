// libs/core/src/schemas/entities/user/user.schema.spec.ts

import { describe, expect, it } from 'vitest'

import { UserLifecycleStatus } from '../../../entities/user/user.entity'
import {
  DefaultUserRole,
  DefaultUserTier,
  UserRole,
  UserTier,
} from '../../../enumns'
import {
  CreateUserEntitySchema,
  PasswordHashSchema,
  PublicUserEntitySchema,
  UpdateUserEntitySchema,
  UserEmailSchema,
  UserEntitySchema,
  UserIdSchema,
  UserLifecycleStatusSchema,
  UserMetadataSchema,
  UserRoleSchema,
  UserTierSchema,
  UsernameSchema,
} from './user.schema'

const userId = '550e8400-e29b-41d4-a716-446655440000'

describe('user field schemas', () => {
  it('accepts a valid user ID', () => {
    const result = UserIdSchema.safeParse(userId)

    expect(result.success).toBe(true)
  })

  it('rejects an invalid user ID', () => {
    const result = UserIdSchema.safeParse('not-a-uuid')

    expect(result.success).toBe(false)
  })

  it('normalizes a valid username', () => {
    const result = UsernameSchema.safeParse('  Andy_Pierce  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('andy_pierce')
    }
  })

  it('rejects a username shorter than three characters', () => {
    const result = UsernameSchema.safeParse('ab')

    expect(result.success).toBe(false)
  })

  it('rejects a username with unsupported characters', () => {
    const result = UsernameSchema.safeParse('andy pierce')

    expect(result.success).toBe(false)
  })

  it('normalizes a valid user email address', () => {
    const result = UserEmailSchema.safeParse('  Andy@Example.COM  ')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe('andy@example.com')
    }
  })

  it('rejects an invalid user email address', () => {
    const result = UserEmailSchema.safeParse('not-an-email')

    expect(result.success).toBe(false)
  })

  it('accepts a non-empty password hash', () => {
    const result = PasswordHashSchema.safeParse('hashed-password-value')

    expect(result.success).toBe(true)
  })

  it('rejects an empty password hash', () => {
    const result = PasswordHashSchema.safeParse('')

    expect(result.success).toBe(false)
  })

  it('accepts JSON-compatible user metadata', () => {
    const result = UserMetadataSchema.safeParse({
      source: 'waitlist',
      invitedBy: 'admin-id',
      flags: ['early-access'],
      settings: {
        enabled: true,
      },
    })

    expect(result.success).toBe(true)
  })
})

describe('user enum schemas', () => {
  it('accepts every user lifecycle status', () => {
    for (const status of Object.values(UserLifecycleStatus)) {
      expect(UserLifecycleStatusSchema.safeParse(status).success).toBe(true)
    }
  })

  it('rejects an unsupported user lifecycle status', () => {
    const result = UserLifecycleStatusSchema.safeParse('deleted')

    expect(result.success).toBe(false)
  })

  it('accepts every user role', () => {
    for (const role of Object.values(UserRole)) {
      expect(UserRoleSchema.safeParse(role).success).toBe(true)
    }
  })

  it('rejects an unsupported user role', () => {
    const result = UserRoleSchema.safeParse('owner')

    expect(result.success).toBe(false)
  })

  it('accepts every user tier', () => {
    for (const tier of Object.values(UserTier)) {
      expect(UserTierSchema.safeParse(tier).success).toBe(true)
    }
  })

  it('rejects an unsupported user tier', () => {
    const result = UserTierSchema.safeParse('enterprise')

    expect(result.success).toBe(false)
  })
})

describe('CreateUserEntitySchema', () => {
  it('accepts minimum valid user creation input', () => {
    const result = CreateUserEntitySchema.safeParse({
      username: '  Andy_Pierce  ',
      email: '  Andy@Example.COM  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        username: 'andy_pierce',
        email: 'andy@example.com',
      })
    }
  })

  it('accepts complete user creation input', () => {
    const verifiedAt = new Date('2026-06-20T12:00:00.000Z')

    const result = CreateUserEntitySchema.safeParse({
      username: '  Andy_Pierce  ',
      email: '  Andy@Example.COM  ',
      passwordHash: 'hashed-password-value',

      status: UserLifecycleStatus.Suspended,
      emailVerified: true,
      emailVerifiedAt: verifiedAt,

      role: UserRole.Admin,
      tier: UserTier.Pro,

      metadata: {
        source: 'waitlist',
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        username: 'andy_pierce',
        email: 'andy@example.com',
        passwordHash: 'hashed-password-value',

        status: UserLifecycleStatus.Suspended,
        emailVerified: true,
        emailVerifiedAt: verifiedAt,

        role: UserRole.Admin,
        tier: UserTier.Pro,

        metadata: {
          source: 'waitlist',
        },
      })
    }
  })

  it('accepts a nullable password hash', () => {
    const result = CreateUserEntitySchema.safeParse({
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.passwordHash).toBeNull()
    }
  })

  it('rejects invalid creation input', () => {
    const result = CreateUserEntitySchema.safeParse({
      username: 'a!',
      email: 'not-an-email',
      passwordHash: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid role during creation', () => {
    const result = CreateUserEntitySchema.safeParse({
      username: 'andy',
      email: 'andy@example.com',
      role: 'owner',
    })

    expect(result.success).toBe(false)
  })
})

describe('UpdateUserEntitySchema', () => {
  it('accepts a partial internal user update', () => {
    const result = UpdateUserEntitySchema.safeParse({
      username: '  Andy_Pierce  ',
      email: '  Updated@Example.COM  ',
      status: UserLifecycleStatus.Disabled,
      role: UserRole.Admin,
      tier: UserTier.Pro,
      metadata: {
        migrated: true,
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        username: 'andy_pierce',
        email: 'updated@example.com',
        status: UserLifecycleStatus.Disabled,
        role: UserRole.Admin,
        tier: UserTier.Pro,
        metadata: {
          migrated: true,
        },
      })
    }
  })

  it('accepts an empty internal user update', () => {
    const result = UpdateUserEntitySchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('does not accept password-hash changes through general updates', () => {
    const result = UpdateUserEntitySchema.safeParse({
      passwordHash: 'new-password-hash',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).not.toHaveProperty('passwordHash')
    }
  })

  it('does not accept email verification changes through general updates', () => {
    const result = UpdateUserEntitySchema.safeParse({
      emailVerified: true,
      emailVerifiedAt: new Date('2026-06-20T12:00:00.000Z'),
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).not.toHaveProperty('emailVerified')
      expect(result.data).not.toHaveProperty('emailVerifiedAt')
    }
  })

  it('rejects invalid update values', () => {
    const result = UpdateUserEntitySchema.safeParse({
      status: 'deleted',
    })

    expect(result.success).toBe(false)
  })
})

describe('UserEntitySchema', () => {
  it('accepts a complete internal user entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:10:00.000Z')
    const emailVerifiedAt = new Date('2026-06-20T12:05:00.000Z')

    const result = UserEntitySchema.safeParse({
      id: userId,
      username: '  Andy_Pierce  ',
      email: '  Andy@Example.COM  ',
      passwordHash: 'hashed-password-value',

      status: UserLifecycleStatus.Active,
      emailVerified: true,
      emailVerifiedAt,

      role: UserRole.Admin,
      tier: UserTier.Pro,

      metadata: {
        source: 'waitlist',
      },

      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toBe(userId)
      expect(result.data.username).toBe('andy_pierce')
      expect(result.data.email).toBe('andy@example.com')
      expect(result.data.passwordHash).toBe('hashed-password-value')

      expect(result.data.status).toBe(UserLifecycleStatus.Active)
      expect(result.data.emailVerified).toBe(true)
      expect(result.data.emailVerifiedAt).toEqual(emailVerifiedAt)

      expect(result.data.role).toBe(UserRole.Admin)
      expect(result.data.tier).toBe(UserTier.Pro)

      expect(result.data.metadata).toEqual({
        source: 'waitlist',
      })

      expect(result.data.createdAt).toEqual(createdAt)
      expect(result.data.updatedAt).toEqual(updatedAt)
      expect(result.data.deletedAt).toBeNull()
    }
  })

  it('accepts nullable internal user fields', () => {
    const result = UserEntitySchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: null,

      status: UserLifecycleStatus.Active,
      emailVerified: false,
      emailVerifiedAt: null,

      role: DefaultUserRole,
      tier: DefaultUserTier,

      metadata: {},

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(true)
  })

  it('accepts a soft-deleted user entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z')

    const result = UserEntitySchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password-value',

      status: UserLifecycleStatus.Disabled,
      emailVerified: false,
      emailVerifiedAt: null,

      role: DefaultUserRole,
      tier: DefaultUserTier,

      metadata: {},

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid user entity ID', () => {
    const result = UserEntitySchema.safeParse({
      id: 'not-a-uuid',
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password-value',

      status: UserLifecycleStatus.Active,
      emailVerified: false,
      emailVerifiedAt: null,

      role: DefaultUserRole,
      tier: DefaultUserTier,

      metadata: {},

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an entity missing required fields', () => {
    const result = UserEntitySchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
    })

    expect(result.success).toBe(false)
  })
})

describe('PublicUserEntitySchema', () => {
  it('returns user data without the password hash', () => {
    const result = PublicUserEntitySchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',
      passwordHash: 'hashed-password-value',

      status: UserLifecycleStatus.Active,
      emailVerified: false,
      emailVerifiedAt: null,

      role: DefaultUserRole,
      tier: DefaultUserTier,

      metadata: {},

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).not.toHaveProperty('passwordHash')
      expect(result.data).toMatchObject({
        id: userId,
        username: 'andy',
        email: 'andy@example.com',
        status: UserLifecycleStatus.Active,
        emailVerified: false,
      })
    }
  })

  it('accepts a public user without a password hash field', () => {
    const result = PublicUserEntitySchema.safeParse({
      id: userId,
      username: 'andy',
      email: 'andy@example.com',

      status: UserLifecycleStatus.Active,
      emailVerified: false,
      emailVerifiedAt: null,

      role: DefaultUserRole,
      tier: DefaultUserTier,

      metadata: {},

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(true)
  })
})
