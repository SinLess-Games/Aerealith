// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from './providers/app-providers'
import { AppRoutes } from './router'

// The header checks the session on render; keep it deterministically signed-out.
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('renders the home page at the index route', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Aerealith AI',
    )
  })

  it('renders the about page at /about', () => {
    renderAt('/about')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'About Aerealith AI',
    )
  })

  it('renders the pricing page at /pricing', () => {
    renderAt('/pricing')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Pricing Preview',
    )
  })

  it('renders the contact page at /contact', () => {
    renderAt('/contact')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Contact Aerealith AI',
    )
  })

  it('renders a policy document at /policies/:slug', () => {
    renderAt('/policies/privacy')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Privacy Policy',
    )
  })

  it('renders the 404 page for an unknown policy slug', () => {
    renderAt('/policies/does-not-exist')

    expect(screen.getByText('404')).toBeTruthy()
  })

  it('renders the 404 page for an unknown path', () => {
    renderAt('/does-not-exist')

    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByText(/could not be found/i)).toBeTruthy()
  })

  it('shows the primary navigation in the public layout', () => {
    renderAt('/')

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeTruthy()
  })
})
