// apps/frontend/src/app/layouts/header-auth-nav.tsx

import { NavLink } from 'react-router'

import { useLogout, useSession } from '../../features/auth/use-session'

const linkClass =
  'rounded-md px-3 py-2 text-sm font-medium text-[var(--ae-foreground-muted)] transition-colors hover:text-[var(--ae-foreground)]'

const buttonClass =
  'rounded-md border border-[var(--ae-border)] bg-[var(--ae-control)] px-3 py-2 text-sm font-medium text-[var(--ae-foreground)] transition-colors hover:bg-[var(--ae-control-hover)]'

/**
 * The right-hand auth area of the site header. Reflects the current session:
 * signed-out shows "Sign in"; signed-in shows a dashboard link, the username,
 * and a sign-out button. Uses the shared session hooks.
 */
export function HeaderAuthNav() {
  const { user, isAuthenticated, isLoading } = useSession()
  const logout = useLogout()

  if (isLoading) {
    return (
      <span
        aria-busy='true'
        aria-label='Checking session'
        className='inline-block h-9 w-16'
      />
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className='flex items-center gap-2'>
        <NavLink to='/app' className={linkClass}>
          Dashboard
        </NavLink>
        <span className='hidden text-sm text-[var(--ae-foreground-muted)] sm:inline'>
          {user.username}
        </span>
        <button
          type='button'
          className={buttonClass}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <NavLink to='/sign-in' className={buttonClass}>
      Sign in
    </NavLink>
  )
}
