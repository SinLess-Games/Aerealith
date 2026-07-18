// apps/frontend/src/app/app.tsx

import { Background as PageBackground } from '@aerealith-ai/ui'
import { AppProviders } from './providers/app-providers'
import { AppRoutes } from './router'

/**
 * Application root: global providers (theme + accessibility) wrapping the route
 * table. `main.tsx` mounts this inside a `BrowserRouter`.
 */
export default function App() {
  return (
    <AppProviders>
      <PageBackground
        aria-hidden='true'
        className='fixed inset-0 -z-10'
        lightImage='/images/backgrounds/background-light.png'
        darkImage='/images/backgrounds/background-dark.png'
        mode='auto'
      />
      <AppRoutes />
    </AppProviders>
  )
}
