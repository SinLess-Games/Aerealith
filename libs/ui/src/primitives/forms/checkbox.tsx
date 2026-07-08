import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
export interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type'
> {
  label?: string;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, label, id, ...props }, ref) {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    return (
      <span
        className="inline-flex items-center gap-2"
        data-slot="checkbox-root"
      >
        <input
          {...props}
          className={cn(
            'size-4 rounded border-[var(--ae-input)] accent-[var(--ae-primary)]',
            className,
          )}
          data-slot="checkbox"
          id={resolvedId}
          ref={ref}
          type="checkbox"
        />
        {label && <label htmlFor={resolvedId}>{label}</label>}
      </span>
    );
  },
);
