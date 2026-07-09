// @vitest-environment jsdom

// libs/ui/src/primitives/actions/icon-button.spec.tsx

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IconButton } from './icon-button'

afterEach(() => {
  cleanup()
})

describe('IconButton', () => {
  it('renders a native button with the supplied accessible label', () => {
    render(
      <IconButton aria-label='Open navigation menu'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Open navigation menu',
    })

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-label')).toBe('Open navigation menu')
  })

  it('uses button as the default native button type', () => {
    render(
      <IconButton aria-label='Close dialog'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Close dialog',
    })

    expect(button.getAttribute('type')).toBe('button')
  })

  it('supports an explicit native button type', () => {
    render(
      <IconButton aria-label='Submit form' type='submit'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Submit form',
    })

    expect(button.getAttribute('type')).toBe('submit')
  })

  it('trims whitespace from the accessible label', () => {
    render(
      <IconButton aria-label='  Refresh dashboard  '>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Refresh dashboard',
    })

    expect(button.getAttribute('aria-label')).toBe('Refresh dashboard')
  })

  it('uses the primary variant by default', () => {
    render(
      <IconButton aria-label='Save changes'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.classList.contains('bg-[var(--ae-primary)]')).toBe(true)
  })

  it.each([
    ['secondary', 'bg-[var(--ae-secondary)]'],
    ['outline', 'border'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-[var(--ae-danger)]'],
  ] as const)('applies the %s variant styles', (variant, expectedClass) => {
    render(
      <IconButton aria-label={`${variant} action`} variant={variant}>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: `${variant} action`,
    })

    expect(button.classList.contains(expectedClass)).toBe(true)
  })

  it('uses the medium icon-button size by default', () => {
    render(
      <IconButton aria-label='Open settings'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Open settings',
    })

    expect(button.classList.contains('h-11')).toBe(true)
    expect(button.classList.contains('w-11')).toBe(true)
    expect(button.classList.contains('min-h-11')).toBe(true)
    expect(button.classList.contains('min-w-11')).toBe(true)
    expect(button.classList.contains('p-0')).toBe(true)
  })

  it.each([
    ['sm', 'h-10', 'w-10'],
    ['md', 'h-11', 'w-11'],
    ['lg', 'h-12', 'w-12'],
  ] as const)(
    'applies the %s icon-button size styles',
    (size, heightClass, widthClass) => {
      render(
        <IconButton aria-label={`${size} icon button`} size={size}>
          <svg aria-hidden='true' />
        </IconButton>,
      )

      const button = screen.getByRole('button', {
        name: `${size} icon button`,
      })

      expect(button.classList.contains(heightClass)).toBe(true)
      expect(button.classList.contains(widthClass)).toBe(true)
      expect(button.classList.contains('p-0')).toBe(true)
    },
  )

  it('runs the provided click handler', () => {
    const handleClick = vi.fn()

    render(
      <IconButton aria-label='Refresh dashboard' onClick={handleClick}>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Refresh dashboard',
      }),
    )

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not run the click handler when disabled', () => {
    const handleClick = vi.fn()

    render(
      <IconButton aria-label='Refresh dashboard' disabled onClick={handleClick}>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Refresh dashboard',
    })

    expect(button.getAttribute('disabled')).not.toBeNull()

    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('passes supported native button attributes to the rendered button', () => {
    render(
      <IconButton
        aria-describedby='refresh-description'
        aria-label='Refresh dashboard'
        data-testid='refresh-button'
        id='refresh-dashboard-button'
      >
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByTestId('refresh-button')

    expect(button.getAttribute('aria-describedby')).toBe('refresh-description')
    expect(button.getAttribute('id')).toBe('refresh-dashboard-button')
    expect(button.getAttribute('aria-label')).toBe('Refresh dashboard')
  })

  it('merges a custom class name with the component styles', () => {
    render(
      <IconButton
        aria-label='Open navigation menu'
        className='custom-icon-button'
      >
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Open navigation menu',
    })

    expect(button.classList.contains('custom-icon-button')).toBe(true)
    expect(button.classList.contains('inline-flex')).toBe(true)
    expect(button.classList.contains('items-center')).toBe(true)
    expect(button.classList.contains('justify-center')).toBe(true)
  })

  it('includes keyboard-focus styles', () => {
    render(
      <IconButton aria-label='Open command palette'>
        <svg aria-hidden='true' />
      </IconButton>,
    )

    const button = screen.getByRole('button', {
      name: 'Open command palette',
    })

    expect(button.classList.contains('focus-visible:ring-2')).toBe(true)
    expect(
      button.classList.contains('focus-visible:ring-[var(--ae-focus-ring)]'),
    ).toBe(true)
  })

  it('throws when the accessible label is empty', () => {
    expect(() =>
      render(
        <IconButton aria-label='   '>
          <svg aria-hidden='true' />
        </IconButton>,
      ),
    ).toThrow(
      'IconButton requires a non-empty aria-label describing its action.',
    )
  })
})
