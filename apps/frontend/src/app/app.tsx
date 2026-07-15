// apps/frontend/src/app/app.tsx

import { AppRoutes } from './router'
import { AppProviders } from './providers/app-providers'

/**
 * Application root: global providers (theme + accessibility) wrapping the route
 * table. `main.tsx` mounts this inside a `BrowserRouter`.
 */
export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
