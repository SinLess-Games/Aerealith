// libs/utils/src/ui/a11y.spec.ts

import { describe, expect, it } from 'vitest'

import {
  joinAriaIds,
  requireAccessibleLabel,
  toAriaBoolean,
  toAriaChecked,
} from './a11y'

describe('joinAriaIds', () => {
  it('returns undefined when no valid IDs are provided', () => {
    expect(joinAriaIds()).toBeUndefined()
    expect(joinAriaIds(undefined, null, false, '')).toBeUndefined()
    expect(joinAriaIds('   ')).toBeUndefined()
  })

  it('joins valid IDs with spaces', () => {
    expect(joinAriaIds('email-description', 'email-error')).toBe(
      'email-description email-error',
    )
  })

  it('trims whitespace around IDs', () => {
    expect(joinAriaIds('  email-description  ', '  email-error ')).toBe(
      'email-description email-error',
    )
  })

  it('splits whitespace-separated ID lists', () => {
    expect(joinAriaIds('email-description email-hint', 'email-error')).toBe(
      'email-description email-hint email-error',
    )
  })

  it('removes duplicate IDs while preserving insertion order', () => {
    expect(
      joinAriaIds(
        'email-description',
        'email-error',
        'email-description',
        'email-error email-hint',
      ),
    ).toBe('email-description email-error email-hint')
  })

  it('ignores null, undefined, and false values', () => {
    expect(
      joinAriaIds('email-description', null, undefined, false, 'email-error'),
    ).toBe('email-description email-error')
  })
})

describe('toAriaBoolean', () => {
  it('returns true for true', () => {
    expect(toAriaBoolean(true)).toBe('true')
  })

  it('returns false for false', () => {
    expect(toAriaBoolean(false)).toBe('false')
  })

  it('returns undefined for null and undefined', () => {
    expect(toAriaBoolean(null)).toBeUndefined()
    expect(toAriaBoolean(undefined)).toBeUndefined()
  })
})

describe('toAriaChecked', () => {
  it('returns true for a checked value', () => {
    expect(toAriaChecked(true)).toBe('true')
  })

  it('returns false for an unchecked value', () => {
    expect(toAriaChecked(false)).toBe('false')
  })

  it('returns mixed for an indeterminate value', () => {
    expect(toAriaChecked('mixed')).toBe('mixed')
  })

  it('returns undefined for null and undefined', () => {
    expect(toAriaChecked(null)).toBeUndefined()
    expect(toAriaChecked(undefined)).toBeUndefined()
  })
})

describe('requireAccessibleLabel', () => {
  it('returns a trimmed accessible label', () => {
    expect(requireAccessibleLabel(' Open navigation menu ')).toBe(
      'Open navigation menu',
    )
  })

  it('throws for an empty label', () => {
    expect(() => requireAccessibleLabel('')).toThrow(
      'Accessible controls must include a non-empty label for assistive technologies.',
    )
  })

  it('throws for a whitespace-only label', () => {
    expect(() => requireAccessibleLabel('   ')).toThrow(
      'Accessible controls must include a non-empty label for assistive technologies.',
    )
  })
})
