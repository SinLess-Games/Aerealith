// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Textarea } from './textarea'
describe('Textarea', () => {
  it('forwards native props', () => {
    render(<Textarea aria-label='Bio' rows={4} />)
    expect(screen.getByLabelText('Bio').getAttribute('rows')).toBe('4')
  })
})
