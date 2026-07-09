import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'
export function Skeleton({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      aria-hidden='true'
      className={cn('animate-pulse rounded-md bg-[var(--ae-muted)]', className)}
      data-slot='skeleton'
    />
  )
}
