import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full resize-y rounded-md border border-[var(--ae-input-border)] bg-[var(--ae-input-background)] px-3 py-2 text-sm text-[var(--ae-foreground)] outline-none transition-colors',
        'hover:border-[var(--ae-input-border-hover)] hover:bg-[var(--ae-input-background-hover)]',
        'focus-visible:border-[var(--ae-input-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
        'aria-invalid:border-[var(--ae-danger)] disabled:cursor-not-allowed disabled:bg-[var(--ae-input-background-disabled)] disabled:opacity-60',
        className,
      )}
      data-slot="textarea"
    />
  );
}
