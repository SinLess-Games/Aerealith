// libs/core/src/schemas/entities/user/settings.schema.spec.ts

import { describe, expect, it } from 'vitest'

import {
  CreateUserSettingsEntitySchema,
  UpdateUserSettingsContractSchema,
  UpdateUserSettingsEntitySchema,
  UserAccessibilitySettingsSchema,
  UserAppearanceSettingsSchema,
  UserCommunicationSettingsSchema,
  UserNotificationSettingsSchema,
  UserPrivacySettingsSchema,
  UserSecuritySettingsSchema,
  UserSettingsContractSchema,
  UserSettingsEntitySchema,
  UserSettingsIdSchema,
  UserSettingsMetadataSchema,
  UserSettingsSchemaVersionSchema,
  UserSettingsTextScaleSchema,
  UserSettingsThemeSchema,
} from './settings.schema'

const settingsId = '550e8400-e29b-41d4-a716-446655440000'
const userId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

describe('UserSettingsIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = UserSettingsIdSchema.safeParse(settingsId)

    expect(result.success).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    const result = UserSettingsIdSchema.safeParse('not-a-uuid')

    expect(result.success).toBe(false)
  })
})

describe('user settings primitive schemas', () => {
  it('accepts a valid settings schema version', () => {
    const result = UserSettingsSchemaVersionSchema.safeParse(1)

    expect(result.success).toBe(true)
  })

  it('rejects a settings schema version lower than one', () => {
    const result = UserSettingsSchemaVersionSchema.safeParse(0)

    expect(result.success).toBe(false)
  })

  it('rejects a non-integer settings schema version', () => {
    const result = UserSettingsSchemaVersionSchema.safeParse(1.5)

    expect(result.success).toBe(false)
  })

  it('accepts a valid text scale', () => {
    const result = UserSettingsTextScaleSchema.safeParse(1.25)

    expect(result.success).toBe(true)
  })

  it('accepts the minimum text scale', () => {
    const result = UserSettingsTextScaleSchema.safeParse(0.5)

    expect(result.success).toBe(true)
  })

  it('accepts the maximum text scale', () => {
    const result = UserSettingsTextScaleSchema.safeParse(2)

    expect(result.success).toBe(true)
  })

  it('rejects a text scale lower than the supported minimum', () => {
    const result = UserSettingsTextScaleSchema.safeParse(0.49)

    expect(result.success).toBe(false)
  })

  it('rejects a text scale higher than the supported maximum', () => {
    const result = UserSettingsTextScaleSchema.safeParse(2.01)

    expect(result.success).toBe(false)
  })

  it('accepts every supported theme', () => {
    for (const theme of ['system', 'light', 'dark']) {
      const result = UserSettingsThemeSchema.safeParse(theme)

      expect(result.success).toBe(true)
    }
  })

  it('rejects an unsupported theme', () => {
    const result = UserSettingsThemeSchema.safeParse('midnight')

    expect(result.success).toBe(false)
  })
})

