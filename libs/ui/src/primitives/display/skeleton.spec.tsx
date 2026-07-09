// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'
describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })
})
