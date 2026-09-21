// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiRunsPanel } from './ai-runs-panel';

afterEach(() => vi.unstubAllGlobals());

describe('AiRunsPanel', () => {
  it('renders recent runs and cancels active work', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/V1/ai/runs?limit=50' && method === 'GET') {
          return Response.json({
            ok: true,
            data: [
              {
                id: '12345678-1234-4234-9234-123456789012',
                status: 'running',
                capability: 'code',
                createdAt: '2026-09-21T00:00:00.000Z',
                updatedAt: '2026-09-21T00:00:01.000Z',
                providerId: 'cloudflare-workers-ai',
                modelId: 'code-model',
              },
            ],
            pagination: { nextBefore: null },
          });
        }

        if (
          url ===
            '/api/V1/ai/runs/12345678-1234-4234-9234-123456789012' &&
          method === 'DELETE'
        ) {
          return Response.json({
            ok: true,
            data: {
              id: '12345678-1234-4234-9234-123456789012',
              status: 'cancelled',
              capability: 'code',
              createdAt: '2026-09-21T00:00:00.000Z',
              updatedAt: '2026-09-21T00:00:02.000Z',
            },
          });
        }

        throw new Error('Unexpected run fetch: ' + method + ' ' + url);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <AiRunsPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('code')).toBeTruthy();
    expect(screen.getByText('running')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Cancel run/,
      }),
    );

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            String(input).includes('/api/V1/ai/runs/12345678') &&
            (init as RequestInit | undefined)?.method === 'DELETE',
        ),
      ).toBe(true);
    });
  });
});
