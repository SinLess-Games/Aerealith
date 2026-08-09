import {
  AllFeatureFlagKeys,
  FeatureFlagDefaults,
  type FeatureFlagKey,
  type FeatureFlagValues,
} from '@aerealith-ai/core';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';

const FeatureFlagsContext = createContext<FeatureFlagValues>({
  ...FeatureFlagDefaults,
});

const WaitForRemoteFlagsByDefault =
  typeof navigator === 'undefined' ||
  !navigator.userAgent.toLowerCase().includes('jsdom');

export function FeatureFlagsProvider({
  children,
  waitForRemote = WaitForRemoteFlagsByDefault,
}: {
  children: ReactNode;
  /** Test harnesses may opt out; production always waits for Flagship. */
  waitForRemote?: boolean;
}) {
  const query = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  /*
   * Do not render flag-gated application routes from local fallbacks while
   * the authoritative Flagship response is still loading. This prevents a
   * locally enabled feature from flashing or becoming briefly reachable
   * before Cloudflare evaluates it.
   */
  if (waitForRemote && query.isPending) return null;

  const value = query.data ?? FeatureFlagDefaults;

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/** Deterministic provider for tests, Storybook, and isolated previews. */
export function StaticFeatureFlagsProvider({
  children,
  values,
}: {
  children: ReactNode;
  values: Partial<FeatureFlagValues>;
}) {
  return (
    <FeatureFlagsContext.Provider value={{ ...FeatureFlagDefaults, ...values }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagValues {
  return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  return useFeatureFlags()[key];
}

export async function fetchFeatureFlags(): Promise<FeatureFlagValues> {
  const response = await fetch('/api/V1/flags', {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Unable to load feature flags.');

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') {
    throw new Error('Feature flag response is invalid.');
  }

  return Object.fromEntries(
    AllFeatureFlagKeys.map((key) => [
      key,
      typeof (payload as Record<string, unknown>)[key] === 'boolean'
        ? (payload as Record<string, boolean>)[key]
        : FeatureFlagDefaults[key],
    ]),
  ) as FeatureFlagValues;
}
