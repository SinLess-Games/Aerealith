// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReadableContent } from './readable-content'
describe('ReadableContent', () => {
  it('renders an article', () => {
    render(<ReadableContent>Story</ReadableContent>)
    expect(screen.getByText('Story').tagName).toBe('ARTICLE')
  })
})
