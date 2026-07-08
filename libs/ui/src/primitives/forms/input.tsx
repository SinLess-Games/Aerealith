import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
export function Input({
  className,
  type = 'text',
  ...props
}: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-md border border-[var(--ae-input)] bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      data-slot="input"
      type={type}
    />
  );
}
