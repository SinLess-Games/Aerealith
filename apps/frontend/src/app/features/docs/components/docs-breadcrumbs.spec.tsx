// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsBreadcrumbs } from './docs-breadcrumbs';

const docsSourceMock = vi.hoisted(() => ({
  createDocsUrl: vi.fn(
    (audience: string, slug: readonly string[] = []) =>
      `/documentation/${audience}${slug.length > 0 ? `/${slug.join('/')}` : ''}`,
  ),
  getAudienceFromDocsUrl: vi.fn((pathname: string) =>
    pathname.includes('/developer')
      ? ('developer' as const)
      : pathname.includes('/user')
        ? ('user' as const)
        : undefined,
  ),
  getDocPage: vi.fn((_audience: string, slug: readonly string[]) =>
    slug.join('/') === 'api'
      ? { title: 'API reference' }
      : slug.join('/') === 'api/tokens'
        ? { title: 'Token API' }
        : undefined,
  ),
}));

vi.mock('../../../../lib/docs-source', () => docsSourceMock);

function renderBreadcrumbs(
  pathname: string,
  props: React.ComponentProps<typeof DocsBreadcrumbs> = {},
) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <DocsBreadcrumbs {...props} />
    </MemoryRouter>,
  );
}

describe('DocsBreadcrumbs', () => {
  beforeEach(() => {
    docsSourceMock.createDocsUrl.mockClear();
    docsSourceMock.getAudienceFromDocsUrl.mockClear();
    docsSourceMock.getDocPage.mockClear();
  });

  it('builds nested breadcrumbs from the current documentation URL', () => {
    renderBreadcrumbs('/documentation/developer/api/access_tokens');

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Documentation' }).getAttribute('href'),
    ).toBe('/documentation');
    expect(
      screen.getByRole('link', { name: 'Developer docs' }).getAttribute('href'),
    ).toBe('/documentation/developer');
    expect(
      screen.getByRole('link', { name: 'API reference' }).getAttribute('href'),
    ).toBe('/documentation/developer/api');
    expect(screen.getByText('Access Tokens').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(docsSourceMock.getDocPage).toHaveBeenCalledWith('developer', [
      'api',
    ]);
  });

  it('uses supplied page metadata and optional site-level navigation', () => {
    renderBreadcrumbs('/ignored', {
      documentationLabel: 'Docs',
      mainSiteLabel: 'Home',
      page: {
        audience: 'user',
        slug: ['account', 'security'],
        title: 'Secure your account',
        url: '/documentation/user/account/security',
      },
      showMainSite: true,
    });

    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('href'),
    ).toBe('/');
    expect(screen.getByRole('link', { name: 'Docs' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'User docs' })).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
    expect(
      screen.getByText('Secure your account').getAttribute('aria-current'),
    ).toBe('page');
  });

  it('keeps the documentation and audience roots current at their routes', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/documentation/']}>
        <DocsBreadcrumbs showDocumentationRoot={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Documentation').getAttribute('aria-current')).toBe(
      'page',
    );

    unmount();
    renderBreadcrumbs('/documentation/user');
    expect(screen.getByText('User docs').getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('normalizes explicit entries and marks the last usable item current', () => {
    renderBreadcrumbs('/elsewhere', {
      'aria-label': 'Page trail',
      items: [
        { href: '/one', label: 'One' },
        { href: '/ignored', label: '' },
        { href: '/two', label: 2 },
        { label: <strong>Current element</strong> },
      ],
      separator: <span data-testid="separator">→</span>,
    });

    expect(screen.getByRole('navigation', { name: 'Page trail' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'One' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '2' }).getAttribute('title')).toBe(
      '2',
    );
    expect(
      screen
        .getByText('Current element')
        .parentElement?.getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getAllByTestId('separator')).toHaveLength(2);
  });

  it('preserves an explicitly current item and renders unlinked non-current labels', () => {
    renderBreadcrumbs('/elsewhere', {
      items: [
        { label: 'Label only' },
        { current: true, href: '/current', label: 'Current' },
        { href: '/later', label: 'Later' },
      ],
    });

    expect(
      screen.getByText('Label only').getAttribute('aria-current'),
    ).toBeNull();
    expect(screen.getByText('Current').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: 'Later' })).toBeTruthy();
  });

  it('returns no navigation when every explicit entry is empty', () => {
    const { container } = renderBreadcrumbs('/documentation', {
      items: [{ label: '' }, { label: null }],
    });

    expect(container.querySelector('nav')).toBeNull();
  });

  it('handles unrelated paths and malformed encoded path segments safely', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/outside']}>
        <DocsBreadcrumbs showDocumentationRoot={false} showMainSite />
      </MemoryRouter>,
    );
    expect(screen.getByText('Aerealith').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.queryByText('Developer docs')).toBeNull();

    unmount();
    renderBreadcrumbs('/documentation/developer/%E0%A4%A', {
      audience: 'developer',
    });
    expect(screen.getByText('%e0%a4%a').getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('falls back to the explicit audience root when the path audience differs', () => {
    renderBreadcrumbs('/documentation/user/account', {
      audience: 'developer',
      showDocumentationRoot: false,
    });

    expect(
      screen.getByText('Developer docs').getAttribute('aria-current'),
    ).toBe('page');
  });
});
