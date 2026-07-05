// libs/core/src/errors/error-code.spec.ts

import { describe, expect, it } from 'vitest'

import {
  AuthErrorCode,
  CommonErrorCode,
  DatabaseErrorCode,
  UserErrorCode,
} from '../enumns'
import { ErrorCodeValues, isErrorCode } from './error-code'

describe('ErrorCodeValues', () => {
  it('includes all supported auth error codes', () => {
    expect(ErrorCodeValues).toEqual(
      expect.arrayContaining(Object.values(AuthErrorCode)),
    )
  })

  it('includes all supported common error codes', () => {
    expect(ErrorCodeValues).toEqual(
      expect.arrayContaining(Object.values(CommonErrorCode)),
    )
  })

  it('includes all supported database error codes', () => {
    expect(ErrorCodeValues).toEqual(
      expect.arrayContaining(Object.values(DatabaseErrorCode)),
    )
  })

  it('includes all supported user error codes', () => {
    expect(ErrorCodeValues).toEqual(
      expect.arrayContaining(Object.values(UserErrorCode)),
    )
  })
})

describe('isErrorCode', () => {
  it('returns true for every configured error code', () => {
    for (const errorCode of ErrorCodeValues) {
      expect(isErrorCode(errorCode)).toBe(true)
    }
  })

  it('returns true for a valid common error code', () => {
    expect(isErrorCode(CommonErrorCode.INTERNAL_ERROR)).toBe(true)
  })

  it('returns true for a valid auth error code', () => {
    const [errorCode] = Object.values(AuthErrorCode)

    expect(isErrorCode(errorCode)).toBe(true)
  })

  it('returns true for a valid database error code', () => {
    const [errorCode] = Object.values(DatabaseErrorCode)

    expect(isErrorCode(errorCode)).toBe(true)
  })

  it('returns true for a valid user error code', () => {
    const [errorCode] = Object.values(UserErrorCode)

    expect(isErrorCode(errorCode)).toBe(true)
  })

  it('returns false for an unknown string', () => {
    expect(isErrorCode('NOT_A_REAL_ERROR_CODE')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isErrorCode('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isErrorCode(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isErrorCode(undefined)).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isErrorCode(500)).toBe(false)
    expect(isErrorCode({ code: CommonErrorCode.INTERNAL_ERROR })).toBe(false)
    expect(isErrorCode([])).toBe(false)
  })
})
