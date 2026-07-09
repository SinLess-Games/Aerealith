// libs/ui/src/primitives/actions/link.tsx

import type { ComponentPropsWithoutRef } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const linkVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-sm',
    'font-medium outline-none transition-colors',
    'focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[var(--ae-background)]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-[var(--ae-primary)]',
          'hover:text-[var(--ae-primary)] hover:underline',
        ],
        secondary: [
          'text-[var(--ae-foreground)]',
          'hover:text-[var(--ae-primary)] hover:underline',
        ],
        muted: [
          'text-[var(--ae-muted-foreground)]',
          'hover:text-[var(--ae-foreground)] hover:underline',
        ],
      },
      underline: {
        always: 'underline underline-offset-4',
        hover: 'no-underline hover:underline hover:underline-offset-4',
        never: 'no-underline',
      },
    },
    defaultVariants: {
      variant: 'primary',
      underline: 'hover',
    },
  },
)

export type LinkProps = Readonly<Omit<ComponentPropsWithoutRef<'a'>, 'href'>> &
  Readonly<
    VariantProps<typeof linkVariants> & {
      /**
       * The destination URL or hash target.
       */
      readonly href: string
    }
  >

/**
 * A styled native anchor element for external URLs, page anchors, and standard
 * document navigation.
 *
 * Keep routing-specific links in the application layer so this UI library does
 * not depend on React Router.
 *
 * @example
 * <Link href="https://aerealith.com">Visit Aerealith</Link>
 *
 * @example
 * <Link href="#main-content">Skip to main content</Link>
 */
export function Link({
  className,
  href,
  rel,
  target,
  underline,
  variant,
  ...props
}: LinkProps) {
  const opensInNewTab = target === '_blank'
  const resolvedRel =
    opensInNewTab && !rel?.includes('noopener')
      ? [rel, 'noopener noreferrer'].filter(Boolean).join(' ')
      : rel

  return (
    <a
      {...props}
      className={cn(linkVariants({ underline, variant }), className)}
      href={href}
      rel={resolvedRel}
      target={target}
    />
  )
}
