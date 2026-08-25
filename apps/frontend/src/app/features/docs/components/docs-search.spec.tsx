// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useLocation, MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsSearch } from './docs-search';

const docsSourceMock = vi.hoisted(() => ({
  getAudienceFromDocsUrl: vi.fn(() => 'developer' as const),
  searchDocs: vi.fn(),
}));

vi.mock('../../../../lib/docs-source', () => ({
  getAudienceFromDocsUrl: docsSourceMock.getAudienceFromDocsUrl,
  searchDocs: docsSourceMock.searchDocs,
}));

const developerResult = {
  matchedFields: ['title'],
  page: {
    audience: 'developer',
    badge: 'API',
    description: 'Authenticate requests to the API.',
    title: 'API authentication',
    url: '/documentation/developer/api/authentication',
  },
  score: 10,
};

const userResult = {
  matchedFields: ['description'],
  page: {
    audience: 'user',
    description: 'Manage your account and preferences.',
    title: 'Account settings',
    url: '/documentation/user/account',
  },
  score: 5,
};

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderSearch(props: React.ComponentProps<typeof DocsSearch> = {}) {
  return render(
    <MemoryRouter initialEntries={['/documentation/developer/getting-started']}>
      <DocsSearch {...props} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('DocsSearch', () => {
  beforeEach(() => {
    docsSourceMock.getAudienceFromDocsUrl
      .mockReset()
      .mockReturnValue('developer');
    docsSourceMock.searchDocs
      .mockReset()
      .mockImplementation((query: string) =>
        query.trim().length > 0 ? [developerResult, userResult] : [],
      );

    Object.defineProperties(HTMLDialogElement.prototype, {
      close: {
        configurable: true,
        value: vi.fn(function close(this: HTMLDialogElement) {
          this.removeAttribute('open');
        }),
      },
      showModal: {
        configurable: true,
        value: vi.fn(function showModal(this: HTMLDialogElement) {
          this.setAttribute('open', '');
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a scoped dialog and searches the current documentation audience', async () => {
    renderSearch({ className: 'header-search', maxResults: 4 });

    const trigger = screen.getByRole('button', {
      name: /Search documentation/,
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Ctrl')).toBeTruthy();

    fireEvent.click(trigger);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Searching developer documentation')).toBeTruthy();
    expect(screen.getByText('Find documentation quickly')).toBeTruthy();
    expect(docsSourceMock.getAudienceFromDocsUrl).toHaveBeenCalledWith(
      '/documentation/developer/getting-started',
    );
    expect(docsSourceMock.searchDocs).toHaveBeenLastCalledWith('', {
      audience: 'developer',
      limit: 4,
    });

    const input = screen.getByRole('searchbox', {
      name: 'Search documentation',
    });
    fireEvent.change(input, { target: { value: 'api' } });

    expect(
      await screen.findByRole('link', { name: /api authentication/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /account settings/i }),
    ).toBeTruthy();
    expect(screen.getByText('2 results')).toBeTruthy();
    expect(screen.getByText('API')).toBeTruthy();
    expect(docsSourceMock.searchDocs).toHaveBeenLastCalledWith('api', {
      audience: 'developer',
      limit: 4,
    });
  });

  it('supports keyboard result navigation and opens the selected result', async () => {
    renderSearch();
    fireEvent.click(
      screen.getByRole('button', { name: /Search documentation/ }),
    );
    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'settings' } });
    await screen.findByRole('link', { name: /account settings/i });

    const first = screen.getByRole('link', { name: /api authentication/i });
    const second = screen.getByRole('link', { name: /account settings/i });
    expect(first.getAttribute('aria-current')).toBe('true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(second.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(first.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(second.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(input, { key: 'Home' });
    expect(first.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(input, { key: 'End' });
    expect(second.getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/documentation/user/account',
      ),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens from the global shortcut but ignores editable shortcut targets', async () => {
    render(
      <MemoryRouter>
        <input aria-label="Existing editor" />
        <DocsSearch compact />
      </MemoryRouter>,
    );

    const editor = screen.getByRole('textbox', { name: 'Existing editor' });
    fireEvent.keyDown(editor, { ctrlKey: true, key: 'k' });
    expect(screen.queryByRole('dialog')).toBeNull();

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'K',
    });
    act(() => window.dispatchEvent(event));

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders all-audience empty results and clears a query', async () => {
    docsSourceMock.searchDocs.mockReturnValue([]);
    renderSearch({
      audience: 'user',
      emptyMessage: 'Try a broader phrase.',
      searchAllAudiences: true,
      showShortcut: false,
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Search documentation/ }),
    );
    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'missing' } });

    expect(await screen.findByText('No results for “missing”')).toBeTruthy();
    expect(screen.getByText('Try a broader phrase.')).toBeTruthy();
    expect(screen.getByText('Searching all documentation')).toBeTruthy();
    expect(screen.getByText('No results')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear documentation search' }),
    );
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByText('Enter a search term')).toBeTruthy();
  });

  it('closes through dialog cancellation, the close button, and result links', async () => {
    renderSearch({ audience: 'user', enableShortcut: false });
    const trigger = screen.getByRole('button', {
      name: /Search documentation/,
    });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog');
    const cancellation = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancellation);
    expect(cancellation.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(trigger);
    await screen.findByRole('dialog');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Close documentation search' })[1]!,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(trigger);
    const input = await screen.findByRole('searchbox');
    fireEvent.change(input, { target: { value: 'api' } });
    const result = await screen.findByRole('link', {
      name: /api authentication/i,
    });
    fireEvent.pointerMove(result);
    fireEvent.focus(result);
    fireEvent.click(result);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('submits the active result and tolerates no-result keyboard input', async () => {
    renderSearch({
      audience: 'user',
      compact: true,
      triggerLabel: 'Find docs',
    });
    fireEvent.click(screen.getByRole('button', { name: /Find docs/ }));
    const input = await screen.findByRole('searchbox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByTestId('location').textContent).toBe(
      '/documentation/developer/getting-started',
    );

    fireEvent.change(input, { target: { value: 'api' } });
    await screen.findByRole('link', { name: /api authentication/i });
    fireEvent.submit(screen.getByRole('search'));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/documentation/developer/api/authentication',
      ),
    );
  });
});
