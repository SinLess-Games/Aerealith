// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from './providers/app-providers'
import { AppRoutes } from './router'

const SIGNED_IN = {
  ok: true,
  data: {
    id: 'u1',
    username: 'ada',
    email: 'ada@example.com',
    emailVerified: true,
  },
}
const SIGNED_OUT = {
  ok: false,
  error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
}

function mockFetch(status: number, envelope: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ status, json: () => Promise.resolve(envelope) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('dashboard (protected)', () => {
  it('redirects to sign-in when signed out', async () => {
    mockFetch(401, SIGNED_OUT)
    renderAt('/app')

    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeTruthy()
  })

  it('renders the overview and signs out from the shell', async () => {
    const fetchMock = mockFetch(200, SIGNED_IN)
    renderAt('/app')

    expect(
      await screen.findByRole('heading', { name: /welcome, ada/i }),
    ).toBeTruthy()
    expect(screen.getByText(/what is connected/i)).toBeTruthy()
    expect(screen.getByText(/what needs attention/i)).toBeTruthy()

    // The dashboard shell header has the only sign-out button here.
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('renders the account page with profile and its own sign-out control', async () => {
    const fetchMock = mockFetch(200, SIGNED_IN)
    renderAt('/app/account')

    expect(
      await screen.findByRole('heading', { name: /^account$/i }),
    ).toBeTruthy()
    expect(screen.getByText('ada@example.com')).toBeTruthy()
    expect(screen.getByText('Verified')).toBeTruthy()

    // Both the shell header and the account panel expose sign-out; click the
    // account panel's (the last one in the DOM).
    const signOutButtons = screen.getAllByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButtons[signOutButtons.length - 1])
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/logout',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })
})
