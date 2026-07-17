import { Route, Routes } from 'react-router'

import { DashboardLayout } from './layouts/dashboard-layout'
import { PublicLayout } from './layouts/public-layout'
import { ErrorRoute, GlobalErrorBoundary } from './routes/[error].route'
import { AccountRoute } from './routes/auth/account.route'
import { DashboardRoute } from './routes/auth/dashboard.route'
import { SignInRoute } from './routes/auth/sign-in.route'
import { SignUpRoute } from './routes/auth/sign-up.route'
import { AboutRoute } from './routes/marketing-site/about.route'
import { ContactRoute } from './routes/marketing-site/contact.route'
import { HomeRoute } from './routes/marketing-site/home.route'
import { PolicyRoute } from './routes/marketing-site/policy.route'
import { PricingRoute } from './routes/marketing-site/pricing.route'

/**
 * Global application route table. The error boundary protects both the public
 * site and authenticated application shell from unhandled render failures.
 */
export function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path='about' element={<AboutRoute />} />
          <Route path='pricing' element={<PricingRoute />} />
          <Route path='contact' element={<ContactRoute />} />
          <Route path='policies/:slug' element={<PolicyRoute />} />
          <Route path='sign-in' element={<SignInRoute />} />
          <Route path='sign-up' element={<SignUpRoute />} />
          <Route path='*' element={<ErrorRoute error={{ status: 404 }} />} />
        </Route>
        <Route path='/app' element={<DashboardLayout />}>
          <Route index element={<DashboardRoute />} />
          <Route path='account' element={<AccountRoute />} />
        </Route>
      </Routes>
    </GlobalErrorBoundary>
  )
}

export default AppRoutes
