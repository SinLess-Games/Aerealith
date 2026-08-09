// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SecurityRoute } from './security.route';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function renderRoute() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <SecurityRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SecurityRoute', () => {
  it('labels the current session and revokes another session', async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 200,
        json: () =>
          Promise.resolve({
            ok: true,
            data: {
              sessions: [
                { id: 'current', current: true, deviceName: 'This browser' },
                { id: 'other', current: false, deviceName: 'Phone' },
              ],
            },
          }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ ok: true, data: null }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ ok: true, data: { sessions: [] } }),
      });

    renderRoute();
    expect(await screen.findByText('Current session')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /revoke session/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/sessions/other',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
    expect(await screen.findByText('Phone has been revoked.')).toBeTruthy();
  });
});
