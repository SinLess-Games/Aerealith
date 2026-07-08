// libs/ui/src/primitives/display/separator.tsx

import type { ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

export const separatorVariants = cva('shrink-0 bg-[var(--ae-border)]', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px self-stretch',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

export type SeparatorProps = Readonly<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    'aria-hidden' | 'aria-orientation' | 'children' | 'role'
  >
> &
  Readonly<
    VariantProps<typeof separatorVariants> & {
      /**
       * Hides the separator from assistive technology when it is purely visual.
       *
       * @defaultValue false
       */
      readonly decorative?: boolean;
    }
  >;

/**
 * Separates related content horizontally or vertically.
 *
 * Use the default semantic separator when the divider conveys structure.
 * Use `decorative` when the line is purely visual.
 *
 * @example
 * <Separator />
 *
 * @example
 * <Separator orientation="vertical" />
 *
 * @example
 * <Separator decorative />
 */
export function Separator({
  className,
  decorative = false,
  orientation,
  ...props
}: SeparatorProps) {
  const resolvedOrientation = orientation ?? 'horizontal';

  return (
    <div
      {...props}
      aria-hidden={decorative || undefined}
      aria-orientation={decorative ? undefined : resolvedOrientation}
      className={cn(
        separatorVariants({
          orientation: resolvedOrientation,
        }),
        className,
      )}
      data-slot="separator"
      role={decorative ? undefined : 'separator'}
    />
  );
}
