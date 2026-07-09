import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'
export interface SpinnerProps extends ComponentPropsWithoutRef<'span'> {
  label?: string
}
export function Spinner({
  className,
  label = 'Loading',
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      aria-label={label}
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
      data-slot='spinner'
      role='status'
    />
  )
}
