import { describe, expect, it } from 'vitest';

import {
  AboutContent,
  ContactDescription,
  contactOptions,
  englishPolicies,
  footerProps,
  homePageContent,
  policiesByPath,
  policiesBySlug,
  profileEditOptions,
  profileScaffoldContent,
} from '.';

describe('English page content', () => {
  it('exports reusable content for each page area', () => {
    expect(AboutContent.length).toBeGreaterThan(0);
    expect(ContactDescription.length).toBeGreaterThan(0);
    expect(contactOptions.length).toBeGreaterThan(0);
    expect(homePageContent.sections.length).toBeGreaterThan(0);
    expect(footerProps.linkGroups.length).toBeGreaterThan(0);
    expect(profileScaffoldContent.tabs.length).toBeGreaterThan(0);
    expect(profileEditOptions.languages.length).toBeGreaterThan(0);
  });

  it('indexes every policy by its slug and path', () => {
    for (const policy of englishPolicies) {
      expect(policiesBySlug[policy.slug]).toBe(policy);
      expect(policiesByPath[policy.path]).toBe(policy);
    }
  });

  it('keeps exported page content serializable', () => {
    const pageContent = {
      about: AboutContent,
      contact: contactOptions,
      footer: footerProps,
      home: homePageContent,
      policies: englishPolicies,
      profile: profileScaffoldContent,
      profileOptions: profileEditOptions,
    };

    expect(() => JSON.stringify(pageContent)).not.toThrow();
    expect(JSON.parse(JSON.stringify(pageContent))).toEqual(pageContent);
  });
});
