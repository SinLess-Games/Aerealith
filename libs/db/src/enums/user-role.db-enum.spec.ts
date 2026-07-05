// libs/db/src/enums/user-role.db-enum.spec.ts

import { UserRole } from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import { userRoleDbEnum } from './user-role.db-enum'

describe('userRoleDbEnum', () => {
  it('matches the core user role values', () => {
    expect(userRoleDbEnum.enumValues).toEqual(Object.values(UserRole))
  })
})
