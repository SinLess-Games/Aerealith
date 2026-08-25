// libs/ui/src/primitives/actions/button.tsx

import type { ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md',
    'font-medium outline-none transition-colors',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ae-background)]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--ae-primary)] text-[var(--ae-primary-foreground)]',
          'hover:bg-[var(--ae-primary-hover)] active:bg-[var(--ae-primary-active)] active:text-[var(--ae-primary-active-foreground)]',
        ],
        secondary: [
          'bg-[var(--ae-secondary)] text-[var(--ae-secondary-foreground)]',
          'hover:bg-[var(--ae-secondary-hover)] active:bg-[var(--ae-secondary-active)] active:text-[var(--ae-secondary-active-foreground)]',
        ],
        outline: [
          'border border-[var(--ae-control-border)] bg-[var(--ae-control)]',
          'text-[var(--ae-foreground)]',
          'hover:bg-[var(--ae-control-hover)] active:bg-[var(--ae-control-active)]',
        ],
        ghost: [
          'bg-transparent text-[var(--ae-foreground)]',
          'hover:bg-[var(--ae-control-hover)] active:bg-[var(--ae-control-active)]',
        ],
        danger: [
          'bg-[var(--ae-danger)] text-[var(--ae-danger-contrast)]',
          'hover:bg-[var(--ae-danger-hover)]',
        ],
      },
      size: {
        sm: 'min-h-8 px-3 text-sm',
        md: 'min-h-10 px-4 text-sm',
        lg: 'min-h-12 px-5 text-base',
      },
      fullWidth: {
        false: '',
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonProps = Readonly<ComponentPropsWithoutRef<'button'>> &
  Readonly<VariantProps<typeof buttonVariants>>;

/**
 * A styled native button for actions throughout the Aerealith interface.
 *
 * Use `variant="primary"` for the page's main action. Use lower-emphasis
 * variants for secondary, optional, or destructive actions.
 *
 * @example
 * <Button type="submit">Save changes</Button>
 *
 * @example
 * <Button variant="outline">Cancel</Button>
 */
export function Button({
  className,
  fullWidth,
  size,
  type = 'button',
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        buttonVariants({
          fullWidth,
          size,
          variant,
        }),
        className,
      )}
      type={type}
    />
  );
}
