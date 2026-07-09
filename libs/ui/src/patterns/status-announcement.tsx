import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'

export interface StatusAnnouncementProps extends ComponentPropsWithoutRef<'div'> {
  priority?: 'polite' | 'assertive'
}
export function StatusAnnouncement({
  className,
  priority = 'polite',
  ...props
}: StatusAnnouncementProps) {
  return (
    <div
      {...props}
      aria-atomic='true'
      aria-live={priority}
      className={cn('text-sm', className)}
      data-slot='status-announcement'
      role={priority === 'assertive' ? 'alert' : 'status'}
    />
  )
}
