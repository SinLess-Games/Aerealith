import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@aerealith-ai/ui'
import { NavLink } from 'react-router'

import type { DocsAudience } from '../../../../lib/docs-source'

export type DocsAudienceSwitcherSize = 'compact' | 'default'

export type DocsAudienceSwitcherOrientation = 'horizontal' | 'vertical'

export interface DocsAudienceSwitcherProps extends Omit<
  ComponentPropsWithoutRef<'nav'>,
  'children'
> {
  /**
   * Controls the overall size of the switcher.
   */
  size?: DocsAudienceSwitcherSize

  /**
   * Controls whether the audience links are displayed beside or above one
   * another.
   */
  orientation?: DocsAudienceSwitcherOrientation

  /**
   * Show an icon beside each audience label.
   */
  showIcons?: boolean

  /**
   * Show the descriptive subtitle beneath each audience label.
   */
  showDescriptions?: boolean

  /**
   * Optional destination override for the user documentation.
   */
  userHref?: string

  /**
   * Optional destination override for the developer documentation.
   */
  developerHref?: string
}

interface AudienceOption {
  audience: DocsAudience
  description: string
  href: string
  icon: ReactNode
  label: string
}

/**
 * Switches between Aerealith user and developer documentation.
 *
 * React Router determines the active audience from the current URL, so the
 * switcher does not require its own state.
 */
export function DocsAudienceSwitcher({
  className,
  developerHref = '/documentation/developer',
  orientation = 'horizontal',
  showDescriptions = false,
  showIcons = true,
  size = 'default',
  userHref = '/documentation/user',
  ...props
}: Readonly<DocsAudienceSwitcherProps>) {
  const options: readonly AudienceOption[] = [
    {
      audience: 'user',
      description: 'Guides and platform workflows',
      href: userHref,
      icon: <UserDocsIcon />,
      label: 'User docs',
    },
    {
      audience: 'developer',
      description: 'Architecture, APIs, and integrations',
      href: developerHref,
      icon: <DeveloperDocsIcon />,
      label: 'Developer docs',
    },
  ]

  return (
    <nav
      {...props}
      aria-label={props['aria-label'] ?? 'Documentation audience'}
      className={cn(
        'relative rounded-xl border p-1',
        'border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-background)_20%,transparent)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
        'backdrop-blur-xl',
        orientation === 'horizontal'
          ? 'grid grid-cols-2 gap-1'
          : 'flex flex-col gap-1',
        className,
      )}
      data-orientation={orientation}
      data-size={size}
      data-slot='docs-audience-switcher'
    >
      {options.map((option) => (
        <DocsAudienceOption
          key={option.audience}
          option={option}
          orientation={orientation}
          showDescription={showDescriptions}
          showIcon={showIcons}
          size={size}
        />
      ))}
    </nav>
  )
}

interface DocsAudienceOptionProps {
  option: AudienceOption
  orientation: DocsAudienceSwitcherOrientation
  showDescription: boolean
  showIcon: boolean
  size: DocsAudienceSwitcherSize
}