describe('UserSettingsMetadataSchema', () => {
  it('accepts valid settings metadata', () => {
    const result = UserSettingsMetadataSchema.safeParse({
      schemaVersion: 1,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        schemaVersion: 1,
      })
    }
  })

  it('rejects metadata without a schema version', () => {
    const result = UserSettingsMetadataSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})

describe('user settings group schemas', () => {
  it('accepts valid accessibility settings', () => {
    const result = UserAccessibilitySettingsSchema.safeParse({
      reduceMotion: true,
      highContrast: false,
      textScale: 1.25,
    })

    expect(result.success).toBe(true)
  })

  it('rejects incomplete accessibility settings', () => {
    const result = UserAccessibilitySettingsSchema.safeParse({
      reduceMotion: true,
    })

    expect(result.success).toBe(false)
  })

  it('accepts valid appearance settings', () => {
    const result = UserAppearanceSettingsSchema.safeParse({
      theme: 'dark',
      compactMode: true,
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid communication settings', () => {
    const result = UserCommunicationSettingsSchema.safeParse({
      progressUpdates: true,
      quietMode: false,
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid notification settings', () => {
    const result = UserNotificationSettingsSchema.safeParse({
      email: true,
      push: false,
      productUpdates: true,
      securityAlerts: true,
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid privacy settings', () => {
    const result = UserPrivacySettingsSchema.safeParse({
      analytics: false,
      personalization: true,
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid security settings', () => {
    const result = UserSecuritySettingsSchema.safeParse({
      mfaEnabled: true,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid values within a settings group', () => {
    const result = UserAppearanceSettingsSchema.safeParse({
      theme: 'purple',
      compactMode: false,
    })

    expect(result.success).toBe(false)
  })
})

describe('CreateUserSettingsEntitySchema', () => {
  it('accepts the minimum valid settings creation input', () => {
    const result = CreateUserSettingsEntitySchema.safeParse({
      userId,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        userId,
      })
    }
  })

  it('accepts partial settings groups during creation', () => {
    const result = CreateUserSettingsEntitySchema.safeParse({
      userId,
      metadata: {
        schemaVersion: 1,
      },
      accessibility: {
        reduceMotion: true,
      },
      appearance: {
        theme: 'dark',
      },
      communication: {
        quietMode: true,
      },
      notifications: {
        push: true,
      },
      privacy: {
        analytics: true,
      },
      security: {
        mfaEnabled: true,
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        userId,
        metadata: {
          schemaVersion: 1,
        },
        accessibility: {
          reduceMotion: true,
        },
        appearance: {
          theme: 'dark',
        },
        communication: {
          quietMode: true,
        },
        notifications: {
          push: true,
        },
        privacy: {
          analytics: true,
        },
        security: {
          mfaEnabled: true,
        },
      })
    }
  })

  it('rejects an invalid user ID', () => {
    const result = CreateUserSettingsEntitySchema.safeParse({
      userId: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid partial group values during creation', () => {
    const result = CreateUserSettingsEntitySchema.safeParse({
      userId,
      appearance: {
        theme: 'purple',
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid text scale during creation', () => {
    const result = CreateUserSettingsEntitySchema.safeParse({
      userId,
      accessibility: {
        textScale: 10,
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('UpdateUserSettingsEntitySchema', () => {
  it('accepts a partial settings update', () => {
    const result = UpdateUserSettingsEntitySchema.safeParse({
      accessibility: {
        reduceMotion: true,
      },
      appearance: {
        theme: 'light',
      },
      notifications: {
        push: true,
      },
      privacy: {
        personalization: false,
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        accessibility: {
          reduceMotion: true,
        },
        appearance: {
          theme: 'light',
        },
        notifications: {
          push: true,
        },
        privacy: {
          personalization: false,
        },
      })
    }
  })

  it('accepts an empty settings update', () => {
    const result = UpdateUserSettingsEntitySchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('rejects an invalid settings update', () => {
    const result = UpdateUserSettingsEntitySchema.safeParse({
      accessibility: {
        textScale: 0,
      },
    })

    expect(result.success).toBe(false)
  })

  it('does not allow metadata updates', () => {
    const result = UpdateUserSettingsEntitySchema.safeParse({
      metadata: {
        schemaVersion: 2,
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).not.toHaveProperty('metadata')
    }
  })
})

describe('UserSettingsEntitySchema', () => {
  it('accepts a complete internal settings entity', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:10:00.000Z')

    const result = UserSettingsEntitySchema.safeParse({
      id: settingsId,
      userId,

      metadata: {
        schemaVersion: 1,
      },

      accessibility: {
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      },

      appearance: {
        theme: 'system',
        compactMode: false,
      },

      communication: {
        progressUpdates: true,
        quietMode: false,
      },

      notifications: {
        email: true,
        push: false,
        productUpdates: true,
        securityAlerts: true,
      },

      privacy: {
        analytics: false,
        personalization: true,
      },

      security: {
        mfaEnabled: false,
      },

      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toBe(settingsId)
      expect(result.data.userId).toBe(userId)
      expect(result.data.createdAt).toEqual(createdAt)
      expect(result.data.updatedAt).toEqual(updatedAt)
      expect(result.data.deletedAt).toBeNull()
    }
  })

  it('accepts a soft-deleted settings entity', () => {
    const deletedAt = new Date('2026-06-20T12:20:00.000Z')

    const result = UserSettingsEntitySchema.safeParse({
      id: settingsId,
      userId,

      metadata: {
        schemaVersion: 1,
      },

      accessibility: {
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      },

      appearance: {
        theme: 'dark',
        compactMode: false,
      },

      communication: {
        progressUpdates: true,
        quietMode: false,
      },

      notifications: {
        email: true,
        push: false,
        productUpdates: true,
        securityAlerts: true,
      },

      privacy: {
        analytics: false,
        personalization: true,
      },

      security: {
        mfaEnabled: false,
      },

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: deletedAt,
      deletedAt,
    })

    expect(result.success).toBe(true)
  })

  it('rejects an entity missing required settings groups', () => {
    const result = UserSettingsEntitySchema.safeParse({
      id: settingsId,
      userId,
      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an entity with an invalid settings ID', () => {
    const result = UserSettingsEntitySchema.safeParse({
      id: 'not-a-uuid',
      userId,

      metadata: {
        schemaVersion: 1,
      },

      accessibility: {
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      },

      appearance: {
        theme: 'system',
        compactMode: false,
      },

      communication: {
        progressUpdates: true,
        quietMode: false,
      },

      notifications: {
        email: true,
        push: false,
        productUpdates: true,
        securityAlerts: true,
      },

      privacy: {
        analytics: false,
        personalization: true,
      },

      security: {
        mfaEnabled: false,
      },

      createdAt: new Date('2026-06-20T12:00:00.000Z'),
      updatedAt: new Date('2026-06-20T12:10:00.000Z'),
      deletedAt: null,
    })

    expect(result.success).toBe(false)
  })
})

describe('UserSettingsContractSchema', () => {
  it('accepts a complete serialized settings contract', () => {
    const result = UserSettingsContractSchema.safeParse({
      id: settingsId,
      userId,

      metadata: {
        schemaVersion: 1,
      },

      accessibility: {
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      },

      appearance: {
        theme: 'dark',
        compactMode: true,
      },

      communication: {
        progressUpdates: true,
        quietMode: false,
      },

      notifications: {
        email: true,
        push: false,
        productUpdates: false,
        securityAlerts: true,
      },

      privacy: {
        analytics: true,
        personalization: false,
      },

      security: {
        mfaEnabled: true,
      },

      createdAt: '2026-06-20T12:00:00.000Z',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        id: settingsId,
        userId,

        metadata: {
          schemaVersion: 1,
        },

        accessibility: {
          reduceMotion: false,
          highContrast: false,
          textScale: 1,
        },

        appearance: {
          theme: 'dark',
          compactMode: true,
        },

        communication: {
          progressUpdates: true,
          quietMode: false,
        },

        notifications: {
          email: true,
          push: false,
          productUpdates: false,
          securityAlerts: true,
        },

        privacy: {
          analytics: true,
          personalization: false,
        },

        security: {
          mfaEnabled: true,
        },

        createdAt: '2026-06-20T12:00:00.000Z',
        updatedAt: '2026-06-20T12:10:00.000Z',
      })
    }
  })

  it('rejects a contract with an invalid serialized timestamp', () => {
    const result = UserSettingsContractSchema.safeParse({
      id: settingsId,
      userId,

      metadata: {
        schemaVersion: 1,
      },

      accessibility: {
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      },

      appearance: {
        theme: 'system',
        compactMode: false,
      },

      communication: {
        progressUpdates: true,
        quietMode: false,
      },

      notifications: {
        email: true,
        push: false,
        productUpdates: true,
        securityAlerts: true,
      },

      privacy: {
        analytics: false,
        personalization: true,
      },

      security: {
        mfaEnabled: false,
      },

      createdAt: 'not-a-timestamp',
      updatedAt: '2026-06-20T12:10:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})

describe('UpdateUserSettingsContractSchema', () => {
  it('uses the same validation rules as the entity update schema', () => {
    const result = UpdateUserSettingsContractSchema.safeParse({
      appearance: {
        theme: 'dark',
      },
      security: {
        mfaEnabled: true,
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toEqual({
        appearance: {
          theme: 'dark',
        },
        security: {
          mfaEnabled: true,
        },
      })
    }
  })

  it('rejects invalid contract update values', () => {
    const result = UpdateUserSettingsContractSchema.safeParse({
      appearance: {
        theme: 'not-a-theme',
      },
    })

    expect(result.success).toBe(false)
  })
})
