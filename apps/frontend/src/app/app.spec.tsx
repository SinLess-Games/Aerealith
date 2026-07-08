import { describe, expect, it } from 'vitest'

import App from './app'

describe('App', () => {
  it('renders without application content while routes are being built', () => {
    expect(App()).toBeNull()
  })
})
