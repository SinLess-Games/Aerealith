// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignInRoute } from './sign-in.route'

function renderSignIn() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignInRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('SignInRoute', () => {
  it('submits credentials to the login endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({ ok: true, data: { id: 'u1', username: 'ada' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderSignIn()
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'ada' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/login',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('shows an error message when authentication fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        json: () =>
          Promise.resolve({
            ok: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid credentials',
            },
          }),
      }),
    )

    renderSignIn()
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'ada' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Invalid credentials')
  })
})
