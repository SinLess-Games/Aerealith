// @vitest-environment jsdom
// Component tests live beside the public component.

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Background } from './background'

describe('Background', () => {
  it('uses the active document theme when mode is auto', () => {
    document.documentElement.dataset.theme = 'dark'

    render(
      <Background darkImage='/night.webp' lightImage='/day.webp'>
        Content
      </Background>,
    )

    const background = screen.getByText('Content')

    expect(background.getAttribute('data-mode')).toBe('dark')
    expect(background.style.getPropertyValue('--ae-background-image')).toBe(
      'url("/day.webp")',
    )
    expect(
      background.style.getPropertyValue('--ae-background-image-dark'),
    ).toBe('url("/night.webp")')

    delete document.documentElement.dataset.theme
  })

  it('supports explicit light and dark modes', () => {
    const { rerender } = render(
      <Background lightImage='/day.webp' mode='light' />,
    )

    expect(
      document
        .querySelector('[data-slot="background"]')
        ?.getAttribute('data-mode'),
    ).toBe('light')

    rerender(<Background lightImage='/day.webp' mode='dark' />)

    expect(
      document
        .querySelector('[data-slot="background"]')
        ?.getAttribute('data-mode'),
    ).toBe('dark')
  })

  it('falls back to the system theme when no document theme is set', () => {
    const originalMatchMedia = window.matchMedia

    window.matchMedia = ((query: string) =>
      ({
        addEventListener: () => undefined,
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        removeEventListener: () => undefined,
      }) as MediaQueryList) satisfies typeof window.matchMedia

    render(<Background data-testid='background' lightImage='/shared.webp' />)

    expect(screen.getByTestId('background')?.getAttribute('data-mode')).toBe(
      'dark',
    )

    window.matchMedia = originalMatchMedia
  })

  it('falls back to the light image when no dark image is provided', () => {
    render(<Background data-testid='background' lightImage='/shared.webp' />)

    const background = screen.getByTestId('background')
    expect(
      background.style.getPropertyValue('--ae-background-image-dark'),
    ).toBe('url("/shared.webp")')
  })

  it('merges native props, custom classes, and styles', () => {
    render(
      <Background
        aria-label='Nebula'
        className='min-h-screen'
        lightImage='/nebula.webp'
        style={{ opacity: 0.9 }}
      />,
    )

    const background = screen.getByLabelText('Nebula')
    expect(background.classList.contains('min-h-screen')).toBe(true)
    expect(background.style.opacity).toBe('0.9')
  })
})
