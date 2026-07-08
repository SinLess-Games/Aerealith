// libs/ui/src/primitives/actions/icon-button.tsx

import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Button, type ButtonProps } from './button';

const iconButtonSizeClasses = {
  sm: 'h-10 w-10 min-h-10 min-w-10 p-0',
  md: 'h-11 w-11 min-h-11 min-w-11 p-0',
  lg: 'h-12 w-12 min-h-12 min-w-12 p-0',
} as const;

type IconButtonSize = keyof typeof iconButtonSizeClasses;

export type IconButtonProps = Readonly<
  Omit<ButtonProps, 'aria-label' | 'children' | 'fullWidth'>
> &
  Readonly<{
    /**
     * Describes the button's action for screen-reader users.
     *
     * Icon-only buttons must always provide a meaningful accessible label.
     *
     * @example
     * aria-label="Open navigation menu"
     */
    readonly 'aria-label': string;

    /**
     * The icon displayed inside the button.
     *
     * Pass icons with `aria-hidden="true"` because the button's accessible
     * name comes from `aria-label`.
     */
    readonly children: ReactNode;
  }>;

/**
 * A compact icon-only button with a required accessible label.
 *
 * Use this for familiar actions such as opening navigation, closing a dialog,
 * refreshing data, or opening a contextual menu.
 *
 * @example
 * <IconButton aria-label="Open navigation menu">
 *   <Menu01Icon aria-hidden="true" />
 * </IconButton>
 */
export function IconButton({
  'aria-label': ariaLabel,
  children,
  className,
  size,
  ...props
}: IconButtonProps) {
  const accessibleLabel = ariaLabel.trim();
  const resolvedSize: IconButtonSize = size ?? 'md';

  if (accessibleLabel.length === 0) {
    throw new Error(
      'IconButton requires a non-empty aria-label describing its action.',
    );
  }

  return (
    <Button
      {...props}
      aria-label={accessibleLabel}
      className={cn(iconButtonSizeClasses[resolvedSize], className)}
      size={resolvedSize}
    >
      {children}
    </Button>
  );
}
