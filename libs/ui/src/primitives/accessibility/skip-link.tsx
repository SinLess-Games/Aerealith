// libs/ui/src/primitives/accessibility/skip-link.tsx

import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'

export type SkipLinkProps = Readonly<
  Omit<ComponentPropsWithoutRef<'a'>, 'children' | 'href'>
> & {
  /**
   * The ID of the page landmark to focus after activating the link.
   *
   * @defaultValue 'main-content'
   */
  readonly targetId?: string

  /**
   * Accessible text shown when the link receives keyboard focus.
   *
   * @defaultValue 'Skip to main content'
   */
  readonly children?: ReactNode
}

/**
 * Provides keyboard users a fast path past repeated navigation to the page's
 * primary content landmark.
 *
 * The target element should use the matching `id` and be focusable, usually:
 *
 * @example
 * <main id="main-content" tabIndex={-1}>
 *   ...
 * </main>
 */
export function SkipLink({
  children = 'Skip to main content',
  className,
  targetId = 'main-content',
  ...props
}: SkipLinkProps) {
  return (
    <a
      {...props}
      className={cn(
        'fixed top-4 left-4 z-[100] -translate-y-24 rounded-md',
        'bg-[var(--ae-primary)] px-4 py-2 text-sm font-semibold',
        'text-[var(--ae-on-primary)] shadow-lg outline-none',
        'transition-transform duration-200',
        'focus:translate-y-0 focus-visible:ring-2',
        'focus-visible:ring-[var(--ae-focus-ring)] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--ae-background)]',
        className,
      )}
      href={`#${targetId}`}
    >
      {children}
    </a>
  )
}
