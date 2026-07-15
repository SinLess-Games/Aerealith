// apps/frontend/src/app/router.tsx

import { Route, Routes } from 'react-router'

import { DashboardLayout } from './layouts/dashboard-layout'
import { PublicLayout } from './layouts/public-layout'
import { AboutRoute } from './routes/about.route'
import { AccountRoute } from './routes/account.route'
import { ContactRoute } from './routes/contact.route'
import { DashboardRoute } from './routes/dashboard.route'
import { HomeRoute } from './routes/home.route'
import { NotFoundRoute } from './routes/not-found.route'
import { PolicyRoute } from './routes/policy.route'
import { PricingRoute } from './routes/pricing.route'
import { SignInRoute } from './routes/sign-in.route'
import { SignUpRoute } from './routes/sign-up.route'

/**
 * Application route table. The public marketing pages render inside
 * {@link PublicLayout}; the authenticated app shell and its routes are added in
 * a later step (0.4-06/07).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomeRoute />} />
        <Route path='about' element={<AboutRoute />} />
        <Route path='pricing' element={<PricingRoute />} />
        <Route path='contact' element={<ContactRoute />} />
        <Route path='policies/:slug' element={<PolicyRoute />} />
        <Route path='sign-in' element={<SignInRoute />} />
        <Route path='sign-up' element={<SignUpRoute />} />
        <Route path='*' element={<NotFoundRoute />} />
      </Route>
      <Route path='/app' element={<DashboardLayout />}>
        <Route index element={<DashboardRoute />} />
        <Route path='account' element={<AccountRoute />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
