// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignUpRoute } from './sign-up.route'

function renderSignUp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignUpRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('SignUpRoute', () => {
  it('submits the registration payload to the sign-up endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: () =>
        Promise.resolve({ ok: true, data: { id: 'u1', username: 'ada' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderSignUp()
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'ada' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/sign-up',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sent).toMatchObject({ username: 'ada', email: 'ada@example.com' })
  })
})
