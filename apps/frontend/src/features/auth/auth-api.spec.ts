// apps/frontend/src/features/auth/auth-api.spec.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchCurrentUser, login, logout, signUp } from './auth-api'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    json: () =>
      Promise.resolve({ ok: true, data: { id: 'u1', username: 'ada' } }),
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

describe('auth-api', () => {
  it('signUp posts the registration payload to /api/V1/auth/sign-up', async () => {
    await signUp({
      username: 'ada',
      email: 'ada@example.com',
      password: 'password123',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/sign-up',
      expect.objectContaining({ method: 'POST' }),
    )
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sent).toMatchObject({ username: 'ada', email: 'ada@example.com' })
  })

  it('login posts to /api/V1/auth/login', async () => {
    await login({ usernameOrEmail: 'ada', password: 'password123' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('logout posts to /api/V1/auth/logout', async () => {
    await logout()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('fetchCurrentUser gets /api/V1/auth/me with credentials', async () => {
    await fetchCurrentUser()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })
})
