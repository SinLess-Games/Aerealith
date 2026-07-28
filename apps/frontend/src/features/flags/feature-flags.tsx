import {
  AllFeatureFlagKeys,
  FeatureFlagDefaults,
  type FeatureFlagKey,
  type FeatureFlagValues,
} from '@aerealith-ai/core';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const FeatureFlagsContext = createContext<FeatureFlagValues>({
  ...FeatureFlagDefaults,
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const value = useMemo(
    () => ({ ...FeatureFlagDefaults, ...query.data }),
    [query.data],
  );

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
