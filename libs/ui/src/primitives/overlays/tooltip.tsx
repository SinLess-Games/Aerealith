import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
const TooltipContext = createContext<
  { open: boolean; setOpen: (open: boolean) => void } | undefined
>(undefined);
export function TooltipProvider({
  children,
}: {
  children: ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}
export function Tooltip({
  children,
  defaultOpen = false,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
}
export function TooltipTrigger({ children }: { children: ReactElement }) {
  const context = useContext(TooltipContext);
  if (!context || !isValidElement(children))
    throw new Error(
      'TooltipTrigger must be used within Tooltip with one child',
    );
  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': context.open ? 'tooltip-content' : undefined,
    onFocus: () => context.setOpen(true),
    onBlur: () => context.setOpen(false),
    onMouseEnter: () => context.setOpen(true),
    onMouseLeave: () => context.setOpen(false),
  });
}
export function TooltipContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(TooltipContext);
  if (!context?.open) return null;
  return (
    <div
      className={cn(
        'z-50 rounded bg-[var(--ae-foreground)] px-2 py-1 text-xs text-[var(--ae-background)]',
        className,
      )}
      data-slot="tooltip-content"
      id="tooltip-content"
      role="tooltip"
    >
      {children}
    </div>
  );
}
