import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
type DialogState = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = createContext<DialogState | undefined>(undefined);
function useDialog() {
  const state = useContext(DialogContext);
  if (!state) throw new Error('Dialog components must be used within Dialog');
  return state;
}
export interface DialogProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function Dialog({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const current = open ?? internal;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  return (
    <DialogContext.Provider value={{ open: current, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}
export function DialogTrigger({
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const dialog = useDialog();
  return (
    <button
      {...props}
      aria-expanded={dialog.open}
      data-slot="dialog-trigger"
      onClick={(event) => {
        dialog.setOpen(true);
        onClick?.(event);
      }}
    />
  );
}
export function DialogClose({
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const dialog = useDialog();
  return (
    <button
      {...props}
      data-slot="dialog-close"
      onClick={(event) => {
        dialog.setOpen(false);
        onClick?.(event);
      }}
    />
  );
}
export function DialogPortal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function DialogOverlay({
  className,
  onClick,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const dialog = useDialog();
  if (!dialog.open) return null;
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn('fixed inset-0 z-50 bg-black/70', className)}
      data-slot="dialog-overlay"
      onClick={(event) => {
        dialog.setOpen(false);
        onClick?.(event);
      }}
    />
  );
}
export function DialogContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const dialog = useDialog();
  if (!dialog.open) return null;
  return (
    <div
      {...props}
      aria-modal="true"
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[var(--ae-surface)] p-6 shadow-xl',
        className,
      )}
      data-slot="dialog-content"
      role="dialog"
    >
      {children}
    </div>
  );
}
export function DialogHeader(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="dialog-header" />;
}
export function DialogFooter(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="dialog-footer" />;
}
export function DialogTitle(props: ComponentPropsWithoutRef<'h2'>) {
  return <h2 {...props} data-slot="dialog-title" />;
}
export function DialogDescription(props: ComponentPropsWithoutRef<'p'>) {
  return <p {...props} data-slot="dialog-description" />;
}
