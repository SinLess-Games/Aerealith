import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cn } from '../lib/cn'
export interface ReadableContentProps extends ComponentPropsWithoutRef<'article'> {
  as?: ElementType
}
export function ReadableContent({
  as: Component = 'article',
  className,
  ...props
}: ReadableContentProps) {
  return (
    <Component
      {...props}
      className={cn(
        'mx-auto max-w-[70ch] text-pretty leading-relaxed',
        className,
      )}
      data-slot='readable-content'
    />
  )
}
