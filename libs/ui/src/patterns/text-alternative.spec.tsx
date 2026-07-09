// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextAlternative } from './text-alternative'
describe('TextAlternative', () => {
  it('provides hidden text by default', () => {
    render(<TextAlternative>Chart trend</TextAlternative>)
    expect(screen.getByText('Chart trend').getAttribute('data-slot')).toBe(
      'text-alternative',
    )
  })
})
