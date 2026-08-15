// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsTableOfContents } from './docs-table-of-contents';

const observerState = {
  callback: undefined as IntersectionObserverCallback | undefined,
  disconnect: vi.fn(),
  observe: vi.fn(),
};

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    observerState.callback = callback;
  }

  disconnect = observerState.disconnect;
  observe = observerState.observe;
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}

function addSection(id: string, top: number) {
  const section = document.createElement('section');
  section.id = id;
  section.getBoundingClientRect = vi.fn(() => ({
    bottom: top + 40,
    height: 40,
    left: 0,
    right: 100,
    toJSON: () => ({}),
    top,
    width: 100,
    x: 0,
    y: top,
  }));
  document.body.appendChild(section);
  return section;
}

describe('DocsTableOfContents', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/documentation');
    observerState.callback = undefined;
    observerState.disconnect.mockReset();
    observerState.observe.mockReset();
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hides an empty table by default and can render its empty state', () => {
    const { container, rerender } = render(
      <DocsTableOfContents headings={[]} />,
    );
    expect(container.querySelector('aside')).toBeNull();

    rerender(
      <DocsTableOfContents
        headings={[]}
        hideWhenEmpty={false}
        sticky={false}
        eyebrow="Contents"
        label="Sections"
        maxHeightClassName="max-h-none"
      />,
    );
    expect(
      screen.getByRole('complementary', {
        name: 'Sections table of contents',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText('This page does not contain any section headings.'),
    ).toBeTruthy();
    expect(screen.getByText('Contents')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull();
  });

  it('normalizes, filters, decodes, and indents generated headings', () => {
    window.history.replaceState({}, '', '/documentation#deep%20section');
    vi.mocked(window.requestAnimationFrame).mockImplementation(() => 1);
    addSection('overview', 20);
    addSection('deep section', 160);
    addSection('%E0%A4%A', 300);

    const { container } = render(
      <DocsTableOfContents
        className="custom-toc"
        minDepth={1.8}
        maxDepth={8.2}
        headings={[
          { depth: 1, title: 'Filtered', url: '#filtered' },
          { depth: 2, title: ' Overview ', url: '/page#overview' },
          { depth: 3.9, title: 'Deep section', url: 'deep%20section' },
          { depth: 4, title: 'Broken encoding', url: '#%E0%A4%A' },
          { depth: 5, title: 'Deepest', url: '#deepest' },
          { depth: 9, title: 'Too deep', url: '#too-deep' },
          { depth: Number.NaN, title: 'Default depth', url: '#default' },
          { depth: 2, title: ' ', url: '#blank-title' },
          { depth: 2, title: 'No URL' },
          { depth: 2, title: 'Blank URL', url: ' ' },
          { depth: 2, title: 'Blank ID', url: '#' },
        ]}
      />,
    );

    expect(screen.getByText('Filtered').closest('li')?.className).toContain(
      'pl-0',
    );
    expect(screen.queryByText('Too deep')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Overview' }).getAttribute('href'),
    ).toBe('#overview');
    expect(
      screen.getByRole('link', { name: 'Deep section' }).getAttribute('href'),
    ).toBe('#deep%20section');
    expect(
      screen
        .getByRole('link', { name: 'Deep section' })
        .getAttribute('aria-current'),
    ).toBe('location');
    expect(screen.getByText('Deep section').closest('li')?.className).toContain(
      'pl-3',
    );
    expect(
      screen.getByText('Broken encoding').closest('li')?.className,
    ).toContain('pl-6');
    expect(screen.getByText('Deepest').closest('li')?.className).toContain(
      'pl-8',
    );
    expect(
      screen.getByText('Default depth').closest('li')?.className,
    ).toContain('pl-0');
    expect(screen.getByText('3 of 6')).toBeTruthy();
    expect(container.querySelector('aside')?.className).toContain('custom-toc');
  });

  it('tracks the closest visible heading with an intersection observer', async () => {
    const first = addSection('first', 90);
    const second = addSection('second', 250);
    const { unmount } = render(
      <DocsTableOfContents
        page={{
          headings: [
            { depth: 2, title: 'First', url: '#first' },
            { depth: 2, title: 'Second', url: '#second' },
          ],
        }}
      />,
    );

    await waitFor(() =>
      expect(
        screen
          .getByRole('link', { name: 'First' })
          .getAttribute('aria-current'),
      ).toBe('location'),
    );
    expect(observerState.observe).toHaveBeenCalledTimes(2);
    expect(screen.getByText('1 of 2')).toBeTruthy();

    first.getBoundingClientRect = vi.fn(() => ({ top: -100 }) as DOMRect);
    second.getBoundingClientRect = vi.fn(() => ({ top: 100 }) as DOMRect);
    act(() => observerState.callback?.([], {} as IntersectionObserver));
    await waitFor(() =>
      expect(
        screen
          .getByRole('link', { name: 'Second' })
          .getAttribute('aria-current'),
      ).toBe('location'),
    );
    unmount();
    expect(observerState.disconnect).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('updates from valid hashes and falls back to geometry for unknown hashes', async () => {
    addSection('alpha', -20);
    addSection('beta', 300);
    render(
      <DocsTableOfContents
        headings={[
          { title: 'Alpha', url: '#alpha' },
          { title: 'Beta', url: '#beta' },
        ]}
      />,
    );

    window.history.replaceState({}, '', '/documentation#beta');
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    expect(
      screen.getByRole('link', { name: 'Beta' }).getAttribute('aria-current'),
    ).toBe('location');

    window.history.replaceState({}, '', '/documentation#unknown');
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    await waitFor(() =>
      expect(
        screen
          .getByRole('link', { name: 'Alpha' })
          .getAttribute('aria-current'),
      ).toBe('location'),
    );
  });

  it('works without IntersectionObserver and reports singular inactive progress', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    vi.mocked(window.requestAnimationFrame).mockImplementation(() => 1);
    addSection('only', 200);
    render(
      <DocsTableOfContents
        headings={[{ depth: 2, title: 'Only', url: '#only' }]}
      />,
    );

    await waitFor(() => expect(screen.getByText('1 section')).toBeTruthy());
    expect(screen.getByRole('link', { name: 'Top' }).getAttribute('href')).toBe(
      '#docs-main-content',
    );
  });

  it('renders a plural inactive count when no matching document elements exist', () => {
    render(
      <DocsTableOfContents
        headings={[
          { title: 'Absent one', url: '#absent-one' },
          { title: 'Absent two', url: '#absent-two' },
        ]}
      />,
    );

    expect(screen.getByText('2 sections')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Absent one' })
        .getAttribute('aria-current'),
    ).toBeNull();
  });
});
