// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './checkbox'
describe('Checkbox', () => {
  it('supports an inline label', () => {
    render(<Checkbox label='Accept' />)
    const box = screen.getByLabelText('Accept') as HTMLInputElement
    fireEvent.click(box)
    expect(box.checked).toBe(true)
  })
})
