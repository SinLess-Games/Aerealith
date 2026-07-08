import { describe, expect, it } from 'vitest'
import { AboutContent, AboutDescription, AboutHeader, AboutImage } from '.'

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
})
