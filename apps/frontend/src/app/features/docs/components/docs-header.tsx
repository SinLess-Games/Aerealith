import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { ThemeToggle, cn } from '@aerealith-ai/ui'
import { Link, NavLink } from 'react-router'

import type { DocsAudience } from '../../../../lib/docs-source'
import { DocsAudienceSwitcher } from './docs-audience-switcher'

export interface DocsHeaderProps extends Omit<
  ComponentPropsWithoutRef<'header'>,
  'children'
> {
  /**
   * Active documentation audience.
   *
   * Used for accessible status text and optional section labeling.
   */
  audience?: DocsAudience

  /**
   * Whether the mobile documentation sidebar is open.
   */
  isSidebarOpen?: boolean

  /**
   * Opens the mobile documentation sidebar.
   */
  onOpenSidebar?: () => void

  /**
   * Controls whether the mobile sidebar trigger is displayed.
   */
  showSidebarButton?: boolean

  /**
   * Controls whether the audience switcher is displayed.
   */
  showAudienceSwitcher?: boolean

  /**
   * Controls whether the main-site link is displayed.
   */
  showMainSiteLink?: boolean

  /**
   * Controls whether the theme toggle is displayed.
   */
  showThemeToggle?: boolean

  /**
   * Optional content rendered before the theme control.
   */
  actions?: ReactNode

  /**
   * Main-site navigation destination.
   */
  mainSiteHref?: string

  /**
   * Main-site link label.
   */
  mainSiteLabel?: string

  /**
   * Documentation landing-page destination.
   */
  documentationHref?: string

  /**
   * Product name shown in the header.
   */
  productName?: string

  /**
   * Product subtitle shown beneath the product name.
   */
  productSubtitle?: string

  /**
   * Product logo source.
   */
  logoSrc?: string
}

/**
 * Shared header for the Aerealith documentation experience.
 *
 * Includes:
 *
 * - Aerealith documentation branding
 * - User/developer documentation switcher
 * - Responsive mobile sidebar trigger
 * - Main-site navigation
 * - Theme controls
 */
export function DocsHeader({
  actions,
  audience,
  className,
  documentationHref = '/documentation',
  isSidebarOpen = false,
  logoSrc = '/images/brand/mark-no-background.png',
  mainSiteHref = '/',
  mainSiteLabel = 'Main site',
  onOpenSidebar,
  productName = 'Aerealith',
  productSubtitle = 'Documentation',
  showAudienceSwitcher = true,
  showMainSiteLink = true,
  showSidebarButton = false,
  showThemeToggle = true,
  ...props
}: Readonly<DocsHeaderProps>) {
  const canOpenSidebar =
    showSidebarButton && typeof onOpenSidebar === 'function'

  return (
    <header
      {...props}
      className={cn(
        'sticky top-0 z-50 px-3 pt-3',
        'sm:px-5 sm:pt-4',
        className,
      )}
      data-audience={audience}
      data-slot='docs-header'
    >
      <div
        className={cn(
          'relative mx-auto flex min-h-16 w-full max-w-[96rem]',
          'items-center gap-3 overflow-hidden rounded-2xl border px-3',
          'border-[var(--ae-border)]',
          'bg-[color-mix(in_srgb,var(--ae-background)_82%,transparent)]',
          'shadow-[0_18px_55px_rgba(0,0,0,0.18)]',
          'backdrop-blur-2xl sm:px-5 lg:min-h-18',
        )}
      >
        <HeaderBackground />

        {canOpenSidebar ? (
          <SidebarButton isOpen={isSidebarOpen} onClick={onOpenSidebar} />
        ) : null}

        <DocsHeaderBrand
          documentationHref={documentationHref}
          logoSrc={logoSrc}
          productName={productName}
          productSubtitle={productSubtitle}
        />

        {showAudienceSwitcher ? (
          <div className='relative ml-auto hidden items-center md:flex'>
            <DocsAudienceSwitcher />
          </div>
        ) : null}

        <div
          className={cn(
            'relative flex items-center gap-2',
            showAudienceSwitcher ? 'ml-auto md:ml-0' : 'ml-auto',
          )}
        >
          {actions}

          {showMainSiteLink ? (
            <NavLink
              to={mainSiteHref}
              className={cn(
                'hidden min-h-10 items-center rounded-lg px-3',
                'text-sm font-medium',
                'text-[var(--ae-foreground-muted)]',
                'transition duration-150',
                'hover:bg-[var(--ae-surface)]',
                'hover:text-[var(--ae-foreground)]',
                'focus-visible:outline-2',
                'focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--ae-accent)]',
                'sm:inline-flex',
              )}
            >
              {mainSiteLabel}
            </NavLink>
          ) : null}

          {showThemeToggle ? <ThemeToggle /> : null}
        </div>

        {audience ? (
          <span className='sr-only'>
            Current section: {getAudienceLabel(audience)}
          </span>
        ) : null}
      </div>

      {showAudienceSwitcher ? (
        <div className='mx-auto mt-2 w-full max-w-[96rem] md:hidden'>
          <DocsAudienceSwitcher />
        </div>
      ) : null}
    </header>
  )
}

