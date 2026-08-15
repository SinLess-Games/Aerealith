// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { DocsAudienceSwitcher } from './docs-audience-switcher';

describe('DocsAudienceSwitcher', () => {
  it('marks the current audience and supplies default destinations', () => {
    render(
      <MemoryRouter initialEntries={['/documentation/developer/api']}>
        <DocsAudienceSwitcher />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('navigation', { name: 'Documentation audience' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /user docs/i }).getAttribute('href'),
    ).toBe('/documentation/user');
    expect(
      screen
        .getByRole('link', { name: /developer docs/i })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByText('Current documentation section')).toBeTruthy();
  });

  it('renders compact vertical descriptions and custom destinations', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/guides']}>
        <DocsAudienceSwitcher
          aria-label="Choose docs"
          size="compact"
          orientation="vertical"
          showDescriptions
          showIcons={false}
          userHref="/guides"
          developerHref="/reference"
        />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Choose docs' });
    expect(navigation.dataset['orientation']).toBe('vertical');
    expect(navigation.dataset['size']).toBe('compact');
    expect(screen.getByText('Guides and platform workflows')).toBeTruthy();
    expect(
      screen.getByText('Architecture, APIs, and integrations'),
    ).toBeTruthy();
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
