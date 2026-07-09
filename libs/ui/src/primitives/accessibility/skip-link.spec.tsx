// @vitest-environment jsdom

// libs/ui/src/primitives/accessibility/skip-link.spec.tsx

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SkipLink } from './skip-link'

afterEach(() => {
  cleanup()
})

describe('SkipLink', () => {
  it('renders the default skip-link text', () => {
    render(<SkipLink />)

    expect(
      screen.getByRole('link', {
        name: 'Skip to main content',
      }),
    ).toBeTruthy()
  })

  it('links to the default main-content target', () => {
    render(<SkipLink />)

    const link = screen.getByRole('link', {
      name: 'Skip to main content',
    })

    expect(link.getAttribute('href')).toBe('#main-content')
  })

  it('links to a custom target ID', () => {
    render(<SkipLink targetId='dashboard-content' />)

    const link = screen.getByRole('link', {
      name: 'Skip to main content',
    })

    expect(link.getAttribute('href')).toBe('#dashboard-content')
  })

  it('renders custom accessible text', () => {
    render(<SkipLink>Skip to dashboard content</SkipLink>)

    expect(
      screen.getByRole('link', {
        name: 'Skip to dashboard content',
      }),
    ).toBeTruthy()
  })

  it('passes supported anchor attributes to the link', () => {
    render(
      <SkipLink
        aria-label='Skip past primary navigation'
        data-testid='skip-link'
        id='main-skip-link'
      />,
    )

    const link = screen.getByTestId('skip-link')

    expect(link.getAttribute('aria-label')).toBe('Skip past primary navigation')
    expect(link.getAttribute('id')).toBe('main-skip-link')
    expect(link.getAttribute('href')).toBe('#main-content')
  })

  it('merges a custom class name with the base styles', () => {
    render(<SkipLink className='custom-skip-link' />)

    const link = screen.getByRole('link', {
      name: 'Skip to main content',
    })

    expect(link.classList.contains('custom-skip-link')).toBe(true)
    expect(link.classList.contains('fixed')).toBe(true)
    expect(link.classList.contains('focus:translate-y-0')).toBe(true)
  })

  it('uses the configured target ID even when other anchor props are provided', () => {
    render(
      <SkipLink
        aria-describedby='skip-link-description'
        targetId='workspace-content'
      >
        Skip to workspace content
      </SkipLink>,
    )

    const link = screen.getByRole('link', {
      name: 'Skip to workspace content',
    })

    expect(link.getAttribute('aria-describedby')).toBe('skip-link-description')
    expect(link.getAttribute('href')).toBe('#workspace-content')
  })
})
