// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from './input'
describe('Input', () => {
  it('forwards native input props', () => {
    render(<Input aria-label='Email' type='email' />)
    expect(screen.getByLabelText('Email').getAttribute('type')).toBe('email')
  })
})
