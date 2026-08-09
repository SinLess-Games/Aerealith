import { FeatureFlag, type FeatureFlagKey } from '@aerealith-ai/core';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { useSession } from '../features/auth/use-session';
import { useFeatureFlag } from '../features/flags/feature-flags';
import { DashboardLayout } from './layouts/dashboard-layout';
import { DocsLayout } from './layouts/docs-layout';
import { PublicLayout } from './layouts/public-layout';
import { ErrorRoute, GlobalErrorBoundary } from './routes/[error].route';
import { AccountRoute } from './routes/auth/account.route';
import { AdminDashboardRoute } from './routes/auth/admin-dashboard.route';
import { AuthModal } from './routes/auth/auth-modal';
import { DashboardRoute } from './routes/auth/dashboard.route';
import { EntityViewerRoute } from './routes/auth/entity-viewer.route';
import { SignInRoute } from './routes/auth/sign-in.route';
import { SignUpRoute } from './routes/auth/sign-up.route';
import { ForgotPasswordRoute } from './routes/auth/forgot-password.route';
import { ResetPasswordRoute } from './routes/auth/reset-password.route';
import { SecurityRoute } from './routes/auth/security.route';
import { VerifyEmailRoute } from './routes/auth/verify-email.route';
import {
  DeveloperDocsRoute,
  DocsIndexRoute,
  UserDocsRoute,
} from './routes/docs-sites';
import { DocsNotFound } from './features/docs';
import { AboutRoute } from './routes/marketing-site/about.route';
import { ContactRoute } from './routes/marketing-site/contact.route';
import { HomeRoute } from './routes/marketing-site/home.route';
import { PolicyRoute } from './routes/marketing-site/policy.route';
import { PricingRoute } from './routes/marketing-site/pricing.route';

/**
 * Global application route table. The error boundary protects both the public
 * site and authenticated application shell from unhandled render failures.
 */
export function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        <Route path="documentation" element={<DocsLayout />}>
          <Route index element={<DocsIndexRoute />} />
          <Route path="user/*" element={<UserDocsRoute />} />
          <Route path="developer/*" element={<DeveloperDocsRoute />} />
          <Route path="*" element={<DocsNotFound />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="about" element={<AboutRoute />} />
          <Route
            path="pricing"
            element={
              <FlaggedRoute flag={FeatureFlag.Pricing}>
                <PricingRoute />
              </FlaggedRoute>
            }
          />
          <Route path="contact" element={<ContactRoute />} />
          <Route path="policies/:slug" element={<PolicyRoute />} />
          <Route
            path="sign-in"
            element={
              <FlaggedRoute flag={FeatureFlag.Authentication}>
                <>
                  <HomeRoute />
                  <AuthModal ariaLabel="Sign in">
                    <SignInRoute />
                  </AuthModal>
                </>
              </FlaggedRoute>
            }
          />
          <Route
            path="sign-up"
            element={
              <>
                <HomeRoute />
                <AuthModal ariaLabel="Create an account">
                  <SignUpRoute />
                </AuthModal>
              </>
            }
          />
          <Route path="signup" element={<Navigate to="/sign-up" replace />} />
          <Route path="forgot-password" element={<ForgotPasswordRoute />} />
          <Route path="reset-password" element={<ResetPasswordRoute />} />
          <Route path="verify-email" element={<VerifyEmailRoute />} />
          <Route path="*" element={<ErrorRoute error={{ status: 404 }} />} />
        </Route>
        <Route
          path="/app"
          element={
            <FlaggedRoute flag={FeatureFlag.Dashboard} redirect="/">
              <DashboardLayout />
            </FlaggedRoute>
          }
        >
          <Route index element={<DashboardRoute />} />
          <Route path="account" element={<AccountRoute />} />
          <Route path="security" element={<SecurityRoute />} />
          <Route
            path="admin"
            element={
              <SuperAdminRoute>
                <AdminDashboardRoute />
              </SuperAdminRoute>
            }
          />
          <Route
            path="admin/entities"
            element={
              <SuperAdminRoute>
                <EntityViewerRoute />
              </SuperAdminRoute>
            }
          />
        </Route>
      </Routes>
    </GlobalErrorBoundary>
  );
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  if (isLoading) return null;
  return user?.role === 'super_admin' ? (
    children
  ) : (
    <Navigate to="/app" replace />
  );
}

function FlaggedRoute({
  flag,
  redirect = '/',
  children,
}: {
  flag: FeatureFlagKey;
  redirect?: string;
  children: ReactNode;
}) {
  return useFeatureFlag(flag) ? children : <Navigate to={redirect} replace />;
}

export default AppRoutes;
