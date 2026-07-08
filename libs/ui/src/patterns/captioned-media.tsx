import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
export interface CaptionedMediaProps extends ComponentPropsWithoutRef<'figure'> {
  caption: ReactNode;
}
export function CaptionedMedia({
  caption,
  children,
  className,
  ...props
}: CaptionedMediaProps) {
  return (
    <figure
      {...props}
      className={cn('space-y-2', className)}
      data-slot="captioned-media"
    >
      {children}
      <figcaption className="text-sm text-[var(--ae-muted-foreground)]">
        {caption}
      </figcaption>
    </figure>
  );
}
