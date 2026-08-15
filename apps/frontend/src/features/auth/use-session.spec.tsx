// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SESSION_QUERY_KEY,
  useLogout,
  useSession,
  useSignUp,
} from './use-session';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useSession', () => {
  it('resolves to a signed-out state on a 401', async () => {
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

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('exposes the user when authenticated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({ ok: true, data: { id: 'u1', username: 'ada' } }),
      }),
    );

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.username).toBe('ada');
  });

  it('surfaces temporary auth-service failures instead of treating them as logout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 503,
        json: () =>
          Promise.resolve({
            ok: false,
            error: {
              code: 'AUTH_SERVICE_UNAVAILABLE',
              message: 'Authentication is temporarily unavailable',
            },
          }),
      }),
    );

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error?.status).toBe(503);
  });
});

describe('useLogout', () => {
  it('calls the logout endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true, data: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('useSignUp', () => {
  it('does not treat an unverified registration as an authenticated UI session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 201,
        json: () =>
          Promise.resolve({
            ok: true,
            data: {
              id: 'u1',
              username: 'ada',
              email: 'ada@example.com',
              emailVerified: false,
            },
          }),
      }),
    );
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSignUp(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        username: 'ada',
        email: 'ada@example.com',
        password: 'Password 1!',
      });
    });

    expect(client.getQueryData(SESSION_QUERY_KEY)).toBeUndefined();
  });
});
