// apps/frontend/src/app/app.tsx

import { Background as PageBackground } from '@aerealith-ai/ui';
import { RouteTracker } from '../analytics/route-tracker';
import { PrivacySettings } from '../consent/privacy-settings';
import { IntegrationRuntime } from '../integrations/integration-runtime';
import { SearchConsoleVerification } from '../integrations/search-console-verification';
import { AppProviders } from './providers/app-providers';
import { AppRoutes } from './router';

/**
 * Application root: global providers (theme + accessibility) wrapping the route
 * table. `main.tsx` mounts this inside a `BrowserRouter`.
 */
export default function App() {
  return (
    <AppProviders>
      <IntegrationRuntime />
      <RouteTracker />
      <SearchConsoleVerification />
      <PageBackground
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        lightImage="/images/backgrounds/background-light.png"
        darkImage="/images/backgrounds/background-dark.png"
        mode="auto"
      />
      <AppRoutes />
      <PrivacySettings />
    </AppProviders>
  );
}
