// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from './providers/app-providers';
import { AppRoutes } from './router';

// The header checks the session on render; keep it deterministically signed-out.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 401,
      json: () =>
        Promise.resolve({
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  it('renders the home page at the index route', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Your Digital Life',
    );
  });

  it('renders the about page at /about', () => {
    renderAt('/about');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Intelligent by Design',
    );
  });

  it('renders the pricing page at /pricing', () => {
    renderAt('/pricing');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'One platform',
    );
  });

  it('renders the contact page at /contact', () => {
    renderAt('/contact');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Build the Future',
    );
  });

  it('renders a policy document at /policies/:slug', () => {
    renderAt('/policies/privacy');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Privacy Policy',
    );
  });

  it('renders the 404 page for an unknown policy slug', () => {
    renderAt('/policies/does-not-exist');

    expect(screen.getByText(/404/)).toBeTruthy();
  });

  it('renders the 404 page for an unknown path', () => {
    renderAt('/does-not-exist');

    expect(screen.getByText(/404/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /not found/i })).toBeTruthy();
  });

  it('opens sign in as a modal over the home page', () => {
    renderAt('/sign-in');

    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 1, name: /Your Digital Life/i }),
    ).toBeTruthy();
  });

  it('opens account creation as a modal', () => {
    renderAt('/sign-up');

    expect(
      screen.getByRole('dialog', { name: 'Create an account' }),
    ).toBeTruthy();
  });

  it('renders the password recovery route', () => {
    renderAt('/forgot-password');

    expect(
      screen.getByRole('heading', { level: 1, name: /reset your password/i }),
    ).toBeTruthy();
  });

  it('explains a password reset link without its token', () => {
    renderAt('/reset-password');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /reset link unavailable/i,
      }),
    ).toBeTruthy();
  });

  it('supports the common signup URL alias', async () => {
    renderAt('/signup');

    expect(
      await screen.findByRole('dialog', { name: 'Create an account' }),
    ).toBeTruthy();
  });

  it('shows the primary navigation in the public layout', () => {
    renderAt('/');

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeTruthy();
  });

  it('renders the documentation home in the documentation shell', () => {
    renderAt('/documentation');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Aerealith Documentation',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Aerealith documentation home' }),
    ).toBeTruthy();
  });

  it('renders user documentation at its audience route', async () => {
    renderAt('/documentation/user');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'User Documentation',
      }),
    ).toBeTruthy();
  });

  it('renders developer documentation at its audience route', async () => {
    renderAt('/documentation/developer');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Developer Documentation',
      }),
    ).toBeTruthy();
  });

  it('keeps unknown documentation paths within the documentation experience', () => {
    renderAt('/documentation/unknown-section');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Documentation page not found',
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Documentation home' })
        .getAttribute('href'),
    ).toBe('/documentation');
  });
});
