// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { PublicFooter } from './public-footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <PublicFooter />
    </MemoryRouter>,
  )
}

describe('PublicFooter', () => {
  it('renders navigation, social, and legal links', () => {
    renderFooter()

    expect(screen.getByRole('contentinfo')).toBeTruthy()
    expect(
      screen.getAllByRole('link', { name: /github/i }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /privacy policy/i }),
    ).toHaveLength(2)
  })

  it('validates and accepts newsletter subscriptions', () => {
    renderFooter()

    fireEvent.click(screen.getByRole('button', { name: /mailing list/i }))
    expect(screen.getByText(/valid email/i)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'hello@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /mailing list/i }))

    expect(screen.getByText(/you're on the list/i)).toBeTruthy()
  })

  it('scrolls smoothly back to the top', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    renderFooter()

    fireEvent.click(screen.getByRole('button', { name: /back to top/i }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    vi.unstubAllGlobals()
  })
})
