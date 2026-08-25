// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { DocsAudienceCard } from './docs-audience-card';

describe('DocsAudienceCard', () => {
  it('renders audience defaults with an accessible link and feature list', () => {
    render(
      <MemoryRouter>
        <DocsAudienceCard audience="developer" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Developer documentation' }),
    ).toBeTruthy();
    expect(screen.getByRole('list').children.length).toBeGreaterThan(0);
    expect(
      screen
        .getByRole('link', { name: /explore developer docs/i })
        .getAttribute('href'),
    ).toBe('/documentation/developer');
  });

  it('supports custom content and an empty feature list', () => {
    const { container } = render(
      <MemoryRouter>
        <DocsAudienceCard
          audience="user"
          title="Custom docs"
          description="Custom description"
          eyebrow="Custom eyebrow"
          badge="Preview"
          features={[]}
          actionLabel="Open"
          href="/custom"
          icon={<span>Icon</span>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Open' }).getAttribute('href'),
    ).toBe('/custom');
    expect(container.querySelector('article')?.dataset['audience']).toBe(
      'user',
    );
  });
});
