// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthCard } from './auth-card'

describe('AuthCard', () => {
  it('renders the title and children', () => {
    render(
      <AuthCard title='Welcome'>
        <p>Body</p>
      </AuthCard>,
    )

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Welcome',
    )
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('omits the subtitle and footer when not provided', () => {
    const { container } = render(
      <AuthCard title='Welcome'>
        <p>Body</p>
      </AuthCard>,
    )

    // Only the heading paragraph siblings — no subtitle/footer paragraphs.
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('renders the subtitle and footer when provided', () => {
    render(
      <AuthCard title='Welcome' subtitle='Sub' footer={<span>Foot</span>}>
        <p>Body</p>
      </AuthCard>,
    )

    expect(screen.getByText('Sub')).toBeTruthy()
    expect(screen.getByText('Foot')).toBeTruthy()
  })
})
