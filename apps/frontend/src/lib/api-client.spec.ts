// apps/frontend/src/lib/api-client.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiFetch } from './api-client'

function stubFetch(
  envelope: unknown,
  {
    status = 200,
    jsonThrows = false,
  }: { status?: number; jsonThrows?: boolean } = {},
) {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    json: jsonThrows
      ? () => Promise.reject(new Error('unreadable'))
      : () => Promise.resolve(envelope),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('apiFetch', () => {
  it('returns data from a success envelope', async () => {
    stubFetch({ ok: true, data: { id: '1' } })
    await expect(apiFetch('/x')).resolves.toEqual({ id: '1' })
  })

  it('always sends credentials and a JSON content-type', async () => {
    const fetchMock = stubFetch({ ok: true, data: null })
    await apiFetch('/x', { method: 'POST', body: '{}' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/x',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    )
  })

  it('throws ApiError with code and status from a failure envelope', async () => {
    stubFetch(
      { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'nope' } },
      { status: 401 },
    )
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch('/x')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    })
  })

  it('throws INVALID_RESPONSE when the body is unreadable', async () => {
    stubFetch(null, { status: 500, jsonThrows: true })
    await expect(apiFetch('/x')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })
})
