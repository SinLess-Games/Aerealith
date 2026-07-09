// @vitest-environment jsdom

// libs/ui/src/primitives/display/badge.spec.tsx

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Badge } from './badge'

afterEach(() => {
  cleanup()
})

describe('Badge', () => {
  it('renders a span with its content', () => {
    render(<Badge>Beta</Badge>)

    const badge = screen.getByText('Beta')

    expect(badge.tagName).toBe('SPAN')
    expect(badge.textContent).toBe('Beta')
  })

  it('includes the badge data slot', () => {
    render(<Badge>Beta</Badge>)

    expect(screen.getByText('Beta').getAttribute('data-slot')).toBe('badge')
  })

  it('uses the neutral variant by default', () => {
    render(<Badge>Beta</Badge>)

    const badge = screen.getByText('Beta')

    expect(badge.classList.contains('border-[var(--ae-border)]')).toBe(true)
    expect(badge.classList.contains('bg-[var(--ae-starlight-05)]')).toBe(true)
    expect(badge.classList.contains('text-[var(--ae-foreground)]')).toBe(true)
  })

  it.each([
    [
      'primary',
      'border-[var(--ae-pink-30)]',
      'bg-[var(--ae-pink-12)]',
      'text-[var(--ae-primary)]',
    ],
    [
      'secondary',
      'border-[var(--ae-violet-30)]',
      'bg-[var(--ae-violet-12)]',
      'text-[var(--ae-secondary)]',
    ],
    [
      'info',
      'border-[var(--ae-cyan-30)]',
      'bg-[var(--ae-cyan-12)]',
      'text-[var(--ae-accent)]',
    ],
    [
      'success',
      'border-[rgb(var(--ae-success-rgb)_/_0.35)]',
      'bg-[rgb(var(--ae-success-rgb)_/_0.14)]',
      'text-[var(--ae-success)]',
    ],
    [
      'warning',
      'border-[rgb(var(--ae-warning-rgb)_/_0.35)]',
      'bg-[rgb(var(--ae-warning-rgb)_/_0.14)]',
      'text-[var(--ae-warning)]',
    ],
    [
      'danger',
      'border-[rgb(var(--ae-danger-rgb)_/_0.35)]',
      'bg-[rgb(var(--ae-danger-rgb)_/_0.14)]',
      'text-[var(--ae-danger)]',
    ],
  ] as const)(
    'applies the %s variant styles',
    (variant, borderClass, backgroundClass, textClass) => {
      render(<Badge variant={variant}>{variant}</Badge>)

      const badge = screen.getByText(variant)

      expect(badge.classList.contains(borderClass)).toBe(true)
      expect(badge.classList.contains(backgroundClass)).toBe(true)
      expect(badge.classList.contains(textClass)).toBe(true)
    },
  )

  it('uses the small size by default', () => {
    render(<Badge>Beta</Badge>)

    const badge = screen.getByText('Beta')

    expect(badge.classList.contains('min-h-5')).toBe(true)
    expect(badge.classList.contains('px-2')).toBe(true)
    expect(badge.classList.contains('text-xs')).toBe(true)
  })

  it.each([
    ['sm', 'min-h-5', 'px-2', 'text-xs'],
    ['md', 'min-h-6', 'px-2.5', 'text-sm'],
  ] as const)(
    'applies the %s badge size styles',
    (size, heightClass, paddingClass, textClass) => {
      render(<Badge size={size}>Status</Badge>)

      const badge = screen.getByText('Status')

      expect(badge.classList.contains(heightClass)).toBe(true)
      expect(badge.classList.contains(paddingClass)).toBe(true)
      expect(badge.classList.contains(textClass)).toBe(true)
    },
  )

  it('applies the shared badge layout styles', () => {
    render(<Badge>Beta</Badge>)

    const badge = screen.getByText('Beta')

    expect(badge.classList.contains('inline-flex')).toBe(true)
    expect(badge.classList.contains('shrink-0')).toBe(true)
    expect(badge.classList.contains('items-center')).toBe(true)
    expect(badge.classList.contains('justify-center')).toBe(true)
    expect(badge.classList.contains('rounded-full')).toBe(true)
    expect(badge.classList.contains('whitespace-nowrap')).toBe(true)
  })

  it('passes supported native span attributes to the rendered badge', () => {
    render(
      <Badge
        aria-label='Aerealith beta access'
        data-testid='beta-badge'
        id='beta-access-badge'
      >
        Beta
      </Badge>,
    )

    const badge = screen.getByTestId('beta-badge')

    expect(badge.getAttribute('aria-label')).toBe('Aerealith beta access')
    expect(badge.getAttribute('id')).toBe('beta-access-badge')
    expect(badge.getAttribute('data-slot')).toBe('badge')
  })

  it('merges a custom class name with the component styles', () => {
    render(<Badge className='custom-badge'>Beta</Badge>)

    const badge = screen.getByText('Beta')

    expect(badge.classList.contains('custom-badge')).toBe(true)
    expect(badge.classList.contains('inline-flex')).toBe(true)
    expect(badge.classList.contains('rounded-full')).toBe(true)
  })

  it('supports nested badge content', () => {
    render(
      <Badge>
        <span>Connected</span>
      </Badge>,
    )

    expect(screen.getByText('Connected')).toBeTruthy()
  })

  it('does not apply an interactive role by default', () => {
    render(<Badge>Beta</Badge>)

    expect(screen.getByText('Beta').getAttribute('role')).toBeNull()
  })
})
