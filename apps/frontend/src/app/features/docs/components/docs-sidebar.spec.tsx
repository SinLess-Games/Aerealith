// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsSidebar } from './docs-sidebar';

const rootPage = {
  audience: 'developer',
  badge: 'Root',
  isIndex: true,
  title: 'Developer home',
  url: '/documentation/developer',
};

const tree = {
  audience: 'developer',
  rootPage,
  children: [
    {
      children: [
        {
          children: [],
          page: { badge: 'New', isIndex: false },
          segment: 'install',
          title: 'Install',
          url: '/documentation/developer/guides/install',
        },
      ],
      page: { isIndex: true },
      segment: 'guides',
      title: 'Guides',
      url: '/documentation/developer/guides',
    },
    {
      children: [
        {
          children: [],
          page: { isIndex: false },
          segment: 'errors',
          title: 'Errors',
          url: '/documentation/developer/reference/errors',
        },
      ],
      segment: 'reference',
      title: 'Reference',
    },
  ],
};

function renderSidebar(
  props: Record<string, unknown> = {},
  pathname = '/documentation/developer/guides/install',
) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <DocsSidebar audience="developer" tree={tree as never} {...props} />
    </MemoryRouter>,
  );
}

describe('DocsSidebar', () => {
  beforeEach(() => {
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
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 7;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders an active nested tree and toggles folder expansion', () => {
    const onNavigate = vi.fn();
    const { container } = renderSidebar({
      className: 'sidebar-shell',
      desktopClassName: 'desktop-shell',
      onMobileClose: onNavigate,
    });

    expect(container.querySelector('aside')?.dataset['audience']).toBe(
      'developer',
    );
    expect(
      screen.getByRole('complementary', {
        name: 'Developer documentation sidebar',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('navigation', {
        name: 'Developer documentation navigation',
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: /install/i })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('Reference')).toBeTruthy();

    const collapseGuides = screen.getByRole('button', {
      name: 'Collapse Guides',
    });
    fireEvent.click(collapseGuides);
    expect(screen.queryByRole('link', { name: /install/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Guides' }));
    expect(screen.getByRole('link', { name: /install/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Expand Reference' }));
    expect(screen.getByRole('link', { name: /errors/i })).toBeTruthy();
  });

  it('renders child-only and empty trees with audience-specific labels', () => {
    const childOnlyTree = {
      audience: 'user',
      children: [
        {
          children: [],
          page: { isIndex: false },
          segment: 'account',
          title: 'Account',
          url: '/documentation/user/account',
        },
      ],
    };
    const { unmount } = render(
      <MemoryRouter initialEntries={['/documentation/user/account']}>
        <DocsSidebar audience="user" tree={childOnlyTree as never} />
      </MemoryRouter>,
    );
    expect(screen.getByText('User documentation')).toBeTruthy();
    expect(screen.getByRole('link', { name: /account/i })).toBeTruthy();
    unmount();

    render(
      <MemoryRouter>
        <DocsSidebar
          audience="user"
          tree={{ audience: 'user', children: [] } as never}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('No pages available')).toBeTruthy();
    expect(screen.getByText(/No user documentation pages/)).toBeTruthy();
  });

  it('opens, focuses, cancels, navigates, and cleans up the mobile dialog', () => {
    const onClose = vi.fn();
    const onEscape = vi.fn(() => true) as unknown as () => void;
    const { unmount } = renderSidebar({
      mobileClassName: 'mobile-panel',
      mobileId: 'mobile-docs',
      mobileOpen: true,
      onMobileClose: onClose,
      onMobileEscape: onEscape,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Developer documentation navigation',
    });
    expect(dialog.id).toBe('mobile-docs');
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(
      screen.getAllByRole('button', { name: 'Close documentation navigation' }),
    ).toHaveLength(2);

    const cancellation = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancellation);
    expect(cancellation.defaultPrevented).toBe(true);
    expect(onEscape).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Close documentation navigation',
      })[1]!,
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('link', { name: /install/i })[1]!);
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('falls back to the close callback when Escape has no dedicated handler', () => {
    const onClose = vi.fn();
    renderSidebar({ mobileOpen: true, onMobileClose: onClose });
    fireEvent(
      screen.getByRole('dialog', {
        name: 'Developer documentation navigation',
      }),
      new Event('cancel', { cancelable: true }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
