import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
export {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogPortal as SheetPortal,
  DialogOverlay as SheetOverlay,
  DialogHeader as SheetHeader,
  DialogFooter as SheetFooter,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
} from './dialog';
import { DialogContent } from './dialog';
export interface SheetContentProps extends ComponentPropsWithoutRef<
  typeof DialogContent
> {
  side?: 'top' | 'right' | 'bottom' | 'left';
}
export function SheetContent({
  side = 'right',
  className,
  ...props
}: SheetContentProps) {
  return (
    <DialogContent
      {...props}
      className={cn(
        'fixed m-0 max-h-full max-w-full translate-x-0 translate-y-0 rounded-none',
        side === 'right' && 'inset-y-0 right-0 left-auto h-full w-3/4',
        side === 'left' && 'inset-y-0 left-0 top-0 h-full w-3/4',
        side === 'top' && 'inset-x-0 top-0 left-0 w-full',
        side === 'bottom' && 'inset-x-0 bottom-0 left-0 top-auto w-full',
        className,
      )}
      data-side={side}
      data-slot="sheet-content"
    />
  );
}
