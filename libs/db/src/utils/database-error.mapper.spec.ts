// libs/db/src/utils/database-error.mapper.spec.ts

import {
  AerealithError,
  CommonErrorCode,
  HttpErrorCode,
} from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import { mapDatabaseError } from './database-error.mapper'

describe('mapDatabaseError', () => {
  it('maps PostgreSQL unique constraint errors to a conflict error', () => {
    const error = mapDatabaseError({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    })

    expect(error).toBeInstanceOf(AerealithError)
    expect(error.code).toBe(CommonErrorCode.CONFLICT)
    expect(error.statusCode).toBe(HttpErrorCode.CONFLICT.statusCode)
  })

  it('maps PostgreSQL foreign key errors to a conflict error', () => {
    const error = mapDatabaseError({
      code: '23503',
      message: 'insert or update violates foreign key constraint',
    })

    expect(error).toBeInstanceOf(AerealithError)
    expect(error.code).toBe(CommonErrorCode.CONFLICT)
    expect(error.statusCode).toBe(HttpErrorCode.CONFLICT.statusCode)
  })

  it('maps unknown database errors to an internal server error', () => {
    const error = mapDatabaseError({
      code: '99999',
      message: 'unexpected database error',
    })

    expect(error).toBeInstanceOf(AerealithError)
    expect(error.code).toBe(CommonErrorCode.INTERNAL_ERROR)
    expect(error.statusCode).toBe(
      HttpErrorCode.INTERNAL_SERVER_ERROR.statusCode,
    )
  })

  it('maps non-database errors to an internal server error', () => {
    const error = mapDatabaseError(new Error('Something unexpected happened'))

    expect(error).toBeInstanceOf(AerealithError)
    expect(error.code).toBe(CommonErrorCode.INTERNAL_ERROR)
    expect(error.statusCode).toBe(
      HttpErrorCode.INTERNAL_SERVER_ERROR.statusCode,
    )
  })
})
