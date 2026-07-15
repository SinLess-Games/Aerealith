// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeaderAuthNav } from './header-auth-nav'

function mockSession(status: number, envelope: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ status, json: () => Promise.resolve(envelope) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderNav() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HeaderAuthNav />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('HeaderAuthNav', () => {
  it('shows a sign-in link when signed out', async () => {
    mockSession(401, {
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    })
    renderNav()

    expect(await screen.findByRole('link', { name: /sign in/i })).toBeTruthy()
  })

  it('shows the dashboard link, username, and sign-out when signed in', async () => {
    mockSession(200, {
      ok: true,
      data: {
        id: 'u1',
        username: 'ada',
        email: 'ada@example.com',
        emailVerified: false,
      },
    })
    renderNav()

    expect(
      await screen.findByRole('button', { name: /sign out/i }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeTruthy()
    expect(screen.getByText('ada')).toBeTruthy()
  })

  it('signs out via the logout endpoint', async () => {
    const fetchMock = mockSession(200, {
      ok: true,
      data: {
        id: 'u1',
        username: 'ada',
        email: 'ada@example.com',
        emailVerified: false,
      },
    })
    renderNav()

    fireEvent.click(await screen.findByRole('button', { name: /sign out/i }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })
})
