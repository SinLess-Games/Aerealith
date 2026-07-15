// apps/frontend/src/app/layouts/dashboard-layout.tsx

import { ThemeToggle } from '@aerealith-ai/ui'
import { NavLink, Navigate, Outlet } from 'react-router'

import { useLogout, useSession } from '../../features/auth/use-session'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[var(--ae-control)] text-[var(--ae-foreground)]'
      : 'text-[var(--ae-foreground-muted)] hover:bg-[var(--ae-control-hover)] hover:text-[var(--ae-foreground)]',
  ].join(' ')

/**
 * Authenticated app shell. Guards its routes: while the session is loading it
 * shows a placeholder; when signed out it redirects to `/sign-in`; otherwise it
 * renders the sidebar navigation and the routed page via `<Outlet />`.
 */
export function DashboardLayout() {
  const { isAuthenticated, isLoading } = useSession()
  const logout = useLogout()

  if (isLoading) {
    return (
      <div
        className='flex min-h-screen items-center justify-center bg-[var(--ae-background)] text-[var(--ae-foreground-muted)]'
        aria-busy='true'
      >
        Loading your workspace…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/sign-in' replace />
  }

  return (
    <div className='min-h-screen bg-[var(--ae-background)] text-[var(--ae-foreground)]'>
      <header className='border-b border-[var(--ae-border-subtle)] bg-[var(--ae-glass-background)] backdrop-blur'>
        <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4'>
          <NavLink to='/app' className='flex items-center gap-3'>
            <img
              src='/images/brand/mark.png'
              alt=''
              width={28}
              height={28}
              className='h-7 w-7 rounded-md'
            />
            <span
              className='font-semibold tracking-wide'
              style={{ fontFamily: 'var(--ae-font-heading)' }}
            >
              Aerealith
            </span>
          </NavLink>
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <button
              type='button'
              className='rounded-md border border-[var(--ae-border)] bg-[var(--ae-control)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--ae-control-hover)]'
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <div className='mx-auto flex w-full max-w-7xl gap-6 px-6 py-8'>
        <aside className='w-52 shrink-0'>
          <nav className='space-y-1' aria-label='Dashboard'>
            <NavLink to='/app' end className={navLinkClass}>
              Overview
            </NavLink>
            <NavLink to='/app/account' className={navLinkClass}>
              Account
            </NavLink>
          </nav>
        </aside>
        <main className='min-w-0 flex-1'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
