import { Navigate, Route, Routes, useLocation } from 'react-router'

import { DashboardLayout } from './layouts/dashboard-layout'
import { PublicLayout } from './layouts/public-layout'
import { DocsNotFound } from './features/docs'
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
import {
  DeveloperDocsRoute,
  DocsIndexRoute,
  DocsLayout,
  UserDocsRoute,
} from './routes/docs-sites'

/**
 * Global application route table. The error boundary protects both the public
 * site and authenticated application shell from unhandled render failures.
 */
export function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        <Route path='/docs/*' element={<LegacyDocumentationRedirect />} />
        <Route path='/documentation' element={<DocsLayout />}>
          <Route index element={<DocsIndexRoute />} />
          <Route path='user/*' element={<UserDocsRoute />} />
          <Route path='developer/*' element={<DeveloperDocsRoute />} />
          <Route path='*' element={<DocsNotFound />} />
        </Route>
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

function LegacyDocumentationRedirect() {
  const location = useLocation()
  const legacyPath = location.pathname.replace(/^\/docs\/?/, '')
  const segments = legacyPath.split('/').filter(Boolean)

  if (segments[0] === 'users') segments[0] = 'user'
  if (segments[0] === 'developers') segments[0] = 'developer'

  const destination = `/documentation${segments.length ? `/${segments.join('/')}` : ''}`
  return (
    <Navigate replace to={`${destination}${location.search}${location.hash}`} />
  )
}

export default AppRoutes
