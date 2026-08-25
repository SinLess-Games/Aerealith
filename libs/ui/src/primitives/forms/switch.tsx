import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';

export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'role'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      className,
      onClick,
      ...props
    },
    ref,
  ) {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = useState(defaultChecked);
    const active = isControlled ? checked : internal;

    return (
      <button
        {...props}
        aria-checked={active}
        className={cn(
          'inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-[var(--ae-input-border)] bg-[var(--ae-control)] p-0.5 outline-none transition-colors',
          'data-[state=checked]:border-[var(--ae-primary)] data-[state=checked]:bg-[var(--ae-primary)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ae-background)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        data-slot="switch"
        data-state={active ? 'checked' : 'unchecked'}
        onClick={(event) => {
          if (!isControlled) setInternal(!active);
          onCheckedChange?.(!active);
          onClick?.(event);
        }}
        ref={ref}
        role="switch"
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-5 rounded-full shadow-sm transition-[transform,background-color]',
            active
              ? 'translate-x-5 bg-[var(--ae-primary-foreground)]'
              : 'translate-x-0 bg-[var(--ae-foreground-muted)]',
          )}
        />
      </button>
    );
  },
);
