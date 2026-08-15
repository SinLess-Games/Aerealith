// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { DocsHeader } from './docs-header';

describe('DocsHeader', () => {
  it('renders branding, audience status, actions, and the sidebar control', () => {
    const onOpenSidebar = vi.fn();
    render(
      <MemoryRouter initialEntries={['/documentation/user']}>
        <DocsHeader
          audience="user"
          isSidebarOpen
          onOpenSidebar={onOpenSidebar}
          showSidebarButton
          showThemeToggle={false}
          productName="Test product"
          productSubtitle="Guides"
          actions={<button type="button">Extra action</button>}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Test product Guides home' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Current section: User documentation'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Extra action' })).toBeTruthy();

    const sidebarButton = screen.getByRole('button', {
      name: 'Open documentation navigation',
    });
    expect(sidebarButton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(sidebarButton);
    expect(onOpenSidebar).toHaveBeenCalledOnce();
  });

  it('can omit optional navigation and controls', () => {
    render(
      <MemoryRouter>
        <DocsHeader
          showAudienceSwitcher={false}
          showMainSiteLink={false}
          showSidebarButton
          showThemeToggle={false}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Main site' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Open documentation navigation' }),
    ).toBeNull();
  });
});
