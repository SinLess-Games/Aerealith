// @vitest-environment jsdom

// libs/ui/src/primitives/actions/button.spec.tsx

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from './button'

afterEach(() => {
  cleanup()
})

describe('Button', () => {
  it('renders a native button with its content', () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.tagName).toBe('BUTTON')
    expect(button.textContent).toBe('Save changes')
  })

  it('uses button as the default native button type', () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.getAttribute('type')).toBe('button')
  })

  it('supports an explicit native button type', () => {
    render(<Button type='submit'>Create server</Button>)

    const button = screen.getByRole('button', {
      name: 'Create server',
    })

    expect(button.getAttribute('type')).toBe('submit')
  })

  it('uses the primary variant by default', () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.classList.contains('bg-[var(--ae-primary)]')).toBe(true)
    expect(button.classList.contains('text-[var(--ae-starlight)]')).toBe(true)
  })

  it.each([
    ['secondary', 'bg-[var(--ae-secondary)]'],
    ['outline', 'border'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-[var(--ae-danger)]'],
  ] as const)('applies the %s variant styles', (variant, expectedClass) => {
    render(<Button variant={variant}>Button action</Button>)

    const button = screen.getByRole('button', {
      name: 'Button action',
    })

    expect(button.classList.contains(expectedClass)).toBe(true)
  })

  it('uses the medium size by default', () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.classList.contains('min-h-10')).toBe(true)
    expect(button.classList.contains('px-4')).toBe(true)
    expect(button.classList.contains('text-sm')).toBe(true)
  })

  it.each([
    ['sm', 'min-h-8', 'px-3'],
    ['md', 'min-h-10', 'px-4'],
    ['lg', 'min-h-12', 'px-5'],
  ] as const)(
    'applies the %s size styles',
    (size, heightClass, paddingClass) => {
      render(<Button size={size}>{size} button</Button>)

      const button = screen.getByRole('button', {
        name: `${size} button`,
      })

      expect(button.classList.contains(heightClass)).toBe(true)
      expect(button.classList.contains(paddingClass)).toBe(true)
    },
  )

  it('applies full-width styles when requested', () => {
    render(<Button fullWidth>Continue</Button>)

    const button = screen.getByRole('button', {
      name: 'Continue',
    })

    expect(button.classList.contains('w-full')).toBe(true)
  })

  it('runs the provided click handler', () => {
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Save changes</Button>)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save changes',
      }),
    )

    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not run the click handler when disabled', () => {
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Save changes
      </Button>,
    )

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.getAttribute('disabled')).not.toBeNull()

    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('passes supported native button attributes to the rendered button', () => {
    render(
      <Button
        aria-describedby='save-description'
        data-testid='save-button'
        id='save-changes-button'
      >
        Save changes
      </Button>,
    )

    const button = screen.getByTestId('save-button')

    expect(button.getAttribute('aria-describedby')).toBe('save-description')
    expect(button.getAttribute('id')).toBe('save-changes-button')
  })

  it('merges a custom class name with the component styles', () => {
    render(<Button className='custom-button'>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.classList.contains('custom-button')).toBe(true)
    expect(button.classList.contains('inline-flex')).toBe(true)
    expect(button.classList.contains('items-center')).toBe(true)
    expect(button.classList.contains('justify-center')).toBe(true)
  })

  it('includes keyboard-focus styles', () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole('button', {
      name: 'Save changes',
    })

    expect(button.classList.contains('focus-visible:ring-2')).toBe(true)
    expect(
      button.classList.contains('focus-visible:ring-[var(--ae-focus-ring)]'),
    ).toBe(true)
  })
})
