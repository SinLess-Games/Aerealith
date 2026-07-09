// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './switch'
describe('Switch', () => {
  it('toggles and reports changes', () => {
    const changed = vi.fn()
    render(<Switch aria-label='Theme' onCheckedChange={changed} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(changed).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })
})
