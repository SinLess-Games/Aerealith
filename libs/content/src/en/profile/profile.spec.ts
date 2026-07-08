import { describe, expect, it } from 'vitest'
import {
  profileConnectionCategories,
  profileEditOptions,
  profileScaffoldContent,
  profileSidebar,
  profileTabs,
} from '.'

describe('profile content', () => {
  it('composes the profile scaffold from reusable content', () => {
    expect(profileScaffoldContent.tabs).toBe(profileTabs)
    expect(profileScaffoldContent.sidebar).toBe(profileSidebar)
    expect(profileScaffoldContent.connectionCategories).toBe(
      profileConnectionCategories,
    )
  })

  it('provides unique selectable values for every edit option group', () => {
    for (const options of Object.values(profileEditOptions)) {
      expect(options.length).toBeGreaterThan(0)
      expect(new Set(options.map((option) => option.value)).size).toBe(
        options.length,
      )
    }
  })
})
