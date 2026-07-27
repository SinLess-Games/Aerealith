import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import { cn } from '@aerealith-ai/ui'
import { Link } from 'react-router'

import type { DocsAudience } from '../../../../lib/docs-source'

export interface DocsAudienceCardProps extends Omit<
  ComponentPropsWithoutRef<'article'>,
  'title'
> {
  /**
   * Documentation collection represented by the card.
   */
  audience: DocsAudience

  /**
   * Optional title override.
   */
  title?: string

  /**
   * Optional description override.
   */
  description?: string

  /**
   * Optional navigation destination.
   *
   * Defaults to the root route for the selected audience.
   */
  href?: string

  /**
   * Small label shown above the card title.
   */
  eyebrow?: string

  /**
   * Optional badge shown beside the eyebrow.
   */
  badge?: ReactNode

  /**
   * Highlighted capabilities or topics covered by the documentation.
   */
  features?: readonly string[]

  /**
   * Call-to-action label.
   */
  actionLabel?: string

  /**
   * Optional icon override.
   */
  icon?: ReactNode
}

interface AudienceDefaults {
  actionLabel: string
  description: string
  eyebrow: string
  features: readonly string[]
  title: string
}

/**
 * Entry card for the user and developer documentation collections.
 *
 * The card is designed for the documentation landing page and keeps its
 * content configurable so it can also be reused in onboarding and search
 * empty states.
 */
