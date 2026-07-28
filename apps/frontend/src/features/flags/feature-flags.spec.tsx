// @vitest-environment jsdom
import { FeatureFlag, FeatureFlagDefaults } from '@aerealith-ai/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FeatureFlagsProvider,
  fetchFeatureFlags,
  useFeatureFlag,
} from './feature-flags';

afterEach(() => vi.unstubAllGlobals());

describe('frontend feature flags', () => {
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
