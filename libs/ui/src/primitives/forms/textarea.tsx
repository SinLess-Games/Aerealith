import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'
export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full resize-y rounded-md border border-[var(--ae-input)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      data-slot='textarea'
    />
  )
}