export function DocsAudienceCard({
  actionLabel,
  audience,
  badge,
  className,
  description,
  eyebrow,
  features,
  href,
  icon,
  title,
  ...props
}: Readonly<DocsAudienceCardProps>) {
  const titleId = useId()
  const descriptionId = useId()
  const defaults = getAudienceDefaults(audience)

  const resolvedTitle = title ?? defaults.title
  const resolvedDescription = description ?? defaults.description
  const resolvedEyebrow = eyebrow ?? defaults.eyebrow
  const resolvedFeatures = features ?? defaults.features
  const resolvedActionLabel = actionLabel ?? defaults.actionLabel
  const resolvedHref = href ?? `/documentation/${audience}`

  return (
    <article
      {...props}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={cn(
        'group relative isolate flex min-h-full flex-col overflow-hidden',
        'rounded-3xl border border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-surface)_82%,transparent)]',
        'p-6 shadow-[0_22px_65px_rgba(0,0,0,0.16)]',
        'backdrop-blur-2xl transition duration-300',
        'hover:-translate-y-1',
        'hover:border-[color-mix(in_srgb,var(--ae-accent)_42%,var(--ae-border))]',
        'hover:shadow-[0_30px_80px_rgba(0,0,0,0.24)]',
        'sm:p-7',
        className,
      )}
      data-audience={audience}
      data-slot='docs-audience-card'
    >
      <div
        aria-hidden='true'
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 opacity-70',
          audience === 'developer'
            ? 'bg-[radial-gradient(circle_at_85%_8%,color-mix(in_srgb,var(--ae-secondary)_18%,transparent),transparent_38%)]'
            : 'bg-[radial-gradient(circle_at_85%_8%,color-mix(in_srgb,var(--ae-accent)_18%,transparent),transparent_38%)]',
        )}
      />

      <div
        aria-hidden='true'
        className={cn(
          'pointer-events-none absolute right-0 bottom-0 -z-10',
          'size-44 translate-x-14 translate-y-14 rounded-full blur-3xl',
          audience === 'developer'
            ? 'bg-[color-mix(in_srgb,var(--ae-secondary)_12%,transparent)]'
            : 'bg-[color-mix(in_srgb,var(--ae-accent)_12%,transparent)]',
        )}
      />

      <header className='flex items-start gap-4'>
        <div
          className={cn(
            'relative grid size-13 shrink-0 place-items-center rounded-2xl',
            'border border-[var(--ae-border)]',
            'bg-[color-mix(in_srgb,var(--ae-background)_72%,transparent)]',
            'text-[var(--ae-accent)]',
            'shadow-[0_12px_35px_rgba(0,0,0,0.14)]',
          )}
        >
          {icon ?? <AudienceIcon audience={audience} />}
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={cn(
                'text-xs font-semibold tracking-[0.14em] uppercase',
                'text-[var(--ae-foreground-muted)]',
              )}
            >
              {resolvedEyebrow}
            </span>

            {badge ? (
              <span
                className={cn(
                  'inline-flex min-h-6 items-center rounded-full border px-2',
                  'border-[var(--ae-border)]',
                  'bg-[color-mix(in_srgb,var(--ae-background)_68%,transparent)]',
                  'text-[0.6875rem] font-semibold',
                  'text-[var(--ae-foreground-muted)]',
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>

          <h2
            id={titleId}
            className={cn(
              'mt-2 text-2xl font-semibold tracking-tight',
              'text-[var(--ae-foreground)] sm:text-3xl',
            )}
            style={{ fontFamily: 'var(--ae-font-heading)' }}
          >
            {resolvedTitle}
          </h2>
        </div>
      </header>

      <p
        id={descriptionId}
        className={cn(
          'mt-5 text-sm leading-7',
          'text-[var(--ae-foreground-muted)] sm:text-base',
        )}
      >
        {resolvedDescription}
      </p>

      {resolvedFeatures.length > 0 ? (
        <ul
          className='mt-6 grid gap-3'
          aria-label={`${resolvedTitle} includes`}
        >
          {resolvedFeatures.map((feature) => (
            <li
              key={feature}
              className='flex items-start gap-3 text-sm leading-6'
            >
              <span
                aria-hidden='true'
                className={cn(
                  'mt-1 grid size-5 shrink-0 place-items-center rounded-full',
                  'border border-[color-mix(in_srgb,var(--ae-accent)_32%,var(--ae-border))]',
                  'bg-[color-mix(in_srgb,var(--ae-accent)_10%,transparent)]',
                  'text-[var(--ae-accent)]',
                )}
              >
                <CheckIcon />
              </span>

              <span className='text-[var(--ae-foreground-muted)]'>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className='mt-auto pt-7'>
        <Link
          to={resolvedHref}
          className={cn(
            'group/link inline-flex min-h-11 w-full items-center',
            'justify-between gap-3 rounded-xl border px-4',
            'border-[var(--ae-border)]',
            'bg-[color-mix(in_srgb,var(--ae-background)_72%,transparent)]',
            'text-sm font-semibold text-[var(--ae-foreground)]',
            'transition duration-200',
            'hover:border-[color-mix(in_srgb,var(--ae-accent)_48%,var(--ae-border))]',
            'hover:bg-[color-mix(in_srgb,var(--ae-accent)_9%,var(--ae-background))]',
            'hover:text-[var(--ae-accent)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--ae-accent)]',
          )}
        >
          <span>{resolvedActionLabel}</span>

          <ArrowRightIcon
            className={cn(
              'size-4 shrink-0 transition-transform duration-200',
              'group-hover/link:translate-x-1',
            )}
          />
        </Link>
      </div>
    </article>
  )
}

function getAudienceDefaults(audience: DocsAudience): AudienceDefaults {
  if (audience === 'developer') {
    return {
      actionLabel: 'Explore developer docs',
      description:
        'Architecture, APIs, integrations, local development, security controls, and contribution guidance for engineers building with Aerealith.',
      eyebrow: 'Build with Aerealith',
      features: [
        'Architecture and module boundaries',
        'API and integration references',
        'Development and deployment workflows',
      ],
      title: 'Developer documentation',
    }
  }

  return {
    actionLabel: 'Explore user docs',
    description:
      'Practical guidance for setting up Aerealith, configuring your workspace, using assistants, and managing everyday platform features.',
    eyebrow: 'Use Aerealith',
    features: [
      'Setup and account configuration',
      'Assistant and workspace guidance',
      'Troubleshooting and common workflows',
    ],
    title: 'User documentation',
  }
}

function AudienceIcon({ audience }: Readonly<{ audience: DocsAudience }>) {
  if (audience === 'developer') {
    return <DeveloperIcon />
  }

  return <UserGuideIcon />
}

function UserGuideIcon() {
  return (
    <svg aria-hidden='true' className='size-6' fill='none' viewBox='0 0 24 24'>
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

function DeveloperIcon() {
  return (
    <svg aria-hidden='true' className='size-6' fill='none' viewBox='0 0 24 24'>
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

function CheckIcon() {
  return (
    <svg aria-hidden='true' className='size-3' fill='none' viewBox='0 0 12 12'>
      <path
        d='m2.25 6.25 2.25 2.25 5.25-5.25'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.5'
      />
    </svg>
  )
}

function ArrowRightIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden='true'
      className={className}
      fill='none'
      viewBox='0 0 24 24'
    >
      <path
        d='M5 12h14m-5-5 5 5-5 5'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.75'
      />
    </svg>
  )
}

export default DocsAudienceCard
