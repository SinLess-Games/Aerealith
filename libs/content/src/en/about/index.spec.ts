import { describe, expect, it } from 'vitest'
import {
  AboutContent,
  AboutDescription,
  AboutHeader,
  AboutImage,
  aboutPageContent,
} from '.'

describe('about content', () => {
  it('provides complete page copy and accessible media', () => {
    expect(AboutHeader.length).toBeGreaterThan(0)
    expect(AboutDescription.length).toBeGreaterThan(0)
    expect(AboutImage).toMatch(/^\/images\//)
    expect(
      AboutContent.every(
        (section) => section.title && section.paragraphs.length,
      ),
    ).toBe(true)
  })

  it('provides the landing page hero, features, and calls to action', () => {
    expect(aboutPageContent.heading).toBeTruthy()
    expect(aboutPageContent.highlights).toHaveLength(3)
    expect(aboutPageContent.features).toHaveLength(9)
    expect(aboutPageContent.cta.primaryHref).toMatch(/^\//)
  })
})
