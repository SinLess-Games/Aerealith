import { ThemeToggle } from '@aerealith-ai/ui';
import {
  FiActivity,
  FiBookOpen,
  FiDatabase,
  FiGrid,
  FiLogOut,
  FiMoon,
  FiShield,
  FiSun,
  FiUser,
} from 'react-icons/fi';
import { NavLink, Navigate, Outlet } from 'react-router';

import { useLogout, useSession } from '../../features/auth/use-session';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ae-background)]',
    isActive
      ? 'border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-foreground)] shadow-[inset_3px_0_0_var(--ae-primary)]'
      : 'border-transparent text-[var(--ae-foreground-muted)] hover:border-[var(--ae-border)] hover:bg-[var(--ae-surface-muted)] hover:text-[var(--ae-foreground)]',
  ].join(' ');

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useSession();
  const logout = useLogout();
  const isSuperAdmin = user?.role === 'super_admin';

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--ae-background)] text-[var(--ae-foreground-muted)]"
        aria-busy="true"
        aria-live="polite"
      >
        Loading your workspace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="relative z-0 min-h-screen bg-[var(--ae-background)] text-[var(--ae-foreground)]">
      <aside className="border-b border-[var(--ae-border)] bg-[var(--ae-background-elevated)] md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-[280px] md:border-b-0 md:border-r">
        <div className="flex h-full flex-col p-3 sm:p-4 md:p-6">
          <NavLink
            to="/app"
            className="flex items-center gap-3 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
          >
            <img
              src="/images/brand/mark-no-background.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: 'var(--ae-font-heading)' }}
            >
              Aerealith
            </span>
            {isSuperAdmin ? (
              <span className="ml-auto rounded-full border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ae-primary)]">
                Super Admin
              </span>
            ) : null}
          </NavLink>

          <nav
            className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-[var(--ae-border)] p-2 md:mt-8 md:block md:space-y-2 md:overflow-visible md:p-3"
            aria-label="Dashboard"
          >
            <NavLink to="/app" end className={navLinkClass}>
              <FiGrid aria-hidden="true" className="text-xl" />
              Overview
            </NavLink>
            <NavLink to="/app/account" className={navLinkClass}>
              <FiUser aria-hidden="true" className="text-xl" />
              Account
            </NavLink>
            <NavLink to="/app/security" className={navLinkClass}>
              <FiShield aria-hidden="true" className="text-xl" />
              Security &amp; sessions
            </NavLink>
            {isSuperAdmin ? (
              <>
                <div className="shrink-0 rounded-lg border border-[var(--ae-border)] p-1.5 md:mt-2">
                  <NavLink to="/app/admin" end className={navLinkClass}>
                    <FiShield aria-hidden="true" className="text-xl" />
                    Admin
                  </NavLink>
                  <div className="ml-4 mt-1 hidden border-l border-[var(--ae-divider)] pl-2 md:block">
                    <NavLink to="/app/admin" end className={navLinkClass}>
                      <FiActivity aria-hidden="true" />
                      Dashboard
                    </NavLink>
                    <NavLink to="/app/admin/entities" className={navLinkClass}>
                      <FiDatabase aria-hidden="true" />
                      Entity Viewer
                    </NavLink>
                  </div>
                </div>
              </>
            ) : null}
          </nav>

          <div className="mt-auto hidden rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] p-5 md:block">
            <FiShield
              aria-hidden="true"
              className="text-3xl text-[var(--ae-accent)]"
            />
            <p className="mt-4 font-semibold">You’re protected</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
              Critical administration routes are permission checked.
            </p>
          </div>
        </div>
      </aside>

      <div className="md:pl-[280px]">
        <header className="sticky top-0 z-40 border-b border-[var(--ae-border)] bg-[var(--ae-glass-background-strong)] backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-8">
            <NavLink
              to="/documentation"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--ae-foreground-muted)] transition-colors hover:bg-[var(--ae-surface-muted)] hover:text-[var(--ae-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
            >
              <FiBookOpen aria-hidden="true" />
              Documentation
            </NavLink>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle
                className="rounded-lg"
                darkIcon={<FiSun aria-hidden="true" />}
                iconOnly
                lightIcon={<FiMoon aria-hidden="true" />}
              />
              <span className="mx-2 hidden h-8 w-px bg-[var(--ae-divider)] sm:block" />
              <div className="ml-1 hidden items-center gap-3 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ae-accent)] bg-[var(--ae-accent-subtle)] text-[var(--ae-accent)]">
                  <FiUser aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold">
                  {user?.username ?? 'Account'}
                </span>
              </div>
              <button
                type="button"
                aria-label="Sign out"
                title="Sign out"
                className="ml-1 rounded-lg p-2.5 text-[var(--ae-foreground-muted)] transition-colors hover:bg-[var(--ae-danger-subtle)] hover:text-[var(--ae-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <FiLogOut aria-hidden="true" className="text-lg" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8 md:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
