import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { VisuallyHidden } from '../primitives/accessibility/visually-hidden';

export interface TextAlternativeProps extends ComponentPropsWithoutRef<'span'> {
  children: ReactNode;
  visible?: boolean;
}
export function TextAlternative({
  children,
  visible = false,
  ...props
}: TextAlternativeProps) {
  return visible ? (
    <span {...props} data-slot="text-alternative">
      {children}
    </span>
  ) : (
    <VisuallyHidden {...props} data-slot="text-alternative">
      {children}
    </VisuallyHidden>
  );
}
