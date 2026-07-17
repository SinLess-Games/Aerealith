// apps/frontend/src/app/layouts/public-layout.tsx

import { ThemeToggle } from '@aerealith-ai/ui'
import { NavLink, Outlet } from 'react-router'

import { HeaderAuthNav } from './header-auth-nav'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'text-[var(--ae-foreground)]'
      : 'text-[var(--ae-foreground-muted)] hover:text-[var(--ae-foreground)]',
  ].join(' ')

/**
 * Shell for the public marketing site: branded header with navigation and a
 * theme toggle, the routed page via `<Outlet />`, and a footer. Themed entirely
 * through design-system tokens, so it adapts to light/dark automatically.
 */
export function PublicLayout() {
  return (
    <div className='flex min-h-screen flex-col'>
      <header
        className='sticky top-0 z-50 border-b border-[var(--ae-border)] shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl'
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--ae-background) 94%, transparent)',
        }}
      >
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4'>
          <NavLink to='/' className='flex items-center gap-3'>
            <img
              src='/images/brand/mark.png'
              alt=''
              width={32}
              height={32}
              className='h-8 w-8 rounded-md'
            />
            <span
              className='text-lg font-semibold tracking-wide'
              style={{ fontFamily: 'var(--ae-font-heading)' }}
            >
              Aerealith AI
            </span>
          </NavLink>

          <nav className='flex items-center gap-1' aria-label='Primary'>
            <NavLink to='/' end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to='/about' className={navLinkClass}>
              About
            </NavLink>
            <NavLink to='/pricing' className={navLinkClass}>
              Pricing
            </NavLink>
            <NavLink to='/contact' className={navLinkClass}>
              Contact
            </NavLink>
            <a
              href='https://github.com/SinLess-Games/Aerealith'
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-md px-3 py-2 text-sm font-medium transition-colors'
            >
              GitHub
            </a>
            <HeaderAuthNav />
            <div className='ml-2'>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className='flex flex-1 flex-col'>
        <Outlet />
      </main>

      <footer className='border-t border-[var(--ae-border-subtle)]'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between'>
          <span>
            © {new Date().getFullYear()} Aerealith AI · Reduce digital
            complexity without reducing user control.
          </span>
          <nav className='flex items-center gap-4' aria-label='Legal'>
            <NavLink to='/policies/terms-of-use' className='hover:underline'>
              Terms
            </NavLink>
            <NavLink to='/policies/privacy' className='hover:underline'>
              Privacy
            </NavLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
