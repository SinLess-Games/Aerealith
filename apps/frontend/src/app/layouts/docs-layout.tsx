import { useMemo, useState, type ReactNode } from 'react'

import { ThemeToggle, cn } from '@aerealith-ai/ui'
import { NavLink, Outlet, useLocation } from 'react-router'

import {
  getAudienceFromDocsUrl,
  getDocsTree,
  type DocsAudience,
} from '../../lib/docs-source'
import { DocsSidebar } from '../features/docs/components/docs-sidebar'

/**
 * Main documentation application shell.
 *
 * The layout owns the shared documentation header, audience navigation,
 * responsive sidebar, and document content region. Individual documentation
 * routes render their content through the nested React Router outlet.
 */
export function DocsLayout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const audience = getAudienceFromDocsUrl(location.pathname)

  const tree = useMemo(
    () => (audience ? getDocsTree(audience) : undefined),
    [audience],
  )

  const hasSidebar = audience !== undefined && tree !== undefined

  return (
    <div
      className='min-h-screen text-[var(--ae-foreground)]'
      data-slot='docs-layout'
    >
      <a
        href='#docs-main-content'
        className={cn(
          'fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg px-4 py-2',
          'bg-[var(--ae-background)] text-sm font-semibold',
          'text-[var(--ae-foreground)] shadow-xl',
          'transition-transform focus:translate-y-0',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--ae-accent)]',
        )}
      >
        Skip to documentation
      </a>

      <DocsHeader
        audience={audience}
        isSidebarOpen={isSidebarOpen}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        showSidebarButton={hasSidebar}
      />

      <div
        className={cn(
          'mx-auto w-full max-w-[96rem] px-4 pb-16 sm:px-6',
          hasSidebar
            ? 'lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[19rem_minmax(0,1fr)]'
            : 'max-w-7xl',
        )}
      >
        {audience && tree ? (
          <DocsSidebar
            audience={audience}
            mobileOpen={isSidebarOpen}
            onMobileClose={() => setIsSidebarOpen(false)}
            tree={tree}
          />
        ) : null}

        <main
          id='docs-main-content'
          className={cn(
            'min-w-0 pt-6 outline-none sm:pt-8',
            hasSidebar ? 'lg:pt-8' : 'mx-auto w-full',
          )}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

interface DocsHeaderProps {
  audience?: DocsAudience
  isSidebarOpen: boolean
  onOpenSidebar: () => void
  showSidebarButton: boolean
}

function DocsHeader({
  audience,
  isSidebarOpen,
  onOpenSidebar,
  showSidebarButton,
}: Readonly<DocsHeaderProps>) {
  return (
    <header className='sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4'>
      <div
        className={cn(
          'relative mx-auto flex min-h-16 w-full max-w-[96rem]',
          'items-center gap-3 overflow-hidden rounded-2xl border px-3',
          'border-[var(--ae-border)]',
          'bg-[color-mix(in_srgb,var(--ae-background)_38%,transparent)]',
          'shadow-[0_18px_55px_rgba(0,0,0,0.18)]',
          'backdrop-blur-2xl sm:px-5 lg:min-h-18',
        )}
      >
        <div
          aria-hidden='true'
          className={cn(
            'pointer-events-none absolute inset-0',
            'bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--ae-accent)_10%,transparent),transparent_34%),radial-gradient(circle_at_92%_100%,color-mix(in_srgb,var(--ae-secondary)_8%,transparent),transparent_38%)]',
          )}
        />

        {showSidebarButton ? (
          <button
            type='button'
            aria-label='Open documentation navigation'
            aria-controls='docs-mobile-sidebar'
            aria-expanded={isSidebarOpen}
            className={cn(
              'relative grid size-11 shrink-0 place-items-center rounded-xl',
              'border border-[var(--ae-border)]',
              'bg-[color-mix(in_srgb,var(--ae-surface)_65%,transparent)]',
              'text-[var(--ae-foreground)] transition',
              'hover:border-[color-mix(in_srgb,var(--ae-accent)_40%,var(--ae-border))]',
              'hover:bg-[var(--ae-surface)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--ae-accent)] lg:hidden',
            )}
            onClick={onOpenSidebar}
          >
            <MenuIcon />
          </button>
        ) : null}

        <DocsBrand />

        <div className='relative ml-auto hidden items-center gap-2 md:flex'>
          <DocsAudienceSwitcher />
        </div>

        <div className='relative ml-auto flex items-center gap-2 md:ml-0'>
          <NavLink
            to='/'
            className={cn(
              'hidden min-h-10 items-center rounded-lg border px-3 text-sm font-medium',
              'border-[color-mix(in_srgb,var(--ae-border)_75%,transparent)]',
              'bg-[color-mix(in_srgb,var(--ae-background)_25%,transparent)]',
              'text-[var(--ae-foreground)] transition',
              'hover:bg-[color-mix(in_srgb,var(--ae-background)_55%,transparent)]',
              'hover:text-[var(--ae-foreground)] sm:inline-flex',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--ae-accent)]',
            )}
          >
            Main site
          </NavLink>

          <ThemeToggle />
        </div>

        {audience ? (
          <span className='sr-only'>
            Current section: {getAudienceLabel(audience)}
          </span>
        ) : null}
      </div>

      <div className='mx-auto mt-2 w-full max-w-[96rem] md:hidden'>
        <DocsAudienceSwitcher />
      </div>
    </header>
  )
}

