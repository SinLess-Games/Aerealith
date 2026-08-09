import { ThemeToggle } from '@aerealith-ai/ui';
import {
  FiBell,
  FiGrid,
  FiLogOut,
  FiDatabase,
  FiSearch,
  FiUsers,
  FiKey,
  FiClock,
  FiActivity,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { NavLink, Navigate, Outlet } from 'react-router';

import { useLogout, useSession } from '../../features/auth/use-session';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative flex items-center gap-4 rounded-lg border px-4 py-3 text-sm font-semibold transition-all',
    isActive
      ? 'border-[#42f563]/35 bg-[#42f563]/10 text-[#61ff78] shadow-[inset_3px_0_0_#50fa68,0_0_28px_rgba(66,245,99,0.05)]'
      : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.025] hover:text-slate-100',
  ].join(' ');

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useSession();
  const logout = useLogout();
  const isSuperAdmin = user?.role === 'super_admin';

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#050a10] text-slate-400"
        aria-busy="true"
      >
        Loading your workspace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div
      className="relative z-0 min-h-screen text-slate-50"
      style={{ background: '#050a10' }}
    >
      <aside
        className="border-b border-white/10 md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-[280px] md:border-b-0 md:border-r"
        style={{ background: '#04090e' }}
      >
        <div className="flex h-full flex-col p-4 md:p-6">
          <NavLink to="/app" className="flex items-center gap-3 px-2 py-2">
            <img
              src="/images/brand/mark-no-background.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(82%) sepia(86%) saturate(1735%) hue-rotate(63deg) brightness(101%) contrast(103%)',
              }}
            />
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: 'var(--ae-font-heading)' }}
            >
              Aerealith
            </span>
            {isSuperAdmin ? (
              <span className="ml-auto rounded-full border border-[#42f563]/35 bg-[#42f563]/5 px-2.5 py-1 text-[11px] font-semibold text-[#50fa68]">
                Super Admin
              </span>
            ) : null}
          </NavLink>

          <nav
            className="mt-5 grid gap-1 rounded-xl border border-white/10 p-2 md:mt-8 md:block md:space-y-2 md:p-3"
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
            {isSuperAdmin ? (
              <>
                <div className="mt-2 rounded-lg border border-white/10 p-1.5">
                  <NavLink to="/app/admin" end className={navLinkClass}>
                    <FiShield aria-hidden="true" className="text-xl" />
                    Admin
                  </NavLink>
                  <div className="ml-4 mt-1 border-l border-white/10 pl-2">
                    <NavLink to="/app/admin" end className={navLinkClass}>
                      <FiActivity aria-hidden="true" />
                      Dashboard
                    </NavLink>
                    <NavLink to="/app/admin/entities" className={navLinkClass}>
                      <FiDatabase aria-hidden="true" />
                      Entity Viewer
                    </NavLink>
                    <div className="space-y-1 px-3 py-2 text-xs text-slate-500">
                      <p className="text-[#50fa68]">● &nbsp; Entities</p>
                      <p>⌕ &nbsp; Database Search</p>
                      <p>⌘ &nbsp; Query Builder</p>
                      <p>☆ &nbsp; Saved Views</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <span className={navLinkClass({ isActive: false })}>
                    <FiUsers />
                    Users
                  </span>
                  <span className={navLinkClass({ isActive: false })}>
                    <FiKey />
                    Roles &amp; Permissions
                  </span>
                  <span className={navLinkClass({ isActive: false })}>
                    <FiClock />
                    Sessions
                  </span>
                </div>
              </>
            ) : null}
          </nav>

          <div className="mt-auto hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1715] to-[#050b10] p-5 md:block">
            <FiShield
              aria-hidden="true"
              className="text-3xl text-[#50fa68] drop-shadow-[0_0_12px_rgba(80,250,104,0.5)]"
            />
            <p className="mt-4 font-semibold">You’re protected</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Critical administration routes are permission checked.
            </p>
            <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#42f563]/20 bg-[#42f563]/5 shadow-[0_0_35px_rgba(66,245,99,0.12)]">
              <FiShield
                aria-hidden="true"
                className="text-3xl text-[#50fa68]"
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-[280px]">
        <header
          className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl"
          style={{ background: 'rgb(5 10 16 / 94%)' }}
        >
          <div className="flex min-h-16 items-center gap-4 px-4 sm:px-8">
            <div className="relative hidden w-full max-w-[680px] md:block">
              <FiSearch className="absolute left-4 top-3.5 text-slate-500" />
              <input
                aria-label="Search administration"
                placeholder="Search anything..."
                className="w-full rounded-lg border border-white/10 bg-[#060c12] py-2.5 pl-11 pr-20 text-sm outline-none focus:border-[#50fa68]/40"
              />
              <kbd className="absolute right-3 top-2 rounded border border-white/10 px-2 py-1 text-xs text-slate-500">
                Ctrl K
              </kbd>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <span className="mx-2 hidden h-8 w-px bg-white/10 sm:block" />
              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-lg p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
              >
                <FiBell aria-hidden="true" className="text-xl" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#50fa68] shadow-[0_0_8px_#50fa68]" />
              </button>
              <div className="ml-1 hidden items-center gap-3 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#42f563]/25 bg-[#42f563]/5 text-[#50fa68]">
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
                className="ml-1 rounded-lg p-2.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <FiLogOut aria-hidden="true" className="text-lg" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1500px] px-4 py-8 sm:px-8 md:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
