import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'
export interface SwitchProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'role'
> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
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
    const isControlled = checked !== undefined
    const [internal, setInternal] = React.useState(defaultChecked)
    const active = isControlled ? checked : internal
    return (
      <button
        {...props}
        aria-checked={active}
        className={cn(
          'inline-flex h-6 w-11 items-center rounded-full bg-[var(--ae-muted)] p-0.5 data-[state=checked]:bg-[var(--ae-primary)]',
          className,
        )}
        data-slot='switch'
        data-state={active ? 'checked' : 'unchecked'}
        onClick={(event) => {
          if (!isControlled) setInternal(!active)
          onCheckedChange?.(!active)
          onClick?.(event)
        }}
        ref={ref}
        role='switch'
      >
        <span
          aria-hidden='true'
          className={cn(
            'size-5 rounded-full bg-white transition-transform',
            active && 'translate-x-5',
          )}
        />
      </button>
    )
  },
)
import * as React from 'react'
