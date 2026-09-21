// apps/frontend/src/app/providers/app-providers.tsx

import { AccessibilityProvider, ThemeProvider } from '@aerealith-ai/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { ConsentProvider } from '../../consent/consent-context';
import { FeatureFlagsProvider } from '../../features/flags/feature-flags';
import { BrowserObservabilityGate } from '../../features/observability/browser-observability-gate';

/**
 * App-wide context providers:
 * - `ThemeProvider` applies the light/dark theme (keyed on `[data-theme]`).
 * - `AccessibilityProvider` applies contrast/motion/reading preferences.
 * - `QueryClientProvider` supplies TanStack Query for server state (auth, etc.).
 */
export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <FeatureFlagsProvider>
          <BrowserObservabilityGate />
          <ThemeProvider>
            <AccessibilityProvider>{children}</AccessibilityProvider>
          </ThemeProvider>
        </FeatureFlagsProvider>
      </ConsentProvider>
    </QueryClientProvider>
  );
}
