// libs/db/src/enums/user-lifecycle-status.db-enum.spec.ts

import { UserLifecycleStatus } from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import { userLifecycleStatusDbEnum } from './user-lifecycle-status.db-enum'

describe('userLifecycleStatusDbEnum', () => {
  it('matches the core user lifecycle status values', () => {
    expect(userLifecycleStatusDbEnum.enumValues).toEqual(
      Object.values(UserLifecycleStatus),
    )
  })
})
