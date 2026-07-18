// @vitest-environment jsdom
import { AerealithError, CommonErrorCode } from '@aerealith-ai/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { ErrorRoute, resolveError } from './[error].route'

describe('resolveError', () => {
  it('uses a known client error message', () => {
    const view = resolveError(
      new AerealithError('Please sign in.', {
        code: CommonErrorCode.UNAUTHORIZED,
        statusCode: 401,
      }),
    )
    expect(view).toMatchObject({
      statusCode: 401,
      code: CommonErrorCode.UNAUTHORIZED,
      description: 'Please sign in.',
    })
  })

  it('does not expose a server error message', () => {
    const view = resolveError(
      new AerealithError('Database credentials leaked.', { statusCode: 500 }),
    )
    expect(view.statusCode).toBe(500)
    expect(view.description).not.toContain('credentials')
  })

  it('normalizes router status errors and their data', () => {
    expect(resolveError({ status: 404 })).toMatchObject({
      code: CommonErrorCode.NOT_FOUND,
      statusCode: 404,
    })
    expect(
      resolveError({
        status: 400,
        statusText: 'Invalid Request',
        data: {
          code: CommonErrorCode.VALIDATION_ERROR,
          message: 'The submitted value is invalid.',
        },
      }),
    ).toMatchObject({
      code: CommonErrorCode.VALIDATION_ERROR,
      title: 'Invalid Request',
      description: 'The submitted value is invalid.',
    })
    expect(
      resolveError({ status: 418, data: 'Short and stout.' }),
    ).toMatchObject({
      code: CommonErrorCode.UNKNOWN_ERROR,
      description: 'Short and stout.',
    })
  })

  it('falls back for unknown HTTP statuses and malformed status data', () => {
    const applicationError = resolveError(
      new AerealithError('Unmapped upstream failure.', { statusCode: 599 }),
    )
    expect(applicationError).toMatchObject({
      statusCode: 599,
      code: CommonErrorCode.INTERNAL_ERROR,
    })
    expect(applicationError.description).not.toContain('upstream')

    expect(
      resolveError({
        status: 422,
        data: { code: 'NOT_A_REAL_CODE', message: 123 },
      }),
    ).toMatchObject({ code: CommonErrorCode.UNKNOWN_ERROR })
  })
  it('falls back for malformed and unknown errors', () => {
    expect(resolveError({ status: '404' })).toMatchObject({ statusCode: 500 })
    expect(resolveError(null)).toMatchObject({
      code: CommonErrorCode.INTERNAL_ERROR,
      statusCode: 500,
    })
  })
})

describe('ErrorRoute', () => {
  it('renders retry and home actions', () => {
    const reset = vi.fn()
    render(
      <MemoryRouter>
        <ErrorRoute error={{ status: 404 }} reset={reset} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('link', { name: /return home/i }).getAttribute('href'),
    ).toBe('/')
  })
})
