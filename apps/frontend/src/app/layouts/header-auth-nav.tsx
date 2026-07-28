import { FeatureFlag } from '@aerealith-ai/core';
import { NavLink } from 'react-router';

import { useLogout, useSession } from '../../features/auth/use-session';
import { useFeatureFlag } from '../../features/flags/feature-flags';

const linkClass = 'rounded-md px-3 py-2 text-sm font-medium transition-colors';

const buttonClass =
  'rounded-md border border-[var(--ae-border)] px-3 py-2 text-sm font-medium transition-colors';

export function HeaderAuthNav({ mobile = false }: { mobile?: boolean }) {
  const { user, isAuthenticated, isLoading } = useSession();
  const logout = useLogout();
  const authenticationEnabled = useFeatureFlag(FeatureFlag.Authentication);
  const dashboardEnabled = useFeatureFlag(FeatureFlag.Dashboard);

  if (isLoading) {
    return (
      <span
        aria-busy="true"
        aria-label="Checking session"
        className={mobile ? 'h-11 w-full' : 'inline-block h-9 w-16'}
      />
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={mobile ? 'grid gap-2' : 'flex items-center gap-2'}>
        {dashboardEnabled ? (
          <NavLink
            to="/app"
            className={mobile ? linkClass + ' text-center' : linkClass}
          >
            Dashboard
          </NavLink>
        ) : null}
        <span
          className={
            mobile ? 'text-center text-sm' : 'hidden text-sm sm:inline'
          }
        >
          {user.username}
        </span>
        <button
          type="button"
          className={mobile ? buttonClass + ' w-full' : buttonClass}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  return authenticationEnabled ? (
    <NavLink
      to="/sign-in"
      className={mobile ? buttonClass + ' text-center' : buttonClass}
    >
      Sign in
    </NavLink>
  ) : null;
}
