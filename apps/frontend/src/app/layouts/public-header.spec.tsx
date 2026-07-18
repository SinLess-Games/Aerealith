// @vitest-environment jsdom
import { ThemeProvider } from '@aerealith-ai/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicHeader } from './public-header'

function renderHeader() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({ ok: false }),
    }),
  )

  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      <MemoryRouter>
        <ThemeProvider persist={false}>
          <PublicHeader />
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('PublicHeader', () => {
  it('renders the brand and desktop primary navigation', () => {
    renderHeader()

    expect(screen.getByRole('link', { name: 'Aerealith AI home' })).toBeTruthy()
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeTruthy()
  })

  it('opens and closes the mobile navigation', () => {
    renderHeader()

    const trigger = screen.getByRole('button', {
      name: /open navigation/i,
    })
    fireEvent.click(trigger)

    expect(
      screen.getByRole('navigation', { name: /mobile primary/i }),
    ).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(
      screen.queryByRole('navigation', { name: /mobile primary/i }),
    ).toBeNull()
  })
})
