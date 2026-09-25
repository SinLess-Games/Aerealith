import { FeatureFlag, type FeatureFlagKey } from '@aerealith-ai/core';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import {
  ADMIN_OVERVIEW_QUERY_KEY,
  fetchAdminOverview,
} from '../features/admin/admin-api';
import { useSession } from '../features/auth/use-session';
import { useFeatureFlag } from '../features/flags/feature-flags';
import { DashboardLayout } from './layouts/dashboard-layout';
import { DocsLayout } from './layouts/docs-layout';
import { PublicLayout } from './layouts/public-layout';
import { ErrorRoute, GlobalErrorBoundary } from './routes/[error].route';
import { AccountRoute } from './routes/auth/account.route';
import { AiStudioRoute } from './routes/auth/ai-studio.route';
import { AdminDashboardRoute } from './routes/auth/admin-dashboard.route';
import { AuthModal } from './routes/auth/auth-modal';
import { DashboardRoute } from './routes/auth/dashboard.route';
import { EntityViewerRoute } from './routes/auth/entity-viewer.route';
import { SignInRoute } from './routes/auth/sign-in.route';
import { SignUpRoute } from './routes/auth/sign-up.route';
import { ForgotPasswordRoute } from './routes/auth/forgot-password.route';
import { ResetPasswordRoute } from './routes/auth/reset-password.route';
import { SecurityRoute } from './routes/auth/security.route';
import { ProfileRoute } from './routes/auth/profile.route';
import { ObservabilityRoute } from './routes/auth/observability.route';
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
  const maintenanceMode = useFeatureFlag(FeatureFlag.MaintenanceMode);

  if (maintenanceMode) {
    return (
      <GlobalErrorBoundary>
        <MaintenanceRoute />
      </GlobalErrorBoundary>
    );
  }

  return (
    <GlobalErrorBoundary>
      <Routes>
        <Route
          path="documentation"
          element={
            <FlaggedRoute flag={FeatureFlag.Documentation}>
              <DocsLayout />
            </FlaggedRoute>
          }
        >
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
              <FlaggedRoute flag={FeatureFlag.Authentication}>
                <FlaggedRoute flag={FeatureFlag.Registration}>
                  <>
                    <HomeRoute />
                    <AuthModal ariaLabel="Create an account">
                      <SignUpRoute />
                    </AuthModal>
                  </>
                </FlaggedRoute>
              </FlaggedRoute>
            }
          />
          <Route path="signup" element={<Navigate to="/sign-up" replace />} />
          <Route
            path="forgot-password"
            element={
              <FlaggedRoute flag={FeatureFlag.Authentication}>
                <ForgotPasswordRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="reset-password"
            element={
              <FlaggedRoute flag={FeatureFlag.Authentication}>
                <ResetPasswordRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="verify-email"
            element={
              <FlaggedRoute flag={FeatureFlag.Authentication}>
                <VerifyEmailRoute />
              </FlaggedRoute>
            }
          />
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
          <Route
            path="ai"
            element={
              <FlaggedRoute flag={FeatureFlag.AiStudio} redirect="/app">
                <AiStudioRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="account"
            element={
              <FlaggedRoute flag={FeatureFlag.Account} redirect="/app">
                <AccountRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <FlaggedRoute flag={FeatureFlag.Profile} redirect="/app">
                <ProfileRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="security"
            element={
              <FlaggedRoute flag={FeatureFlag.Security} redirect="/app">
                <SecurityRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="observability"
            element={
              <FlaggedRoute flag={FeatureFlag.Observability} redirect="/app">
                <ObservabilityRoute />
              </FlaggedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <FlaggedRoute flag={FeatureFlag.Admin} redirect="/app">
                <SuperAdminRoute>
                  <AdminDashboardRoute />
                </SuperAdminRoute>
              </FlaggedRoute>
            }
          />
          <Route
            path="admin/entities"
            element={
              <FlaggedRoute flag={FeatureFlag.Admin} redirect="/app">
                <SuperAdminRoute>
                  <EntityViewerRoute />
                </SuperAdminRoute>
              </FlaggedRoute>
            }
          />
        </Route>
      </Routes>
    </GlobalErrorBoundary>
  );
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isError, isLoading } = useSession();
  const adminAccess = useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: fetchAdminOverview,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });
  if (isLoading || isError || (isAuthenticated && adminAccess.isLoading)) {
    return null;
  }
  return isAuthenticated && adminAccess.isSuccess ? (
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

function MaintenanceRoute() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ae-background)] px-6 py-16 text-[var(--ae-foreground)]">
      <section className="w-full max-w-xl rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-surface)] p-7 text-center shadow-[var(--ae-shadow-lg)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-2xl text-[var(--ae-primary)]">
          <span aria-hidden="true">✦</span>
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ae-primary)]">
          Maintenance mode
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Aerealith is being upgraded
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ae-foreground-muted)]">
          The application is temporarily unavailable while maintenance is in
          progress. Existing data remains protected; refresh this page when the
          rollout is complete.
        </p>
      </section>
    </main>
  );
}

export default AppRoutes;
