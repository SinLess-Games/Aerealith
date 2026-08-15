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

  it('uses server authorization instead of the legacy role projection for admin routes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input);
        if (path === '/api/V1/flags') {
          return { ok: true, status: 200, json: async () => ({}) };
        }
        if (path === '/api/V1/auth/me') {
          return {
            status: 200,
            json: async () => ({
              ok: true,
              data: {
                id: 'user-1',
                username: 'normal-user',
                email: 'normal@example.com',
                emailVerified: true,
                role: 'super_admin',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            }),
          };
        }
        if (path === '/api/V1/admin/overview') {
          return {
            status: 403,
            json: async () => ({
              ok: false,
              error: { code: 'FORBIDDEN', message: 'Forbidden' },
            }),
          };
        }
        return {
          status: 200,
          json: async () => ({
            ok: true,
            data: { avatarUrl: null, timezone: null, locale: null },
          }),
        };
      }),
    );

    renderAt('/app/admin');

    expect(await screen.findByText('Command center')).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: /admin dashboard/i }),
    ).toBeNull();
  });

  it('never renders privileged admin UI while session state is loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );

    renderAt('/app/admin');

    expect(screen.getByText(/loading your workspace/i)).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: /admin dashboard/i }),
    ).toBeNull();
  });

  it('shows a temporary failure state instead of redirecting on auth-service errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/V1/flags') {
          return { ok: true, status: 200, json: async () => ({}) };
        }
        return {
          status: 503,
          json: async () => ({
            ok: false,
            error: {
              code: 'AUTH_SERVICE_UNAVAILABLE',
              message: 'Authentication is temporarily unavailable',
            },
          }),
        };
      }),
    );

    renderAt('/app');

    expect(
      await screen.findByRole('heading', {
        name: /authentication is temporarily unavailable/i,
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/welcome,/i)).toBeNull();
  });
});
