// libs/ui/src/primitives/accessibility/visually-hidden.tsx

import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../../lib/cn'

export type VisuallyHiddenProps = Readonly<ComponentPropsWithoutRef<'span'>>

/**
 * Visually hides content while keeping it available to screen readers.
 *
 * Use this for accessible labels, instructions, and context that should not
 * take up visible space in the interface.
 *
 * @example
 * <button type="button">
 *   <Menu01Icon aria-hidden="true" />
 *   <VisuallyHidden>Open navigation menu</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return (
    <span
      {...props}
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        '[-webkit-clip-path:inset(50%)] [clip-path:inset(50%)]',
        '[-webkit-mask:none] [mask:none]',
        '[-moz-clip:rect(0,0,0,0)] [clip:rect(0,0,0,0)]',
        className,
      )}
    />
  )
}
