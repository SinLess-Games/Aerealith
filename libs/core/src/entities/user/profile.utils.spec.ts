import { describe, expect, it } from 'vitest'

import {
  normalizeUserProfileHandle,
  normalizeUserProfileOptionalString,
} from './profile.utils'

describe('profile normalization helpers', () => {
  it('trims and lowercases handles', () => {
    expect(normalizeUserProfileHandle('  Andy_Pierce  ')).toBe('andy_pierce')
  })

  it('trims optional strings and converts empty values to null', () => {
    expect(normalizeUserProfileOptionalString('  Andy Pierce  ')).toBe(
      'Andy Pierce',
    )
    expect(normalizeUserProfileOptionalString('   ')).toBeNull()
    expect(normalizeUserProfileOptionalString(null)).toBeNull()
  })
})
