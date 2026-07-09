// libs/ui/src/primitives/display/badge.tsx

import type { ComponentPropsWithoutRef } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const badgeVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-full',
    'border font-medium leading-none whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        neutral: [
          'border-[var(--ae-border)] bg-[var(--ae-starlight-05)]',
          'text-[var(--ae-foreground)]',
        ],
        primary: [
          'border-[var(--ae-pink-30)] bg-[var(--ae-pink-12)]',
          'text-[var(--ae-primary)]',
        ],
        secondary: [
          'border-[var(--ae-violet-30)] bg-[var(--ae-violet-12)]',
          'text-[var(--ae-secondary)]',
        ],
        info: [
          'border-[var(--ae-cyan-30)] bg-[var(--ae-cyan-12)]',
          'text-[var(--ae-accent)]',
        ],
        success: [
          'border-[rgb(var(--ae-success-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-success-rgb)_/_0.14)]',
          'text-[var(--ae-success)]',
        ],
        warning: [
          'border-[rgb(var(--ae-warning-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-warning-rgb)_/_0.14)]',
          'text-[var(--ae-warning)]',
        ],
        danger: [
          'border-[rgb(var(--ae-danger-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-danger-rgb)_/_0.14)]',
          'text-[var(--ae-danger)]',
        ],
      },
      size: {
        sm: 'min-h-5 px-2 text-xs',
        md: 'min-h-6 px-2.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  },
)

export type BadgeProps = Readonly<ComponentPropsWithoutRef<'span'>> &
  Readonly<VariantProps<typeof badgeVariants>>

/**
 * A compact label for categories, counts, states, and non-interactive status
 * information.
 *
 * Use a `Badge` to supplement meaningful text, not as the only indication of a
 * critical state. Important errors, warnings, and updates should also be
 * announced through clear text or a dedicated status pattern.
 *
 * @example
 * <Badge>Beta</Badge>
 *
 * @example
 * <Badge variant="success">Connected</Badge>
 *
 * @example
 * <Badge variant="danger">Action required</Badge>
 */
export function Badge({ className, size, variant, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        badgeVariants({
          size,
          variant,
        }),
        className,
      )}
      data-slot='badge'
    />
  )
}
