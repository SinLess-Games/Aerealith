import { ThemeToggle } from '@aerealith-ai/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router'

import { HeaderAuthNav } from './header-auth-nav'

const navigation = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
] as const

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group relative inline-flex min-h-11 items-center justify-center px-3 text-sm font-medium',
    'transition-colors duration-200',
    'after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-center',
    'after:transition-transform after:duration-200',
    isActive
      ? [
          'text-[var(--ae-accent)]',
          'after:scale-x-100',
          'after:bg-[var(--ae-accent)]',
          'after:shadow-[0_0_10px_var(--ae-accent)]',
        ].join(' ')
      : [
          'text-[var(--ae-foreground-muted)]',
          'after:scale-x-0',
          'hover:text-[var(--ae-foreground)]',
          'hover:after:scale-x-100',
          'hover:after:bg-[var(--ae-border-strong,var(--ae-border))]',
        ].join(' '),
  ].join(' ')

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3',
    'text-sm font-medium transition duration-200',
    isActive
      ? [
          'bg-[color-mix(in_srgb,var(--ae-accent)_12%,transparent)]',
          'text-[var(--ae-accent)]',
          'shadow-[inset_0_0_20px_color-mix(in_srgb,var(--ae-accent)_7%,transparent)]',
        ].join(' ')
      : [
          'text-[var(--ae-foreground-muted)]',
          'hover:bg-[color-mix(in_srgb,var(--ae-surface)_72%,transparent)]',
          'hover:text-[var(--ae-foreground)]',
        ].join(' '),
  ].join(' ')

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('pointerdown', closeOnOutsideClick)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')

    const closeDesktopMenu = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false)
      }
    }

    mediaQuery.addEventListener('change', closeDesktopMenu)

    return () => {
      mediaQuery.removeEventListener('change', closeDesktopMenu)
    }
  }, [])

  return (
    <header className='sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4'>
      <div ref={headerRef} className='relative mx-auto w-full max-w-7xl'>
        <div
          className={[
            'relative flex min-h-16 items-center justify-between overflow-hidden',
            'rounded-2xl border border-[var(--ae-border)] px-4 sm:px-6',
            'bg-[color-mix(in_srgb,var(--ae-background)_78%,transparent)]',
            'shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-2xl',
            'supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--ae-background)_66%,transparent)]',
            'lg:min-h-20',
          ].join(' ')}
        >
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--ae-accent)_10%,transparent),transparent_34%),radial-gradient(circle_at_88%_100%,color-mix(in_srgb,var(--ae-secondary,#a855f7)_8%,transparent),transparent_38%)]'
          />

          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--ae-accent)_45%,transparent)] to-transparent'
          />

          <Brand />

          <nav
            className='relative hidden items-center gap-1 lg:flex'
            aria-label='Primary navigation'
          >
            {navigation.map(({ label, ...item }) => (
              <NavLink key={item.to} {...item} className={desktopLinkClass}>
                {label}
              </NavLink>
            ))}

            <a
              href='https://github.com/SinLess-Games/Aerealith'
              target='_blank'
              rel='noopener noreferrer'
              className={[
                'group relative inline-flex min-h-11 items-center justify-center px-3',
                'text-sm font-medium text-[var(--ae-foreground-muted)]',
                'transition-colors duration-200 hover:text-[var(--ae-foreground)]',
                'after:absolute after:inset-x-3 after:bottom-0 after:h-px',
                'after:origin-center after:scale-x-0 after:bg-[var(--ae-border)]',
                'after:transition-transform after:duration-200',
                'hover:after:scale-x-100',
              ].join(' ')}
            >
              GitHub
            </a>
          </nav>

          <div className='relative hidden items-center gap-2 lg:flex'>
            <HeaderAuthNav />

            <NavLink
              to='/sign-up'
              className={[
                'inline-flex min-h-11 items-center justify-center rounded-xl px-5',
                'bg-gradient-to-r from-fuchsia-600 via-violet-500 to-cyan-500',
                'text-sm font-semibold text-white',
                'shadow-[0_8px_26px_rgba(124,58,237,0.3)]',
                'transition duration-200',
                'hover:-translate-y-0.5 hover:brightness-110',
                'hover:shadow-[0_12px_32px_rgba(34,211,238,0.24)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--ae-accent)]',
              ].join(' ')}
            >
              Get Started
            </NavLink>

            <ThemeButton />
          </div>

          <button
            type='button'
            aria-label={
              isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={isMenuOpen}
            aria-controls='mobile-navigation'
            onClick={() => setIsMenuOpen((open) => !open)}
            className={[
              'relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border',
              'border-[var(--ae-border)] text-[var(--ae-foreground)]',
              'bg-[color-mix(in_srgb,var(--ae-surface)_55%,transparent)]',
              'transition duration-200',
              'hover:border-[color-mix(in_srgb,var(--ae-accent)_38%,var(--ae-border))]',
              'hover:bg-[var(--ae-surface)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--ae-accent)]',
              'lg:hidden',
            ].join(' ')}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {isMenuOpen ? (
          <div
            id='mobile-navigation'
            className={[
              'absolute inset-x-0 top-[calc(100%+0.75rem)] overflow-hidden',
              'rounded-2xl border border-[var(--ae-border)] p-3',
              'bg-[color-mix(in_srgb,var(--ae-background)_92%,transparent)]',
              'shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl',
              'supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--ae-background)_82%,transparent)]',
              'lg:hidden',
            ].join(' ')}
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--ae-accent)_10%,transparent),transparent_34%)]'
            />

            <div className='relative mb-2 flex items-center justify-between px-2 py-1'>
              <span className='text-xs font-semibold tracking-[0.18em] text-[var(--ae-foreground-muted)] uppercase'>
                Navigation
              </span>

              <button
                type='button'
                aria-label='Close navigation menu'
                onClick={() => setIsMenuOpen(false)}
                className='grid h-9 w-9 place-items-center rounded-lg text-[var(--ae-foreground-muted)] transition hover:bg-[var(--ae-surface)] hover:text-[var(--ae-foreground)]'
              >
                <CloseIcon />
              </button>
            </div>

            <nav
              className='relative grid gap-1'
              aria-label='Mobile primary navigation'
            >
              {navigation.map(({ label, ...item }) => (
                <NavLink
                  key={item.to}
                  {...item}
                  className={mobileLinkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <NavIcon label={label} />

                  <span>{label}</span>

                  <ChevronRightIcon className='ml-auto h-4 w-4 opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-100' />
                </NavLink>
              ))}

              <a
                href='https://github.com/SinLess-Games/Aerealith'
                target='_blank'
                rel='noopener noreferrer'
                className={[
                  'group flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3',
                  'text-sm font-medium text-[var(--ae-foreground-muted)]',
                  'transition duration-200',
                  'hover:bg-[color-mix(in_srgb,var(--ae-surface)_72%,transparent)]',
                  'hover:text-[var(--ae-foreground)]',
                ].join(' ')}
                onClick={() => setIsMenuOpen(false)}
              >
                <NavIcon label='GitHub' />

                <span>GitHub</span>

                <ExternalLinkIcon className='ml-auto h-4 w-4 opacity-45 transition group-hover:opacity-100' />
              </a>
            </nav>

            <div className='relative mt-3 grid gap-2 border-t border-[var(--ae-border)] pt-3'>
              <HeaderAuthNav mobile />

              <NavLink
                to='/sign-up'
                onClick={() => setIsMenuOpen(false)}
                className={[
                  'inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3',
                  'bg-gradient-to-r from-fuchsia-600 via-violet-500 to-cyan-500',
                  'text-center text-sm font-semibold text-white',
                  'shadow-[0_10px_28px_rgba(124,58,237,0.26)]',
                  'transition hover:brightness-110',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--ae-accent)]',
                ].join(' ')}
              >
                Get Started
              </NavLink>

              <ThemeButton mobile />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function Brand() {
  return (
    <NavLink
      to='/'
      aria-label='Aerealith AI home'
      className={[
        'relative flex min-w-0 items-center gap-3 rounded-xl',
        'focus-visible:outline-2 focus-visible:outline-offset-4',
        'focus-visible:outline-[var(--ae-accent)]',
      ].join(' ')}
    >
      <span className='relative grid h-11 w-11 shrink-0 place-items-center'>
        <span
          aria-hidden='true'
          className='absolute inset-1 rounded-xl bg-gradient-to-br from-fuchsia-500/18 via-violet-500/10 to-cyan-500/18 blur-md'
        />

        <img
          src='/images/brand/mark-no-background.png'
          alt=''
          width={44}
          height={44}
          className='relative h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.32)] sm:h-11 sm:w-11'
        />
      </span>

      <span
        className='truncate text-base font-semibold tracking-wide text-[var(--ae-foreground)] sm:text-lg'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        Aerealith AI
      </span>
    </NavLink>
  )
}

function ThemeButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <ThemeToggle
      iconOnly={!mobile}
      lightIcon={<SunIcon />}
      darkIcon={<MoonIcon />}
      className={
        mobile
          ? [
              'flex min-h-12 items-center justify-center gap-2 rounded-xl border',
              'border-[var(--ae-border)] px-4 py-3',
              'bg-[color-mix(in_srgb,var(--ae-surface)_45%,transparent)]',
              'text-sm font-medium text-[var(--ae-foreground)]',
              'transition hover:bg-[var(--ae-surface)]',
            ].join(' ')
          : [
              'grid h-11 w-11 place-items-center rounded-full border',
              'border-[var(--ae-border)]',
              'bg-[color-mix(in_srgb,var(--ae-surface)_42%,transparent)]',
              'text-[var(--ae-foreground-muted)]',
              'transition duration-200',
              'hover:border-[color-mix(in_srgb,var(--ae-accent)_36%,var(--ae-border))]',
              'hover:bg-[var(--ae-surface)] hover:text-[var(--ae-foreground)]',
            ].join(' ')
      }
    />
  )
}

function NavIcon({ label }: { label: string }) {
  return (
    <span
      className={[
        'grid h-8 w-8 shrink-0 place-items-center rounded-lg border',
        'border-[color-mix(in_srgb,var(--ae-accent)_22%,var(--ae-border))]',
        'bg-[color-mix(in_srgb,var(--ae-accent)_8%,transparent)]',
        'text-[var(--ae-accent)]',
      ].join(' ')}
      aria-hidden='true'
    >
      {label === 'Home' ? <HomeIcon /> : null}
      {label === 'About' ? <AboutIcon /> : null}
      {label === 'Pricing' ? <PricingIcon /> : null}
      {label === 'Contact' ? <MailIcon /> : null}
      {label === 'GitHub' ? <GitHubIcon /> : null}
    </span>
  )
}

