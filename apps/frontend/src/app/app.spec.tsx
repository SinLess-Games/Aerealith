// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './app'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 401,
      json: () =>
        Promise.resolve({
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('renders the public layout with the home hero and a theme toggle', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Your Digital Life',
    )
    expect(screen.getByRole('button', { name: /theme/i })).toBeTruthy()
  })
})