interface DocsHeaderBrandProps {
  documentationHref: string
  logoSrc: string
  productName: string
  productSubtitle: string
}

function DocsHeaderBrand({
  documentationHref,
  logoSrc,
  productName,
  productSubtitle,
}: Readonly<DocsHeaderBrandProps>) {
  return (
    <Link
      to={documentationHref}
      aria-label={`${productName} ${productSubtitle} home`}
      className={cn(
        'relative flex min-w-0 items-center gap-3 rounded-xl',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-4',
        'focus-visible:outline-[var(--ae-accent)]',
      )}
      data-slot='docs-header-brand'
    >
      <span className='relative grid size-11 shrink-0 place-items-center'>
        <span
          aria-hidden='true'
          className={cn(
            'absolute inset-1 rounded-xl blur-md',
            'bg-gradient-to-br',
            'from-fuchsia-500/18',
            'via-violet-500/10',
            'to-cyan-500/18',
          )}
        />

        <img
          src={logoSrc}
          alt=''
          width={44}
          height={44}
          decoding='async'
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
          style={{
            fontFamily: 'var(--ae-font-heading)',
          }}
        >
          {productName}
        </span>

        <span
          className={cn(
            'block truncate text-xs',
            'text-[var(--ae-foreground-muted)]',
          )}
        >
          {productSubtitle}
        </span>
      </span>
    </Link>
  )
}

interface SidebarButtonProps {
  isOpen: boolean
  onClick: () => void
}

function SidebarButton({ isOpen, onClick }: Readonly<SidebarButtonProps>) {
  return (
    <button
      type='button'
      aria-label='Open documentation navigation'
      aria-controls='docs-mobile-sidebar'
      aria-expanded={isOpen}
      className={cn(
        'relative grid size-11 shrink-0 place-items-center',
        'rounded-xl border border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-surface)_65%,transparent)]',
        'text-[var(--ae-foreground)]',
        'transition duration-150',
        'hover:border-[color-mix(in_srgb,var(--ae-accent)_40%,var(--ae-border))]',
        'hover:bg-[var(--ae-surface)]',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--ae-accent)]',
        'lg:hidden',
      )}
      onClick={onClick}
      data-slot='docs-sidebar-trigger'
    >
      <MenuIcon />
    </button>
  )
}

function HeaderBackground() {
  return (
    <>
      <div
        aria-hidden='true'
        className={cn(
          'pointer-events-none absolute inset-0',
          'bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--ae-accent)_10%,transparent),transparent_34%),radial-gradient(circle_at_92%_100%,color-mix(in_srgb,var(--ae-secondary)_8%,transparent),transparent_38%)]',
        )}
      />

      <div
        aria-hidden='true'
        className={cn(
          'pointer-events-none absolute inset-x-8 top-0 h-px',
          'bg-gradient-to-r',
          'from-transparent',
          'via-[color-mix(in_srgb,var(--ae-accent)_35%,transparent)]',
          'to-transparent',
        )}
      />
    </>
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

export default DocsHeader
