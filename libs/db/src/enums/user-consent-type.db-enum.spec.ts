// libs/db/src/enums/user-consent-type.db-enum.spec.ts

import { UserConsentType } from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import { userConsentTypeDbEnum } from './user-consent-type.db-enum'

describe('userConsentTypeDbEnum', () => {
  it('matches the core user consent type values', () => {
    expect(userConsentTypeDbEnum.enumValues).toEqual(
      Object.values(UserConsentType),
    )
  })
})