function DocsBrand() {
  return (
    <NavLink
      to='/documentation'
      aria-label='Aerealith documentation home'
      className={cn(
        'relative flex min-w-0 items-center gap-3 rounded-xl',
        'focus-visible:outline-2 focus-visible:outline-offset-4',
        'focus-visible:outline-[var(--ae-accent)]',
      )}
    >
      <span className='relative grid size-11 shrink-0 place-items-center'>
        <span
          aria-hidden='true'
          className={cn(
            'absolute inset-1 rounded-xl blur-md',
            'bg-gradient-to-br from-fuchsia-500/18',
            'via-violet-500/10 to-cyan-500/18',
          )}
        />

        <img
          src='/images/brand/mark-no-background.png'
          alt=''
          width={44}
          height={44}
          className={cn(
            'relative size-10 object-contain',
            'drop-shadow-[0_0_10px_rgba(34,211,238,0.32)]',
          )}
        />
      </span>

      <span className='min-w-0'>
        <span
          className={cn(
            'block truncate text-base font-semibold tracking-wide',
            'text-[var(--ae-foreground)] sm:text-lg',
          )}
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          Aerealith
        </span>

        <span className='block truncate text-xs text-[var(--ae-foreground-muted)]'>
          Documentation
        </span>
      </span>
    </NavLink>
  )
}

function DocsAudienceSwitcher() {
  return (
    <nav
      aria-label='Documentation audience'
      className={cn(
        'relative grid grid-cols-2 gap-1 rounded-xl border p-1',
        'border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-background)_20%,transparent)]',
        'backdrop-blur-xl',
      )}
    >
      <AudienceLink audience='user'>User docs</AudienceLink>
      <AudienceLink audience='developer'>Developer docs</AudienceLink>
    </nav>
  )
}

interface AudienceLinkProps {
  audience: DocsAudience
  children: ReactNode
}

function AudienceLink({ audience, children }: Readonly<AudienceLinkProps>) {
  return (
    <NavLink
      to={`/documentation/${audience}`}
      className={({ isActive }) =>
        cn(
          'inline-flex min-h-9 items-center justify-center rounded-lg px-3',
          'text-xs font-semibold transition sm:text-sm',
          'focus-visible:outline-2 focus-visible:outline-offset-1',
          'focus-visible:outline-[var(--ae-accent)]',
          isActive
            ? cn(
                'border border-[color-mix(in_srgb,var(--ae-accent)_55%,transparent)]',
                'bg-[color-mix(in_srgb,var(--ae-background)_38%,transparent)]',
                'text-[var(--ae-foreground)]',
                'shadow-[0_5px_18px_rgba(0,0,0,0.14)]',
              )
            : cn(
                'border border-transparent',
                'bg-[color-mix(in_srgb,var(--ae-background)_18%,transparent)]',
                'text-[var(--ae-foreground)]',
                'hover:bg-[color-mix(in_srgb,var(--ae-background)_45%,transparent)]',
                'hover:text-[var(--ae-foreground)]',
              ),
        )
      }
    >
      {children}
    </NavLink>
  )
}

function getAudienceLabel(audience: DocsAudience): string {
  return audience === 'developer'
    ? 'Developer documentation'
    : 'User documentation'
}

function MenuIcon() {
  return (
    <svg aria-hidden='true' className='size-5' fill='none' viewBox='0 0 24 24'>
      <path
        d='M4 7h16M4 12h16M4 17h16'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.75'
      />
    </svg>
  )
}

export default DocsLayout