function Icon({
  children,
  className = 'h-5 w-5',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      className={className}
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {children}
    </svg>
  )
}

function MenuIcon() {
  return (
    <Icon>
      <path d='M4 7h16M4 12h16M4 17h16' />
    </Icon>
  )
}

function CloseIcon() {
  return (
    <Icon>
      <path d='m6 6 12 12M18 6 6 18' />
    </Icon>
  )
}

function SunIcon() {
  return (
    <Icon>
      <circle cx='12' cy='12' r='3.5' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </Icon>
  )
}

function MoonIcon() {
  return (
    <Icon>
      <path d='M20 15.4A8 8 0 0 1 8.6 4a8 8 0 1 0 11.4 11.4Z' />
    </Icon>
  )
}

function HomeIcon() {
  return (
    <Icon className='h-4 w-4'>
      <path d='m3 11 9-8 9 8' />
      <path d='M5 10v10h14V10' />
      <path d='M9 20v-6h6v6' />
    </Icon>
  )
}

function AboutIcon() {
  return (
    <Icon className='h-4 w-4'>
      <circle cx='12' cy='12' r='9' />
      <path d='M12 11v5' />
      <path d='M12 8h.01' />
    </Icon>
  )
}

function PricingIcon() {
  return (
    <Icon className='h-4 w-4'>
      <path d='M20 13 11 22l-9-9V4h9l9 9Z' />
      <circle cx='7' cy='9' r='1' />
    </Icon>
  )
}

function MailIcon() {
  return (
    <Icon className='h-4 w-4'>
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <path d='m3 7 9 6 9-6' />
    </Icon>
  )
}

function GitHubIcon() {
  return (
    <Icon className='h-4 w-4'>
      <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.5a13.4 13.4 0 0 0-6 0C6.1-.4 4.9 0 4.9 0A5.4 5.4 0 0 0 4.7 3a5.8 5.8 0 0 0-1.5 4.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4' />
      <path d='M9 19c-3 .9-3-1.5-4.2-2' />
    </Icon>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d='m9 18 6-6-6-6' />
    </Icon>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d='M15 3h6v6' />
      <path d='m10 14 11-11' />
      <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
    </Icon>
  )
}
