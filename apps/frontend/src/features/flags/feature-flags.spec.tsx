// @vitest-environment jsdom
import { FeatureFlag, FeatureFlagDefaults } from '@aerealith-ai/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FeatureFlagsProvider,
  fetchFeatureFlags,
  useFeatureFlag,
} from './feature-flags';

afterEach(() => vi.unstubAllGlobals());

describe('frontend feature flags', () => {
  it('waits for Flagship before rendering flag-gated application content', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <FeatureFlagsProvider waitForRemote>
          <div>flagship content</div>
        </FeatureFlagsProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByText('flagship content')).toBeNull();
    resolveResponse?.(Response.json({ dashboard: false }));
    await screen.findByText('flagship content');
  });

  it('validates remote values and fills missing flags from defaults', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ pricing: false, registration: true }),
        ),
    );
    const flags = await fetchFeatureFlags();
    expect(flags[FeatureFlag.Pricing]).toBe(false);
    expect(flags[FeatureFlag.Registration]).toBe(true);
    expect(flags[FeatureFlag.Dashboard]).toBe(
      FeatureFlagDefaults[FeatureFlag.Dashboard],
    );
  });

  it('provides live values to components', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ dashboard: false })),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useFeatureFlag(FeatureFlag.Dashboard), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBe(false));
  });
});
