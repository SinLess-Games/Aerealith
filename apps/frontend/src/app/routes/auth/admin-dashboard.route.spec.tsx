// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminDashboardRoute } from './admin-dashboard.route';

describe('AdminDashboardRoute', () => {
  it('renders query-backed administrative metrics without fabricated telemetry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({
            ok: true,
            data: {
              totalUsers: 42,
              verifiedUsers: 36,
              activeSessions: 12,
              newUsersLast7Days: 7,
              superAdmins: 1,
              generatedAt: '2026-07-28T00:00:00.000Z',
            },
          }),
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <AdminDashboardRoute />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /admin dashboard/i }),
    ).toBeTruthy();
    expect(await screen.findByText('Total users')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Active sessions')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(
      screen.getByText(/durable audit activity is not available/i),
    ).toBeTruthy();
    expect(screen.queryByText('Recent activity')).toBeNull();
  });
});
