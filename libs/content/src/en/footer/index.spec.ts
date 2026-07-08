import { describe, expect, it } from 'vitest'
import { footerProps } from '.'

describe('footer content', () => {
  it('provides navigation, social, and legal links', () => {
    expect(footerProps.linkGroups.length).toBeGreaterThan(0)
    expect(footerProps.socialLinks.length).toBeGreaterThan(0)
    expect(footerProps.legalLinks.length).toBeGreaterThan(0)
    expect(footerProps.copyrightHolder).toBeTruthy()
  })
})
