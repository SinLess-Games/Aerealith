import { describe, expect, it } from 'vitest'
import { defaultAccessibilityPreferences } from './accessibility-preferences'
describe('defaultAccessibilityPreferences', () => {
  it('uses system-friendly defaults', () => {
    expect(defaultAccessibilityPreferences).toEqual({
      contrast: 'system',
      motion: 'system',
      reading: 'default',
    })
  })
})
