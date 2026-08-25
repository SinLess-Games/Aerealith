// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsPage } from './docs-page';

const mocks = vi.hoisted(() => ({
  contentError: undefined as Error | undefined,
  reload: vi.fn(),
  result: {} as Record<string, unknown>,
  tocError: undefined as Error | undefined,
  useDocContent: vi.fn(),
}));

vi.mock('../hooks/use-doc-page', () => ({ useDocPage: () => mocks.result }));
vi.mock('../../../../lib/docs-client', () => ({
  useDocContent: (path: string, options: unknown) => {
    mocks.useDocContent(path, options);
    if (mocks.contentError) throw mocks.contentError;
    return <article>Loaded MDX content</article>;
  },
}));
vi.mock('./docs-breadcrumbs', () => ({
  DocsBreadcrumbs: () => <nav aria-label="Mock breadcrumbs" />,
}));
vi.mock('./docs-table-of-contents', () => ({
  DocsTableOfContents: () => {
    if (mocks.tocError) throw mocks.tocError;
    return <aside>Table of contents</aside>;
  },
}));
vi.mock('./mdx-components', () => ({
  getMDXComponents: () => ({ Custom: () => null }),
}));

const page = {
  audience: 'developer',
  description: 'Developer documentation.',
  draft: false,
  headings: [],
  path: 'developer/api.mdx',
  slug: ['api'],
  title: 'API reference',
  url: '/documentation/developer/api',
};
const previousPage = {
  ...page,
  path: 'developer/start.mdx',
  title: 'Getting started',
  url: '/documentation/developer/start',
};
const nextPage = {
  ...page,
  path: 'developer/auth.mdx',
  title: 'Authentication',
  url: '/documentation/developer/auth',
};

function readyResult(overrides: Record<string, unknown> = {}) {
  return {
    error: undefined,
    isError: false,
    isLoading: false,
    isNotFound: false,
    isReady: true,
    nextPage,
    page,
    path: page.path,
    previousPage,
    reload: mocks.reload,
    status: 'ready',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DocsPage audience="developer" />
    </MemoryRouter>,
  );
}

describe('DocsPage', () => {
  beforeEach(() => {
    mocks.contentError = undefined;
    mocks.tocError = undefined;
    mocks.reload.mockReset();
    mocks.useDocContent.mockReset();
    mocks.result = readyResult();
    document.title = 'Before';
    document.head
      .querySelectorAll('meta[name="description"], link[rel="canonical"]')
      .forEach((element) => element.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders not-found and loading states', () => {
    mocks.result = readyResult({ isNotFound: true, isReady: false });
    const { rerender } = renderPage();
    expect(screen.getByText('Documentation page not found')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Return to documentation' }),
    ).toBeTruthy();

    mocks.result = readyResult({ isLoading: true, isReady: false });
    rerender(
      <MemoryRouter>
        <DocsPage audience="developer" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading documentation')).toBeTruthy();
  });

  it('renders retryable errors with specific and fallback messages', () => {
    mocks.result = readyResult({
      error: new Error('Network unavailable'),
      isError: true,
      isReady: false,
    });
    const { rerender } = renderPage();
    expect(screen.getByText('Network unavailable')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mocks.reload).toHaveBeenCalled();

    mocks.result = readyResult({
      error: undefined,
      isError: true,
      isReady: false,
    });
    rerender(
      <MemoryRouter>
        <DocsPage audience="developer" />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('The MDX document could not be loaded.'),
    ).toBeTruthy();
  });

  it.each([
    [{ page: undefined }, 'missing page'],
    [{ path: undefined }, 'missing path'],
  ])('uses loading state for %s', (overrides) => {
    mocks.result = readyResult(overrides);
    renderPage();
    expect(screen.getByText('Loading documentation')).toBeTruthy();
  });

  it('renders MDX, draft status, adjacent pages, and document metadata', async () => {
    const existingDescription = document.createElement('meta');
    existingDescription.name = 'description';
    document.head.appendChild(existingDescription);
    const existingCanonical = document.createElement('link');
    existingCanonical.rel = 'canonical';
    document.head.appendChild(existingCanonical);
    mocks.result = readyResult({ page: { ...page, draft: true } });

    renderPage();

    expect(screen.getByText('Loaded MDX content')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(
      screen.getByRole('navigation', {
        name: 'Previous and next documentation',
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: /getting started/i })
        .getAttribute('href'),
    ).toBe('/documentation/developer/start');
    expect(
      screen
        .getByRole('link', { name: /authentication/i })
        .getAttribute('href'),
    ).toBe('/documentation/developer/auth');
    expect(screen.getByText('Table of contents')).toBeTruthy();

    await waitFor(() =>
      expect(document.title).toBe('API reference | Aerealith Documentation'),
    );
    expect(existingDescription.content).toBe('Developer documentation.');
    expect(existingCanonical.href).toBe(
      `${window.location.origin}/documentation/developer/api`,
    );
    expect(mocks.useDocContent).toHaveBeenCalledWith(
      'developer/api.mdx',
      expect.objectContaining({ components: expect.any(Object) }),
    );
  });

  it('creates missing metadata elements and omits an empty pager', async () => {
    mocks.result = readyResult({
      nextPage: undefined,
      previousPage: undefined,
    });
    renderPage();

    expect(
      screen.queryByRole('navigation', {
        name: 'Previous and next documentation',
      }),
    ).toBeNull();
    await waitFor(() =>
      expect(
        document.head.querySelector('meta[name="description"]'),
      ).toBeTruthy(),
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toBeTruthy();
  });

  it('renders one-sided previous and next navigation', () => {
    mocks.result = readyResult({ nextPage: undefined });
    const { unmount } = renderPage();
    expect(screen.getByText('Previous')).toBeTruthy();
    expect(screen.queryByText('Next')).toBeNull();
    unmount();

    mocks.result = readyResult({ previousPage: undefined });
    renderPage();
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('contains document rendering failures and logs their context', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mocks.contentError = new Error('Broken MDX');
    renderPage();

    expect(screen.getByRole('alert').textContent).toContain(
      'Unable to render document content',
    );
    expect(screen.getByText('Broken MDX')).toBeTruthy();
    expect(consoleError).toHaveBeenCalledWith(
      'Documentation document content failed',
      expect.any(Error),
      expect.any(Object),
    );
  });

  it('uses the safe production boundary message and optional TOC fallback', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.contentError = new Error('Sensitive detail');
    mocks.tocError = new Error('Optional failure');
    renderPage();

    expect(
      screen.getByText('This document could not be displayed.'),
    ).toBeTruthy();
    expect(screen.queryByText('Sensitive detail')).toBeNull();
    expect(screen.queryByText('Table of contents')).toBeNull();
  });
});
