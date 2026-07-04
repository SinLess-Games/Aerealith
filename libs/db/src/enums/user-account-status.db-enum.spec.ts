// libs/db/src/enums/user-account-status.db-enum.spec.ts

import type { UserAccountStatus } from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import {
  userAccountStatusDbEnum,
  userAccountStatusDbValues,
} from './user-account-status.db-enum'

describe('userAccountStatusDbEnum', () => {
  it('matches the supported user account status values', () => {
    expect(userAccountStatusDbEnum.enumValues).toEqual(
      userAccountStatusDbValues,
    )
  })

  it('contains only valid core user account statuses', () => {
    const statuses: readonly UserAccountStatus[] = userAccountStatusDbValues

    expect(statuses).toEqual(['active', 'revoked', 'suspended', 'expired'])
  })
})