function DocsAudienceOption({
  option,
  orientation,
  showDescription,
  showIcon,
  size,
}: Readonly<DocsAudienceOptionProps>) {
  return (
    <NavLink
      to={option.href}
      data-audience={option.audience}
      className={({ isActive }) =>
        cn(
          'group relative isolate flex min-w-0 items-center rounded-lg',
          'font-semibold transition duration-200',
          'focus-visible:z-10 focus-visible:outline-2',
          'focus-visible:outline-offset-1',
          'focus-visible:outline-[var(--ae-accent)]',
          size === 'compact'
            ? 'min-h-9 gap-2 px-3 text-xs'
            : 'min-h-11 gap-3 px-3 text-sm',
          orientation === 'horizontal' ? 'justify-center' : 'justify-start',
          showDescription && 'items-start py-2.5',
          isActive
            ? cn(
                'bg-[color-mix(in_srgb,var(--ae-background)_38%,transparent)]',
                'text-[var(--ae-foreground)]',
                'ring-1 ring-[color-mix(in_srgb,var(--ae-accent)_55%,transparent)]',
                'shadow-[0_5px_18px_rgba(0,0,0,0.16)]',
              )
            : cn(
                'bg-[color-mix(in_srgb,var(--ae-background)_18%,transparent)]',
                'text-[var(--ae-foreground)]',
                'hover:bg-[color-mix(in_srgb,var(--ae-background)_45%,transparent)]',
                'hover:text-[var(--ae-foreground)]',
              ),
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute inset-0 -z-10 rounded-lg',
              'opacity-0 transition-opacity duration-200',
              isActive &&
                cn(
                  'opacity-100',
                  option.audience === 'developer'
                    ? 'bg-[radial-gradient(circle_at_75%_0%,color-mix(in_srgb,var(--ae-secondary)_10%,transparent),transparent_55%)]'
                    : 'bg-[radial-gradient(circle_at_75%_0%,color-mix(in_srgb,var(--ae-accent)_10%,transparent),transparent_55%)]',
                ),
            )}
          />

          {showIcon ? (
            <span
              aria-hidden='true'
              className={cn(
                'grid shrink-0 place-items-center rounded-md',
                'border transition duration-200',
                size === 'compact' ? 'size-6' : 'size-8',
                isActive
                  ? cn(
                      'border-[color-mix(in_srgb,var(--ae-accent)_35%,var(--ae-border))]',
                      'bg-[color-mix(in_srgb,var(--ae-accent)_10%,transparent)]',
                      'text-[var(--ae-accent)]',
                    )
                  : cn(
                      'border-transparent',
                      'text-[var(--ae-foreground-muted)]',
                      'group-hover:text-[var(--ae-foreground)]',
                    ),
              )}
            >
              {option.icon}
            </span>
          ) : null}

          <span
            className={cn(
              'min-w-0',
              showDescription ? 'flex-1 text-left' : 'truncate',
            )}
          >
            <span className='block truncate'>{option.label}</span>

            {showDescription ? (
              <span
                className={cn(
                  'mt-0.5 block text-xs leading-5 font-normal',
                  isActive
                    ? 'text-[color-mix(in_srgb,var(--ae-accent)_72%,var(--ae-foreground-muted))]'
                    : 'text-[var(--ae-foreground-muted)]',
                )}
              >
                {option.description}
              </span>
            ) : null}
          </span>

          {orientation === 'vertical' ? (
            <ChevronRightIcon
              className={cn(
                'ml-auto size-4 shrink-0 transition-transform',
                isActive
                  ? 'translate-x-0 text-[var(--ae-accent)]'
                  : '-translate-x-0.5 opacity-45 group-hover:translate-x-0',
              )}
            />
          ) : null}

          {isActive ? (
            <span className='sr-only'>Current documentation section</span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

function UserDocsIcon() {
  return (
    <svg aria-hidden='true' className='size-4' fill='none' viewBox='0 0 24 24'>
      <path
        d='M5.5 4.75h8.25A2.25 2.25 0 0 1 16 7v12.25H7.75A2.25 2.25 0 0 1 5.5 17V4.75Z'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.7'
      />

      <path
        d='M16 7h1.25a2.25 2.25 0 0 1 2.25 2.25V19.25H16M8.75 9h4M8.75 12.25h4'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.7'
      />
    </svg>
  )
}

function DeveloperDocsIcon() {
  return (
    <svg aria-hidden='true' className='size-4' fill='none' viewBox='0 0 24 24'>
      <path
        d='m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.7'
      />
    </svg>
  )
}

function ChevronRightIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden='true'
      className={className}
      fill='none'
      viewBox='0 0 24 24'
    >
      <path
        d='m9 6 6 6-6 6'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.75'
      />
    </svg>
  )
}

export default DocsAudienceSwitcher
